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
  return Boolean(item) && (item.entityType === 'session' || (!item.entityType && String(item.id || '').startsWith('ses-')));
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

/** Only admins add, change or delete sessions. */
async function isAdmin(client: DynamoDBDocumentClient, tableName: string, actorId: unknown) {
  if (typeof actorId !== 'string' || !actorId) return false;
  const actor = (await client.send(new GetCommand({ TableName: tableName, Key: { id: actorId } }))).Item;
  return actor?.entityType === 'user' && actor.role === 'admin' && (actor.status ?? 'approved') === 'approved';
}

const TYPES = ['keynote', 'talk', 'workshop', 'break', 'networking', 'panel'];

/** Keep only session fields, with sane values. */
function sessionFields(body: any) {
  const out: Record<string, any> = {};
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined);
  if (body.eventId !== undefined) out.eventId = str(body.eventId, 100);
  if (body.title !== undefined) out.title = str(body.title, 200);
  if (body.description !== undefined) out.description = str(body.description, 4000) ?? '';
  if (body.room !== undefined) out.room = str(body.room, 120) ?? '';
  if (body.startTime !== undefined) out.startTime = str(body.startTime, 40);
  if (body.endTime !== undefined) out.endTime = str(body.endTime, 40);
  if (body.imageUrl !== undefined) out.imageUrl = str(body.imageUrl, 1000);
  if (body.type !== undefined) out.type = TYPES.includes(body.type) ? body.type : 'talk';
  if (body.requiresStamp !== undefined) out.requiresStamp = Boolean(body.requiresStamp);
  if (body.speakerIds !== undefined) out.speakerIds = Array.isArray(body.speakerIds) ? body.speakerIds.filter((x: unknown) => typeof x === 'string').slice(0, 50) : [];
  if (body.status !== undefined) out.status = ['not-started', 'ongoing', 'completed'].includes(body.status) ? body.status : 'not-started';
  return out;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { client, tableName } = getDynamoDocClient();

    // GET /api/sessions or GET /api/sessions?id=... or GET /api/sessions?eventId=...
    if (req.method === 'GET') {
      const { id, eventId } = req.query;

      if (id && typeof id === 'string') {
        const result = await client.send(
          new GetCommand({
            TableName: tableName,
            Key: { id },
          })
        );
        if (!isOwnRecord(result.Item)) {
          return res.status(404).json({ error: 'Session not found' });
        }
        return res.status(200).json(result.Item);
      }

      // Read every page (one Scan page is at most 1 MB of the whole table)
      const all: any[] = [];
      let startKey: Record<string, any> | undefined;
      do {
        const page = await client.send(new ScanCommand({ TableName: tableName, ExclusiveStartKey: startKey }));
        all.push(...(page.Items || []));
        startKey = page.LastEvaluatedKey;
      } while (startKey);

      let sessions = all.filter(
        (item: any) =>
          item.entityType === 'session' || (item.id && String(item.id).startsWith('ses-'))
      );

      if (eventId && typeof eventId === 'string') {
        sessions = sessions.filter((s: any) => s.eventId === eventId);
      }

      return res.status(200).json(sessions);
    }

    // POST /api/sessions (Create)
    if (req.method === 'POST') {
      const session = req.body;
      if (!(await isAdmin(client, tableName, session?.actorId))) {
        return res.status(403).json({ error: 'Only an admin can add sessions.' });
      }
      if (!session || !session.title || !session.eventId) {
        return res.status(400).json({ error: 'title and eventId are required' });
      }
      const fields = sessionFields(session);
      if (fields.startTime && fields.endTime && fields.endTime <= fields.startTime) {
        return res.status(400).json({ error: 'The session must end after it starts.' });
      }

      const id = typeof session.id === 'string' && /^ses-[\w-]{1,60}$/.test(session.id) ? session.id : `ses-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const itemToSave = {
        description: '',
        room: '',
        speakerIds: [],
        type: 'talk',
        status: 'not-started',
        requiresStamp: false,
        ...fields,
        id,
        entityType: 'session',
        createdAt: new Date().toISOString(),
      };

      await client.send(
        new PutCommand({
          TableName: tableName,
          Item: itemToSave,
        })
      );
      return res.status(201).json(itemToSave);
    }

    // PUT /api/sessions
    if (req.method === 'PUT') {
      const { id } = req.query;
      const updates = req.body;
      const sessionId = (id as string) || updates?.id;

      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required for update' });
      }

      const existing = await client.send(
        new GetCommand({
          TableName: tableName,
          Key: { id: sessionId },
        })
      );
      if (existing.Item && !isOwnRecord(existing.Item)) {
        return res.status(409).json({ error: 'This id belongs to another kind of record' });
      }

      if (!(await isAdmin(client, tableName, updates?.actorId))) {
        return res.status(403).json({ error: 'Only an admin can change sessions.' });
      }
      if (!existing.Item) return res.status(404).json({ error: 'Session not found' });
      const merged: Record<string, any> = {
        ...existing.Item,
        ...sessionFields(updates || {}),
        id: sessionId,
        entityType: 'session',
        updatedAt: new Date().toISOString(),
      };
      if (merged.startTime && merged.endTime && merged.endTime <= merged.startTime) {
        return res.status(400).json({ error: 'The session must end after it starts.' });
      }

      await client.send(
        new PutCommand({
          TableName: tableName,
          Item: merged,
        })
      );
      return res.status(200).json(merged);
    }

    // DELETE /api/sessions?id=...
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Session ID is required for deletion' });
      }

      if (!(await isAdmin(client, tableName, req.query.actorId))) {
        return res.status(403).json({ error: 'Only an admin can delete sessions.' });
      }
      const toDelete = await client.send(new GetCommand({ TableName: tableName, Key: { id } }));
      if (!isOwnRecord(toDelete.Item)) {
        return res.status(404).json({ error: 'Session not found' });
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
    console.error('Sessions API Error:', err);
    return res.status(500).json({
      error: err.message || 'Internal server error',
      code: err.name || 'API_ERROR',
    });
  }
}
