import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

/**
 * Event registrations (single-table DynamoDB, entityType = 'registration').
 *
 * GET    /api/registrations[?eventId=&personId=&id=]
 * POST   /api/registrations            { eventId, personId, rsvp } (upsert)
 * PUT    /api/registrations?id=reg-1   { rsvp?, checkedIn? }
 * DELETE /api/registrations?id=reg-1 | ?eventId=&personId=
 *
 * Check-in (officers / admins only, verified by actorId):
 * POST   /api/registrations?action=checkin  { id, actorId }  → checks in + issues the certificate
 * POST   /api/registrations?action=checkout { id, actorId }  → undo a check-in
 * GET    /api/registrations?action=certificate&id=reg-1&personId=per-1
 *        → the certificate PDF (redirect to a short-lived S3 link, or generated on the fly
 *          when S3 isn't configured). Only for checked-in registrations.
 *
 * Certificates are saved to s3://$AWS_S3_BUCKET_NAME/certificates/<eventId>/<certificateId>.pdf
 */

function getDynamoDocClient() {
  const region = process.env.APP_AWS_REGION || process.env.AWS_REGION || 'ap-southeast-1';
  const accessKeyId = process.env.APP_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.APP_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      'AWS credentials missing. Please set APP_AWS_ACCESS_KEY_ID and APP_AWS_SECRET_ACCESS_KEY in Vercel Project Settings.'
    );
  }

  const raw = new DynamoDBClient({
    region,
    credentials: {
      accessKeyId: accessKeyId.trim(),
      secretAccessKey: secretAccessKey.trim(),
    },
  });

  return {
    client: DynamoDBDocumentClient.from(raw, {
      marshallOptions: { removeUndefinedValues: true },
    }),
    tableName: process.env.DYNAMODB_TABLE_NAME || 'aws_events',
  };
}

async function scanType(client: DynamoDBDocumentClient, tableName: string, type: string): Promise<any[]> {
  const items: any[] = [];
  let ExclusiveStartKey: Record<string, any> | undefined;
  do {
    const page = await client.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: 'entityType = :t',
        ExpressionAttributeValues: { ':t': type },
        ExclusiveStartKey,
      })
    );
    items.push(...(page.Items || []));
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

function clean(item: any) {
  if (!item) return item;
  const { entityType: _t, ...rest } = item;
  void _t;
  return rest;
}

const RSVPS = ['going', 'interested', 'declined'];

// ─── Certificates ─────────────────────────────────────────────────────────────

const TZ = 'Asia/Manila';
const PURPLE = rgb(0x7b / 255, 0x2d / 255, 0x8e / 255);
const LILAC = rgb(0xa8 / 255, 0x55 / 255, 0xc8 / 255);
const INK = rgb(0x1a / 255, 0x0a / 255, 0x2e / 255);
const MUTED = rgb(0x6b / 255, 0x5b / 255, 0x7b / 255);
const PALE = rgb(0xf3 / 255, 0xea / 255, 0xf8 / 255);

function s3Config() {
  const bucket = process.env.AWS_S3_BUCKET_NAME;
  if (!bucket) return null;
  const accessKeyId = process.env.APP_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '';
  const secretAccessKey = process.env.APP_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '';
  const region = process.env.APP_AWS_REGION || process.env.AWS_REGION || 'ap-southeast-1';
  return {
    bucket,
    client: new S3Client({ region, credentials: { accessKeyId: accessKeyId.trim(), secretAccessKey: secretAccessKey.trim() } }),
  };
}

/** The standard PDF fonts only cover Western characters; swap anything else. */
function pdfSafe(s: string): string {
  return Array.from(String(s ?? ''))
    .map((ch) => {
      const c = ch.codePointAt(0) || 0;
      if (c === 10 || (c >= 32 && c <= 126) || (c >= 160 && c <= 255) || '–—‘’“”•…€'.includes(ch)) return ch;
      const plain = ch.normalize('NFKD').replace(/[̀-ͯ]/g, '');
      return /^[\x20-\x7e]+$/.test(plain) ? plain : '';
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

function fitSize(font: PDFFont, text: string, max: number, maxWidth: number, min = 12): number {
  let size = max;
  while (size > min && font.widthOfTextAtSize(text, size) > maxWidth) size -= 1;
  return size;
}

function centered(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color = INK) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (page.getWidth() - w) / 2, y, size, font, color });
}

/** Split into at most two lines that fit maxWidth at the given size. */
function twoLines(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return [text];
  const words = text.split(' ');
  let first = '';
  for (let i = 0; i < words.length; i++) {
    const next = first ? `${first} ${words[i]}` : words[i];
    if (font.widthOfTextAtSize(next, size) > maxWidth && first) return [first, words.slice(i).join(' ')];
    first = next;
  }
  return [first];
}

