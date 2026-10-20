import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

/** Only touch records of this type: the table also holds users, tasks, etc. */
function isOwnRecord(item: any): boolean {
  return Boolean(item) && (item.entityType === 'event' || (!item.entityType && String(item.id || '').startsWith('evt-')));
}

function getDynamoDocClient() {
  const region = process.env.APP_AWS_REGION || process.env.AWS_REGION || 'ap-southeast-1';
  const accessKeyId = process.env.APP_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.APP_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      'AWS credentials missing. Please add APP_AWS_ACCESS_KEY_ID and APP_AWS_SECRET_ACCESS_KEY in Vercel Project Settings.'
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

// ─── Staff list ───────────────────────────────────────────────────────────────
// stampOfficerIds / checkinOfficerIds decide which officers may approve stamps
// and check people in at this event. Only an admin can change them, through
// PUT /api/events?id=…&action=staff { actorId, officerIds, officerRoles, stampOfficerIds, checkinOfficerIds }.

const STAFF_FIELDS = ['stampOfficerIds', 'checkinOfficerIds'];

function idList(v: unknown): string[] {
  return Array.isArray(v) ? [...new Set(v.filter((x) => typeof x === 'string' && x && x.length < 100))].slice(0, 200) : [];
}

/** Keep the duty lists limited to officers who are assigned to the event. */
function pruneStaff(item: any) {
  const assigned = new Set(idList(item.officerIds));
  for (const f of STAFF_FIELDS) {
    if (item[f] !== undefined) item[f] = idList(item[f]).filter((x) => assigned.has(x));
  }
  // Program flow: up to 60 rows of short text
  if (item.programFlow !== undefined) {
    const t = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
    item.programFlow = Array.isArray(item.programFlow)
      ? item.programFlow
          .map((r: any) => ({ time: t(r?.time, 60), duration: t(r?.duration, 40), activity: t(r?.activity, 160), personInCharge: t(r?.personInCharge, 120) }))
          .filter((r: any) => r.time || r.activity)
          .slice(0, 60)
      : [];
  }
  // Evaluation form: up to 25 questions (rating / yesno / choice / text)
  if (item.evaluation !== undefined) {
    const t = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
    const ev = item.evaluation && typeof item.evaluation === 'object' ? item.evaluation : {};
    const seen = new Set<string>();
    const questions = (Array.isArray(ev.questions) ? ev.questions : [])
      .map((q: any, i: number) => {
        const type = ['rating', 'yesno', 'choice', 'text'].includes(q?.type) ? q.type : 'text';
        let id = t(q?.id, 40).replace(/[^\w-]/g, '') || `q-${i + 1}`;
        while (seen.has(id)) id = `${id}-${i}`;
        seen.add(id);
        const options = type === 'choice' ? [...new Set((Array.isArray(q?.options) ? q.options : []).map((o: unknown) => t(o, 80)).filter(Boolean))].slice(0, 10) : undefined;
        return { id, type, label: t(q?.label, 200), required: Boolean(q?.required), ...(options ? { options } : {}) };
      })
      .filter((q: any) => q.label && (q.type !== 'choice' || (q.options && q.options.length >= 2)))
      .slice(0, 25);
    item.evaluation = { enabled: ev.enabled !== false, questions };
  }
  // Partner orgs co-organizing the event: up to 5 short names
  if (item.coOrganizers !== undefined) {
    item.coOrganizers = Array.isArray(item.coOrganizers)
      ? [...new Set(item.coOrganizers.filter((x: unknown) => typeof x === 'string').map((x: string) => x.trim().slice(0, 60)).filter(Boolean))].slice(0, 5)
      : [];
  }
  return item;
}

async function getAdmin(client: DynamoDBDocumentClient, tableName: string, actorId: unknown) {
  if (typeof actorId !== 'string' || !actorId) return null;
  const actor = (await client.send(new GetCommand({ TableName: tableName, Key: { id: actorId } }))).Item;
  return actor?.entityType === 'user' && actor.role === 'admin' && (actor.status ?? 'approved') === 'approved' ? actor : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { client, tableName } = getDynamoDocClient();

    // GET /api/events or GET /api/events?id=...
    if (req.method === 'GET') {
      const { id } = req.query;
      if (id && typeof id === 'string') {
        const result = await client.send(
          new GetCommand({
            TableName: tableName,
            Key: { id },
          })
        );
        if (!isOwnRecord(result.Item)) {
          return res.status(404).json({ error: 'Event not found' });
        }
        return res.status(200).json(result.Item);
      }

      const result = await client.send(
        new ScanCommand({
          TableName: tableName,
        })
      );
      const events = (result.Items || []).filter(
        (item: any) =>
          item.entityType === 'event' || (!item.entityType && item.id && String(item.id).startsWith('evt-'))
      );
      return res.status(200).json(events);
    }

    // POST /api/events (Create)
    if (req.method === 'POST') {
      const event = req.body;
      if (!event || !event.title) {
        return res.status(400).json({ error: 'Event title is required' });
      }

      const id = event.id || `evt-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      // Duty lists are only set through action=staff (admin-checked)
      const { stampOfficerIds: _s, checkinOfficerIds: _c, ...fields } = event;
      void _s;
      void _c;
      const itemToSave = pruneStaff({
        ...fields,
        id,
        entityType: 'event',
        createdAt: event.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await client.send(
        new PutCommand({
          TableName: tableName,
          Item: itemToSave,
        })
      );
      return res.status(201).json(itemToSave);
    }

    // PUT /api/events (Update)
    if (req.method === 'PUT') {
      const { id } = req.query;
      const eventUpdates = req.body;
      const eventId = (id as string) || eventUpdates?.id;

      if (!eventId) {
        return res.status(400).json({ error: 'Event ID is required for update' });
      }

      const existing = await client.send(
        new GetCommand({
          TableName: tableName,
          Key: { id: eventId },
        })
      );
      if (existing.Item && !isOwnRecord(existing.Item)) {
        return res.status(409).json({ error: 'This id belongs to another kind of record' });
      }

      // Staff list (admin only)
      if (req.query.action === 'staff') {
        const { actorId, officerIds, officerRoles, stampOfficerIds, checkinOfficerIds } = eventUpdates || {};
        if (!(await getAdmin(client, tableName, actorId))) {
          return res.status(403).json({ error: 'Only an admin can change who works at this event.' });
        }
        if (!existing.Item) return res.status(404).json({ error: 'Event not found' });
        const roles: Record<string, string> = {};
        const ids = idList(officerIds);
        const givenRoles = officerRoles && typeof officerRoles === 'object' ? officerRoles : {};
        for (const pid of ids) {
          const r = (givenRoles as any)[pid];
          roles[pid] = typeof r === 'string' && r.trim() ? r.trim().slice(0, 40) : 'Officer';
        }
        const staffed = pruneStaff({
          ...existing.Item,
          officerIds: ids,
          officerRoles: roles,
          stampOfficerIds: idList(stampOfficerIds),
          checkinOfficerIds: idList(checkinOfficerIds),
          id: eventId,
          entityType: 'event',
          updatedAt: new Date().toISOString(),
        });
        await client.send(new PutCommand({ TableName: tableName, Item: staffed }));
        return res.status(200).json(staffed);
      }

      // Ordinary edits never change the duty lists
      const { stampOfficerIds: _s, checkinOfficerIds: _c, ...fieldUpdates } = eventUpdates || {};
      void _s;
      void _c;
      const merged = pruneStaff({
        ...(existing.Item || {}),
        ...fieldUpdates,
        id: eventId,
        entityType: 'event',
        updatedAt: new Date().toISOString(),
      });
      // Moving the event re-arms its reminder emails
      if (existing.Item?.startAt && eventUpdates?.startAt && existing.Item.startAt !== eventUpdates.startAt) {
        delete (merged as any).remindersSent;
      }

      await client.send(
        new PutCommand({
          TableName: tableName,
          Item: merged,
        })
      );
      return res.status(200).json(merged);
    }

    // DELETE /api/events?id=...
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Event ID is required for delete' });
      }

      const toDelete = await client.send(new GetCommand({ TableName: tableName, Key: { id } }));
      if (!isOwnRecord(toDelete.Item)) {
        return res.status(404).json({ error: 'Event not found' });
      }

      await client.send(
        new DeleteCommand({
          TableName: tableName,
          Key: { id },
        })
      );
      return res.status(200).json({ success: true, id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('DynamoDB API Error:', err);
    return res.status(500).json({
      error: err.message || 'Internal server error',
      code: err.name || 'API_ERROR',
    });
  }
}
