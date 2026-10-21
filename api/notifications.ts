import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, DeleteCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

/**
 * In-app notifications (single-table DynamoDB, entityType = 'notification').
 *
 * GET    /api/notifications?personId=per-1           → newest first (max 100)
 * POST   /api/notifications { personIds?: string[], toRole?: 'admin', kind, title, message, link? }
 *                                                     → one notification per recipient
 * PUT    /api/notifications?id=ntf-1                  → mark one as read
 * PUT    /api/notifications?personId=per-1&all=1      → mark all as read
 * DELETE /api/notifications?id=ntf-1
 *
 * Adviser (role 'adviser'):
 * GET  ?action=announcements&viewerId=          → announcements this person can see
 *                                                  (officers, admins, adviser: all; members: the ones for everyone)
 * POST ?action=announce { actorId, title, message, audience? }   → adviser / admin posts (bell for each).
 *                                                  audience 'officers' (default) or 'everyone' (admin only).
 *                                                  Pinned at the top of dashboards for 24 hours (expiresAt).
 * PUT  ?action=announcement-edit { actorId, id, title, message }  → its author or an admin edits it
 * DELETE ?action=announcement&id=&actorId=       → its author or an admin removes it
 * GET  ?action=signoffs&viewerId=               → sign-off requests (adviser/admin: all; officer: their own)
 * POST ?action=signoff { actorId, title, details?, link?, eventId? }   → officer / admin asks the adviser to sign
 * POST ?action=signoff-review { actorId, id, decision: 'approved'|'returned', comment? }  → adviser
 * DELETE ?action=signoff&id=&actorId=           → delete a request (admins: any; others: their own). Kept 30 days for undo.
 * POST ?action=signoff-restore { actorId, id }   → bring a deleted request back (admins, or whoever deleted it)
 */

const KINDS = [
  'account-approved',
  'account-declined',
  'signup-pending',
  'event-assigned',
  'task-assigned',
  'task-proposed',
  'task-comment',
  'adviser-announcement',
  'signoff-request',
  'signoff-reviewed',
  'task-reviewed',
  'stamp-approved',
  'stamp-declined',
  'checked-in',
  'certificate',
  'evaluation',
  'registration-approved',
  'registration-declined',
  'connection-request',
  'connection-accepted',
  'announcement',
  'profile-fix',
];


/**
 * Documents for the adviser must come from a trusted service (mirrors
 * documentKind in src/utils/linkCheck.ts). Returns what kind of file it is.
 */
function documentKind(raw: string | undefined): string | null {
  if (!raw) return null;
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' || u.username || u.password) return null;
  const host = u.hostname.toLowerCase();
  const path = u.pathname.toLowerCase();
  const on = (d: string) => host === d || host.endsWith(`.${d}`);
  if (host === 'docs.google.com') {
    if (path.startsWith('/document')) return 'Google Docs document';
    if (path.startsWith('/presentation')) return 'Google Slides presentation';
    if (path.startsWith('/spreadsheets')) return 'Google Sheets spreadsheet';
    if (path.startsWith('/forms')) return 'Google Form';
    return 'Google Docs file';
  }
  if (host === 'drive.google.com') return path.includes('/folders/') ? 'Google Drive folder' : 'Google Drive file';
  if (on('canva.com') || host === 'canva.link') return 'Canva design';
  if (on('sharepoint.com')) {
    if (path.includes('/:w:/')) return 'Word document (SharePoint)';
    if (path.includes('/:p:/')) return 'PowerPoint presentation (SharePoint)';
    if (path.includes('/:x:/')) return 'Excel spreadsheet (SharePoint)';
    if (path.includes('/:b:/')) return 'PDF (SharePoint)';
    return 'SharePoint file';
  }
  if (host === 'onedrive.live.com' || host === '1drv.ms') return 'OneDrive file';
  if (on('office.com') || host === 'office.live.com') return 'Microsoft Office file';
  return null;
}