export async function renderCertificate(d: {
  name: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
  certificateId: string;
  issuedAt: string;
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Certificate of Participation — ${pdfSafe(d.name)}`);
  pdf.setAuthor('AWS Student Builder Group – Asia Pacific College');
  const page = pdf.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);

  // Frame
  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 1, 1) });
  page.drawRectangle({ x: 0, y: height - 14, width, height: 14, color: PURPLE });
  page.drawRectangle({ x: 0, y: height - 18, width, height: 4, color: LILAC });
  page.drawRectangle({ x: 0, y: 0, width, height: 10, color: PURPLE });
  page.drawRectangle({ x: 28, y: 28, width: width - 56, height: height - 66, borderColor: PALE, borderWidth: 2 });

  centered(page, 'AWS STUDENT BUILDER GROUP  ·  ASIA PACIFIC COLLEGE', height - 70, bold, 11, PURPLE);
  centered(page, 'CERTIFICATE OF PARTICIPATION', height - 122, bold, 30, INK);
  page.drawRectangle({ x: width / 2 - 40, y: height - 140, width: 80, height: 3, color: LILAC });
  centered(page, 'This certifies that', height - 182, italic, 14, MUTED);

  const name = pdfSafe(d.name) || 'Participant';
  const nameSize = fitSize(bold, name, 36, width - 160, 18);
  centered(page, name, height - 232, bold, nameSize, PURPLE);
  page.drawLine({ start: { x: 170, y: height - 246 }, end: { x: width - 170, y: height - 246 }, thickness: 1, color: PALE });

  centered(page, 'attended and actively participated in', height - 280, regular, 14, MUTED);
  const title = pdfSafe(d.eventTitle) || 'an AWS SBG-APC event';
  const titleSize = fitSize(bold, title, 22, (width - 160) * 2, 14);
  const lines = twoLines(bold, title, titleSize, width - 160);
  lines.forEach((line, i) => centered(page, line, height - 316 - i * (titleSize + 6), bold, titleSize, INK));

  const when = pdfSafe([d.eventDate, d.venue].filter(Boolean).join('  ·  '));
  centered(page, when, height - 330 - lines.length * (titleSize + 6), regular, 12, MUTED);

  // Footer
  page.drawLine({ start: { x: 90, y: 112 }, end: { x: 330, y: 112 }, thickness: 1, color: INK });
  page.drawText('AWS Student Builder Group – APC', { x: 90, y: 96, size: 11, font: bold, color: INK });
  page.drawText('Organizer', { x: 90, y: 82, size: 10, font: regular, color: MUTED });

  const idText = `Certificate ID: ${pdfSafe(d.certificateId)}`;
  const issued = `Issued ${new Date(d.issuedAt).toLocaleDateString('en-US', { timeZone: TZ, month: 'long', day: 'numeric', year: 'numeric' })}`;
  page.drawText(idText, { x: width - 90 - regular.widthOfTextAtSize(idText, 10), y: 96, size: 10, font: regular, color: MUTED });
  page.drawText(issued, { x: width - 90 - regular.widthOfTextAtSize(issued, 10), y: 82, size: 10, font: regular, color: MUTED });

  return pdf.save();
}

function eventDateText(ev: any): string {
  if (!ev?.startAt) return '';
  const opts: Intl.DateTimeFormatOptions = { timeZone: TZ, month: 'long', day: 'numeric', year: 'numeric' };
  const start = new Date(ev.startAt).toLocaleDateString('en-US', opts);
  const end = ev.endAt ? new Date(ev.endAt).toLocaleDateString('en-US', opts) : start;
  return start === end ? start : `${start} – ${end}`;
}

function newCertificateId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let r = '';
  for (let i = 0; i < 8; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return `CERT-${new Date().getFullYear()}-${r}`;
}

async function certificateData(client: DynamoDBDocumentClient, tableName: string, reg: any) {
  const [person, ev] = await Promise.all([
    client.send(new GetCommand({ TableName: tableName, Key: { id: reg.personId } })).then((r) => r.Item),
    client.send(new GetCommand({ TableName: tableName, Key: { id: reg.eventId } })).then((r) => r.Item),
  ]);
  return {
    name: person?.name || [person?.firstName, person?.lastName].filter(Boolean).join(' ') || 'Participant',
    eventTitle: ev?.title || 'AWS SBG-APC Event',
    eventDate: eventDateText(ev),
    venue: ev?.venue || '',
  };
}

/** Make the PDF and store it in S3. Returns the fields to save on the registration. */
async function issueCertificate(client: DynamoDBDocumentClient, tableName: string, reg: any) {
  const certificateId = reg.certificateId || newCertificateId();
  const issuedAt = reg.certificateIssuedAt || new Date().toISOString();
  const s3 = s3Config();
  if (!s3) {
    // Still issue the ID; the PDF is generated on download instead.
    return { certificateId, certificateIssuedAt: issuedAt, certificateKey: undefined, certificateError: undefined };
  }
  try {
    const bytes = await renderCertificate({ ...(await certificateData(client, tableName, reg)), certificateId, issuedAt });
    const key = `certificates/${reg.eventId}/${certificateId}.pdf`;
    await s3.client.send(
      new PutObjectCommand({ Bucket: s3.bucket, Key: key, Body: Buffer.from(bytes), ContentType: 'application/pdf' })
    );
    return { certificateId, certificateIssuedAt: issuedAt, certificateKey: key, certificateError: undefined };
  } catch (err: any) {
    console.error('Certificate upload failed:', err);
    return {
      certificateId,
      certificateIssuedAt: issuedAt,
      certificateKey: undefined,
      certificateError: String(err?.message || err).slice(0, 300),
    };
  }
}

async function requireStaff(client: DynamoDBDocumentClient, tableName: string, actorId: unknown) {
  if (typeof actorId !== 'string' || !actorId) return null;
  const actor = (await client.send(new GetCommand({ TableName: tableName, Key: { id: actorId } }))).Item;
  const ok = actor?.entityType === 'user' && (actor.role === 'admin' || actor.role === 'officer') && (!actor.status || actor.status === 'approved');
  return ok ? actor : null;
}


export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { client, tableName } = getDynamoDocClient();
    const q = req.query;
    const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);

    const action = str(q.action);

    // Certificate download
    if (req.method === 'GET' && action === 'certificate') {
      const id = str(q.id);
      const who = str(q.personId);
      if (!id || !who) return res.status(400).json({ error: 'id and personId are required' });
      const reg = (await client.send(new GetCommand({ TableName: tableName, Key: { id } }))).Item;
      if (!reg || reg.entityType !== 'registration') return res.status(404).json({ error: 'Registration not found' });
      if (reg.personId !== who && !(await requireStaff(client, tableName, who))) {
        return res.status(403).json({ error: 'This certificate belongs to someone else.' });
      }
      if (!reg.checkedIn) {
        return res.status(409).json({ error: 'The certificate unlocks once you are checked in at the venue.' });
      }
      let current = reg;
      const s3 = s3Config();
      if (s3 && !current.certificateKey) {
        current = { ...current, ...(await issueCertificate(client, tableName, current)) };
        await client.send(new PutCommand({ TableName: tableName, Item: current }));
      }
      const fileName = `AWS-SBG-APC-Certificate-${current.certificateId || 'participation'}.pdf`;
      if (s3 && current.certificateKey) {
        const url = await getSignedUrl(
          s3.client,
          new GetObjectCommand({
            Bucket: s3.bucket,
            Key: current.certificateKey,
            ResponseContentDisposition: `inline; filename="${fileName}"`,
            ResponseContentType: 'application/pdf',
          }),
          { expiresIn: 600 }
        );
        res.setHeader('Location', url);
        return res.status(302).end();
      }
      // No S3: build the same PDF on the fly.
      if (!current.certificateId) {
        current = { ...current, ...(await issueCertificate(client, tableName, current)) };
        await client.send(new PutCommand({ TableName: tableName, Item: current }));
      }
      const bytes = await renderCertificate({
        ...(await certificateData(client, tableName, current)),
        certificateId: current.certificateId,
        issuedAt: current.certificateIssuedAt || new Date().toISOString(),
      });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      return res.status(200).send(Buffer.from(bytes));
    }

    // Check in / undo check-in (officers and admins)
    if (req.method === 'POST' && (action === 'checkin' || action === 'checkout')) {
      const { id, actorId } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Registration id is required' });
      const actor = await requireStaff(client, tableName, actorId);
      if (!actor) return res.status(403).json({ error: 'Only officers and admins can check attendees in.' });
      const reg = (await client.send(new GetCommand({ TableName: tableName, Key: { id } }))).Item;
      if (!reg || reg.entityType !== 'registration') {
        return res.status(404).json({ error: 'This pass was not found. The registration may have been cancelled.' });
      }
      const now = new Date().toISOString();
      if (action === 'checkout') {
        const merged = { ...reg, checkedIn: false, checkedInAt: undefined, checkedInBy: undefined, updatedAt: now };
        await client.send(new PutCommand({ TableName: tableName, Item: merged }));
        return res.status(200).json({ registration: clean(merged) });
      }
      if (reg.checkedIn) {
        // Retry the certificate if an earlier upload failed.
        if (reg.certificateError || !reg.certificateId) {
          const retried = { ...reg, ...(await issueCertificate(client, tableName, reg)) };
          await client.send(new PutCommand({ TableName: tableName, Item: retried }));
          return res.status(200).json({ registration: clean(retried), alreadyCheckedIn: true });
        }
        return res.status(200).json({ registration: clean(reg), alreadyCheckedIn: true });
      }
      const checked = {
        ...reg,
        rsvp: reg.rsvp === 'declined' ? 'going' : reg.rsvp,
        checkedIn: true,
        checkedInAt: now,
        checkedInBy: actor.id,
        updatedAt: now,
      };
      const withCert = { ...checked, ...(await issueCertificate(client, tableName, checked)) };
      await client.send(new PutCommand({ TableName: tableName, Item: withCert }));
      return res.status(200).json({ registration: clean(withCert), alreadyCheckedIn: false });
    }

    if (req.method === 'GET') {
      const id = str(q.id);
      if (id) {
        const result = await client.send(new GetCommand({ TableName: tableName, Key: { id } }));
        if (!result.Item || result.Item.entityType !== 'registration') {
          return res.status(404).json({ error: 'Registration not found' });
        }
        return res.status(200).json(clean(result.Item));
      }
      let regs = await scanType(client, tableName, 'registration');
      const eventId = str(q.eventId);
      const personId = str(q.personId);
      if (eventId) regs = regs.filter((r) => r.eventId === eventId);
      if (personId) regs = regs.filter((r) => r.personId === personId);
      return res.status(200).json(regs.map(clean));
    }

    if (req.method === 'POST') {
      const { eventId, personId, rsvp = 'going' } = req.body || {};
      if (!eventId || !personId) return res.status(400).json({ error: 'eventId and personId are required' });
      if (!RSVPS.includes(rsvp)) return res.status(400).json({ error: 'Invalid RSVP' });

      const regs = await scanType(client, tableName, 'registration');
      const existing = regs.find((r) => r.eventId === eventId && r.personId === personId);
      const item = existing
        ? { ...existing, rsvp, updatedAt: new Date().toISOString() }
        : {
            id: `reg-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
            entityType: 'registration',
            eventId,
            personId,
            rsvp,
            checkedIn: false,
            registeredAt: new Date().toISOString(),
          };
      await client.send(new PutCommand({ TableName: tableName, Item: item }));
      return res.status(existing ? 200 : 201).json(clean(item));
    }

    if (req.method === 'PUT') {
      const id = str(q.id);
      if (!id) return res.status(400).json({ error: 'Registration id is required' });
      const result = await client.send(new GetCommand({ TableName: tableName, Key: { id } }));
      if (!result.Item || result.Item.entityType !== 'registration') {
        return res.status(404).json({ error: 'Registration not found' });
      }
      const body = req.body || {};
      const updates: Record<string, any> = {};
      if (body.rsvp !== undefined) {
        if (!RSVPS.includes(body.rsvp)) return res.status(400).json({ error: 'Invalid RSVP' });
        updates.rsvp = body.rsvp;
      }
      if (body.checkedIn !== undefined) updates.checkedIn = Boolean(body.checkedIn);
      const merged = { ...result.Item, ...updates, updatedAt: new Date().toISOString() };
      await client.send(new PutCommand({ TableName: tableName, Item: merged }));
      return res.status(200).json(clean(merged));
    }

    if (req.method === 'DELETE') {
      const id = str(q.id);
      const eventId = str(q.eventId);
      const personId = str(q.personId);
      let ids: string[] = [];
      if (id) {
        const result = await client.send(new GetCommand({ TableName: tableName, Key: { id } }));
        if (result.Item?.entityType === 'registration') ids = [id];
      } else if (eventId && personId) {
        const regs = await scanType(client, tableName, 'registration');
        ids = regs.filter((r) => r.eventId === eventId && r.personId === personId).map((r) => r.id);
      } else {
        return res.status(400).json({ error: 'id, or eventId and personId, are required' });
      }
      for (const key of ids) {
        await client.send(new DeleteCommand({ TableName: tableName, Key: { id: key } }));
      }
      return res.status(200).json({ removed: ids.length > 0 });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Registrations API Error:', err);
    return res.status(500).json({
      error: err.message || 'Internal server error',
      code: err.name || 'API_ERROR',
    });
  }
}
