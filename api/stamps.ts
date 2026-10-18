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
  return Boolean(item) && (item.entityType === 'stamp' || (!item.entityType && String(item.id || '').startsWith('stp-')));
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

/**
 * Who may approve or decline a stamp: admins, and officers or co-organizer staff on the event's
 * staff list for stamps (event.stampOfficerIds, set by an admin).
 */
async function stampApprover(client: DynamoDBDocumentClient, tableName: string, actorId: unknown, sessionId: unknown) {
  if (typeof actorId !== 'string' || !actorId || typeof sessionId !== 'string') return null;
  const actor = (await client.send(new GetCommand({ TableName: tableName, Key: { id: actorId } }))).Item;
  if (actor?.entityType !== 'user' || (actor.status ?? 'approved') !== 'approved') return null;
  if (actor.role === 'admin') return actor;
  // Officers and co-organizer staff (attendee accounts an admin linked to a partner org)
  const partner = actor.role === 'attendee' && typeof actor.partnerOrg === 'string' && actor.partnerOrg.trim() !== '';
  if (actor.role !== 'officer' && !partner) return null;
  const session = (await client.send(new GetCommand({ TableName: tableName, Key: { id: sessionId } }))).Item;
  if (!session?.eventId) return null;
  const event = (await client.send(new GetCommand({ TableName: tableName, Key: { id: session.eventId } }))).Item;
  const allowed: unknown = event?.stampOfficerIds;
  return Array.isArray(allowed) && allowed.includes(actor.id) ? actor : null;
}

/** Stamps are approved after check-in: the attendee must be checked in to the session's event. */
async function checkedInForSession(client: DynamoDBDocumentClient, tableName: string, attendeeId: string, sessionId: string) {
  const session = (await client.send(new GetCommand({ TableName: tableName, Key: { id: sessionId } }))).Item;
  if (!session?.eventId) return false;
  let ExclusiveStartKey: Record<string, any> | undefined;
  do {
    const page = await client.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: 'entityType = :t',
        ExpressionAttributeValues: { ':t': 'registration' },
        ExclusiveStartKey,
      })
    );
    if ((page.Items || []).some((r: any) => r.eventId === session.eventId && r.personId === attendeeId && r.checkedIn)) return true;
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return false;
}

const NOT_CHECKED_IN = 'Check this attendee in first — stamps are approved after check-in.';