/** Secretariat, Marketing Director / Assistant Director, VPs, President, admins (mirrors src/utils/people.ts). */
function canRequestSignoff(u: any): boolean {
  if (!u || (u.status ?? 'approved') !== 'approved') return false;
  if (u.role === 'admin') return true;
  if (u.role !== 'officer') return false;
  const pos = u.officerPosition || '';
  if (['president', 'vp-internal', 'vp-external'].includes(pos)) return true;
  if (u.committee === 'secretariat') return true;
  return u.committee === 'marketing' && (pos === 'director' || pos === 'assistant-director');
}

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
    credentials: { accessKeyId: accessKeyId.trim(), secretAccessKey: secretAccessKey.trim() },
  });
  return {
    client: DynamoDBDocumentClient.from(raw, { marshallOptions: { removeUndefinedValues: true } }),
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
  const { entityType: _t, ...rest } = item;
  void _t;
  return rest;
}

const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);
const text = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { client, tableName } = getDynamoDocClient();
    const q = req.query || {};

    const action = str(q.action);
    const getUser = async (id: unknown) => {
      if (typeof id !== 'string' || !id) return null;
      const u = (await client.send(new GetCommand({ TableName: tableName, Key: { id } }))).Item;
      return u?.entityType === 'user' && (u.status ?? 'approved') === 'approved' ? u : null;
    };
    const bell = async (personIds: string[], kind: string, title: string, message: string, link: string) => {
      const now = new Date().toISOString();
      const items = [...new Set(personIds)].slice(0, 1000).map((personId, i) => ({
        id: `ntf-${Date.now()}-${i}-${Math.floor(Math.random() * 1e6)}`,
        entityType: 'notification',
        personId,
        kind,
        title: text(title, 140),
        message: text(message, 600),
        link,
        read: false,
        createdAt: now,
      }));
      // 25 per request (DynamoDB's batch limit), a few requests at a time, so posting to everyone stays fast
      const chunks: (typeof items)[] = [];
      for (let i = 0; i < items.length; i += 25) chunks.push(items.slice(i, i + 25));
      for (let i = 0; i < chunks.length; i += 4) {
        await Promise.all(
          chunks.slice(i, i + 4).map(async (chunk) => {
            let pending: any = { [tableName]: chunk.map((Item) => ({ PutRequest: { Item } })) };
            for (let tries = 0; tries < 4 && pending && Object.keys(pending).length; tries++) {
              const out = await client.send(new BatchWriteCommand({ RequestItems: pending }));
              pending = out.UnprocessedItems;
            }
          }),
        );
      }
    };
    const staffRoles = ['officer', 'admin', 'adviser'];

    // ── Adviser announcements (to the officers) ──
    if (action === 'announcements' && req.method === 'GET') {
      const viewer = await getUser(q.viewerId);
      if (!viewer || (viewer.status ?? 'approved') !== 'approved') return res.status(200).json([]);
      const isStaff = staffRoles.includes(viewer.role);
      const list = (await scanType(client, tableName, 'announcement'))
        .filter((a) => isStaff || a.audience === 'everyone')
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
        .slice(0, 50);
      return res.status(200).json(list.map(clean));
    }
    if (action === 'announce' && req.method === 'POST') {
      const body = req.body || {};
      const actor = await getUser(body.actorId);
      if (!actor || (actor.role !== 'adviser' && actor.role !== 'admin')) {
        return res.status(403).json({ error: 'Only the adviser or an admin can post announcements.' });
      }
      const title = text(body.title, 140);
      const message = text(body.message, 2000);
      if (!title || !message) return res.status(400).json({ error: 'Add a title and a message.' });
      // Only an admin can post to everyone; the adviser writes to the officers
      const audience = body.audience === 'everyone' && actor.role === 'admin' ? 'everyone' : 'officers';
      const now = Date.now();
      const item = {
        id: `ann-${now}-${Math.floor(Math.random() * 1e5)}`,
        entityType: 'announcement',
        audience,
        title,
        message,
        authorId: actor.id,
        authorName: actor.name,
        authorRole: actor.role,
        createdAt: new Date(now).toISOString(),
        // Pinned at the top of dashboards for a day
        expiresAt: new Date(now + 24 * 3600 * 1000).toISOString(),
      };
      await client.send(new PutCommand({ TableName: tableName, Item: item }));
      const users = await scanType(client, tableName, 'user');
      const to = users
        .filter((u) => (audience === 'everyone' || u.role === 'officer' || u.role === 'admin' || u.role === 'adviser') && (u.status ?? 'approved') === 'approved' && u.id !== actor.id)
        .map((u) => u.id);
      await bell(to, 'adviser-announcement', `📣 ${actor.role === 'adviser' ? 'Adviser' : 'Admin'}: ${title}`, message, '/home');
      return res.status(201).json({ ...clean(item), notified: to.length });
    }
    if (action === 'announcement-edit' && req.method === 'PUT') {
      const body = req.body || {};
      const actor = await getUser(body.actorId);
      const item = str(body.id) ? (await client.send(new GetCommand({ TableName: tableName, Key: { id: String(body.id) } }))).Item : null;
      if (!item || item.entityType !== 'announcement') return res.status(404).json({ error: 'Announcement not found' });
      if (!actor || (actor.id !== item.authorId && actor.role !== 'admin')) return res.status(403).json({ error: 'Only its author or an admin can edit it.' });
      const title = text(body.title, 140);
      const message = text(body.message, 2000);
      if (!title || !message) return res.status(400).json({ error: 'Add a title and a message.' });
      const updated = { ...item, title, message, editedAt: new Date().toISOString(), editedBy: actor.id };
      await client.send(new PutCommand({ TableName: tableName, Item: updated }));
      return res.status(200).json(clean(updated));
    }
    if (action === 'announcement' && req.method === 'DELETE') {
      const actor = await getUser(q.actorId);
      const item = str(q.id) ? (await client.send(new GetCommand({ TableName: tableName, Key: { id: String(q.id) } }))).Item : null;
      if (!item || item.entityType !== 'announcement') return res.status(404).json({ error: 'Announcement not found' });
      if (!actor || (actor.id !== item.authorId && actor.role !== 'admin')) return res.status(403).json({ error: 'Not allowed.' });
      await client.send(new DeleteCommand({ TableName: tableName, Key: { id: item.id } }));
      return res.status(200).json({ success: true });
    }

    // ── Sign-off requests ("papirma") to the adviser ──
    if (action === 'signoffs' && req.method === 'GET') {
      const viewer = await getUser(q.viewerId);
      if (!viewer || !staffRoles.includes(viewer.role)) return res.status(200).json([]);
      const all = (await scanType(client, tableName, 'signoff')).filter((x) => !x.deletedAt).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      const mine = viewer.role === 'officer' ? all.filter((x) => x.requestedBy === viewer.id) : all;
      return res.status(200).json(mine.map(clean));
    }
    if (action === 'signoff' && req.method === 'POST') {
      const body = req.body || {};
      const actor = await getUser(body.actorId);
      if (!canRequestSignoff(actor)) {
        return res.status(403).json({
          error: 'Sign-off requests are sent by Secretariat, the Marketing Director / Assistant Director, the VPs, the President and admins.',
        });
      }
      const title = text(body.title, 140);
      if (!title) return res.status(400).json({ error: 'What needs signing? Add a title.' });
      const link = text(body.link, 500);
      const linkKind = link ? documentKind(link) : null;
      if (link && !linkKind) {
        return res.status(400).json({
          error: 'Only links to Google Docs / Slides / Sheets / Drive, Canva, or Microsoft Word / PowerPoint / Excel (OneDrive, SharePoint, Office) are allowed, starting with https://',
        });
      }
      const item = {
        id: `sgn-${Date.now()}-${Math.floor(Math.random() * 1e5)}`,
        entityType: 'signoff',
        title,
        details: text(body.details, 2000) || undefined,
        link: link || undefined,
        linkKind: linkKind || undefined,
        eventId: str(body.eventId),
        requestedBy: actor.id,
        requestedByName: actor.name,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      await client.send(new PutCommand({ TableName: tableName, Item: item }));
      const users = await scanType(client, tableName, 'user');
      await bell(
        users.filter((u) => u.role === 'adviser' && (u.status ?? 'approved') === 'approved').map((u) => u.id),
        'signoff-request',
        `${actor.name} asks you to sign: ${title}`,
        item.details || 'Open your dashboard to approve it or return it with a comment.',
        '/home',
      );
      return res.status(201).json(clean(item));
    }
    if (action === 'signoff' && req.method === 'DELETE') {
      const actor = await getUser(q.actorId);
      const item = str(q.id) ? (await client.send(new GetCommand({ TableName: tableName, Key: { id: String(q.id) } }))).Item : null;
      if (!item || item.entityType !== 'signoff' || item.deletedAt) return res.status(404).json({ error: 'Request not found' });
      if (!actor || (actor.status ?? 'approved') !== 'approved' || (actor.role !== 'admin' && actor.id !== item.requestedBy)) {
        return res.status(403).json({ error: 'Only admins, or the person who sent it, can delete a sign-off request.' });
      }
      // Soft delete: hidden everywhere, kept so it can be restored (purged after 30 days)
      const now = Date.now();
      const deleted = {
        ...item,
        deletedAt: new Date(now).toISOString(),
        deletedBy: actor.id,
        deletedByName: actor.name,
        purgeAfter: new Date(now + 30 * 24 * 3600 * 1000).toISOString(),
      };
      await client.send(new PutCommand({ TableName: tableName, Item: deleted }));
      // The adviser was told about it, so say it was withdrawn
      if (item.status === 'pending') {
        const users = await scanType(client, tableName, 'user');
        await bell(
          users.filter((u) => u.role === 'adviser' && (u.status ?? 'approved') === 'approved').map((u) => u.id),
          'signoff-request',
          `Sign-off request withdrawn: ${item.title}`,
          `${actor.name} deleted this request, so there is nothing to sign.`,
          '/home',
        );
      }
      return res.status(200).json({ success: true, id: item.id });
    }
    if (action === 'signoff-restore' && req.method === 'POST') {
      const body = req.body || {};
      const actor = await getUser(body.actorId);
      const item = str(body.id) ? (await client.send(new GetCommand({ TableName: tableName, Key: { id: String(body.id) } }))).Item : null;
      if (!item || item.entityType !== 'signoff' || !item.deletedAt) return res.status(404).json({ error: 'Nothing to restore.' });
      if (!actor || (actor.role !== 'admin' && actor.id !== item.deletedBy)) return res.status(403).json({ error: 'Not allowed.' });
      const { deletedAt: _a, deletedBy: _b, deletedByName: _c, purgeAfter: _d, ...rest } = item;
      void _a; void _b; void _c; void _d;
      await client.send(new PutCommand({ TableName: tableName, Item: rest }));
      return res.status(200).json(clean(rest));
    }
    if (action === 'signoff-review' && req.method === 'POST') {
      const body = req.body || {};
      const actor = await getUser(body.actorId);
      if (!actor || actor.role !== 'adviser') return res.status(403).json({ error: 'Only the adviser can sign off.' });
      const item = str(body.id) ? (await client.send(new GetCommand({ TableName: tableName, Key: { id: body.id } }))).Item : null;
      if (!item || item.entityType !== 'signoff' || item.deletedAt) return res.status(404).json({ error: 'Request not found' });
      const decision = body.decision === 'approved' ? 'approved' : body.decision === 'returned' ? 'returned' : null;
      if (!decision) return res.status(400).json({ error: 'Choose approve or return.' });
      const comment = text(body.comment, 1000);
      if (decision === 'returned' && !comment) return res.status(400).json({ error: 'Say what needs to change before returning it.' });
      const merged = { ...item, status: decision, comment: comment || undefined, reviewedBy: actor.id, reviewedByName: actor.name, reviewedAt: new Date().toISOString() };
      await client.send(new PutCommand({ TableName: tableName, Item: merged }));
      await bell(
        [item.requestedBy],
        'signoff-reviewed',
        decision === 'approved' ? `✅ Signed by the adviser: ${item.title}` : `↩️ Returned by the adviser: ${item.title}`,
        comment || (decision === 'approved' ? 'Your request was approved.' : ''),
        item.requestedBy && (await getUser(item.requestedBy))?.role === 'admin' ? '/home' : '/officer',
      );
      return res.status(200).json(clean(merged));
    }

    if (req.method === 'GET') {
      const personId = str(q.personId);
      // Without a personId this is only a health check (used to detect the API).
      if (!personId) return res.status(200).json([]);
      const mine = (await scanType(client, tableName, 'notification'))
        .filter((n) => n.personId === personId)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
        .slice(0, 100);
      return res.status(200).json(mine.map(clean));
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      if (!KINDS.includes(body.kind)) return res.status(400).json({ error: 'Unknown notification kind' });
      const title = text(body.title, 140);
      if (!title) return res.status(400).json({ error: 'title is required' });

      let recipients: string[] = Array.isArray(body.personIds) ? body.personIds.filter((x: unknown) => typeof x === 'string') : [];
      if (body.toRole === 'admin' || body.toRole === 'adviser') {
        const users = await scanType(client, tableName, 'user');
        recipients.push(...users.filter((u) => u.role === body.toRole).map((u) => u.id));
      }
      recipients = [...new Set(recipients)].slice(0, 500);
      if (recipients.length === 0) return res.status(200).json({ created: 0 });

      const now = new Date().toISOString();
      for (const personId of recipients) {
        await client.send(
          new PutCommand({
            TableName: tableName,
            Item: {
              id: `ntf-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
              entityType: 'notification',
              personId,
              kind: body.kind,
              title,
              message: text(body.message, 600),
              link: str(body.link) && String(body.link).startsWith('/') ? body.link : undefined,
              read: false,
              createdAt: now,
            },
          })
        );
      }
      return res.status(201).json({ created: recipients.length });
    }

    if (req.method === 'PUT') {
      const id = str(q.id);
      const personId = str(q.personId);
      if (id) {
        const found = (await client.send(new GetCommand({ TableName: tableName, Key: { id } }))).Item;
        if (found?.entityType !== 'notification') return res.status(404).json({ error: 'Notification not found' });
        const updated = { ...found, read: true, readAt: new Date().toISOString() };
        await client.send(new PutCommand({ TableName: tableName, Item: updated }));
        return res.status(200).json(clean(updated));
      }
      if (personId && q.all) {
        const unread = (await scanType(client, tableName, 'notification')).filter((n) => n.personId === personId && !n.read);
        const readAt = new Date().toISOString();
        for (const n of unread) {
          await client.send(new PutCommand({ TableName: tableName, Item: { ...n, read: true, readAt } }));
        }
        return res.status(200).json({ updated: unread.length });
      }
      return res.status(400).json({ error: 'id, or personId and all=1, are required' });
    }

    if (req.method === 'DELETE') {
      const id = str(q.id);
      if (!id) return res.status(400).json({ error: 'id is required' });
      const found = (await client.send(new GetCommand({ TableName: tableName, Key: { id } }))).Item;
      if (found?.entityType !== 'notification') return res.status(404).json({ error: 'Notification not found' });
      await client.send(new DeleteCommand({ TableName: tableName, Key: { id } }));
      return res.status(200).json({ removed: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Notifications API Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error', code: err.name || 'API_ERROR' });
  }
}