const NOT_ON_STAFF =
  'You are not on the stamp team for this event. Ask an admin to tick "Approve stamps" for you on the event page.';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { client, tableName } = getDynamoDocClient();

    // GET /api/stamps or GET /api/stamps?attendeeId=... or GET /api/stamps?sessionId=...
    if (req.method === 'GET') {
      const { id, attendeeId, sessionId, status } = req.query;

      if (id && typeof id === 'string') {
        const result = await client.send(
          new GetCommand({
            TableName: tableName,
            Key: { id },
          })
        );
        if (!isOwnRecord(result.Item)) {
          return res.status(404).json({ error: 'Stamp not found' });
        }
        return res.status(200).json(result.Item);
      }

      const scanResult = await client.send(
        new ScanCommand({
          TableName: tableName,
        })
      );

      let stamps = (scanResult.Items || []).filter(
        (item: any) =>
          item.entityType === 'stamp' || (item.id && String(item.id).startsWith('stp-'))
      );

      if (attendeeId && typeof attendeeId === 'string') {
        stamps = stamps.filter((s: any) => s.attendeeId === attendeeId);
      }
      if (sessionId && typeof sessionId === 'string') {
        stamps = stamps.filter((s: any) => s.sessionId === sessionId);
      }
      if (status && typeof status === 'string') {
        stamps = stamps.filter((s: any) => s.status === status);
      }

      return res.status(200).json(stamps);
    }

    // POST /api/stamps (Attendee Requests Stamp)
    if (req.method === 'POST') {
      const stamp = req.body;
      if (!stamp || !stamp.sessionId || !stamp.attendeeId) {
        return res.status(400).json({ error: 'sessionId and attendeeId are required' });
      }

      // Check if stamp already requested for this attendee + session
      const scanResult = await client.send(
        new ScanCommand({
          TableName: tableName,
        })
      );
      const existing = (scanResult.Items || []).find(
        (s: any) =>
          (s.entityType === 'stamp' || String(s.id).startsWith('stp-')) &&
          s.sessionId === stamp.sessionId &&
          s.attendeeId === stamp.attendeeId
      );

      if (existing) {
        return res.status(200).json(existing);
      }

      // A new stamp is always a request; approving happens through PUT
      const id = `stp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const itemToSave = {
        id,
        entityType: 'stamp',
        sessionId: String(stamp.sessionId),
        attendeeId: String(stamp.attendeeId),
        status: 'pending',
        requestedAt: new Date().toISOString(),
      };

      await client.send(
        new PutCommand({
          TableName: tableName,
          Item: itemToSave,
        })
      );
      return res.status(201).json(itemToSave);
    }

    // PUT /api/stamps?id=… { actorId, status } (stamp team approves — attendee must be checked in; status 'pending' un-approves)
    if (req.method === 'PUT') {
      const { id } = req.query;
      const updates = req.body;
      const stampId = (id as string) || updates?.id;

      if (!stampId) {
        return res.status(400).json({ error: 'Stamp ID is required for update' });
      }

      const existing = await client.send(
        new GetCommand({
          TableName: tableName,
          Key: { id: stampId },
        })
      );
      if (existing.Item && !isOwnRecord(existing.Item)) {
        return res.status(409).json({ error: 'This id belongs to another kind of record' });
      }

      if (!existing.Item) {
        return res.status(404).json({ error: 'Stamp not found' });
      }

      const actor = await stampApprover(client, tableName, updates?.actorId || updates?.approvedBy, existing.Item.sessionId);
      if (!actor) return res.status(403).json({ error: NOT_ON_STAFF });
      const approve = (updates?.status ?? 'approved') === 'approved';
      if (approve && existing.Item.status !== 'approved' && !(await checkedInForSession(client, tableName, existing.Item.attendeeId, existing.Item.sessionId))) {
        return res.status(409).json({ error: NOT_CHECKED_IN, code: 'NOT_CHECKED_IN' });
      }
      const merged = approve
        ? { ...existing.Item, id: stampId, entityType: 'stamp', status: 'approved', approvedBy: actor.id, approvedAt: new Date().toISOString() }
        : { ...existing.Item, id: stampId, entityType: 'stamp', status: 'pending', approvedBy: undefined, approvedAt: undefined };

      await client.send(
        new PutCommand({
          TableName: tableName,
          Item: merged,
        })
      );
      return res.status(200).json(merged);
    }

    // DELETE /api/stamps?id=…&actorId=… (stamp team declines) or &attendeeId=… (withdraw own request)
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Stamp ID is required for deletion' });
      }

      const toDelete = await client.send(new GetCommand({ TableName: tableName, Key: { id } }));
      if (!isOwnRecord(toDelete.Item)) {
        return res.status(404).json({ error: 'Stamp not found' });
      }
      // Attendees may withdraw their own pending request; declining needs the stamp team
      const own =
        typeof req.query.attendeeId === 'string' &&
        req.query.attendeeId === toDelete.Item!.attendeeId &&
        toDelete.Item!.status === 'pending';
      if (!own && !(await stampApprover(client, tableName, req.query.actorId, toDelete.Item!.sessionId))) {
        return res.status(403).json({ error: NOT_ON_STAFF });
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
    console.error('Stamps API Error:', err);
    return res.status(500).json({
      error: err.message || 'Internal server error',
      code: err.name || 'API_ERROR',
    });
  }
}
