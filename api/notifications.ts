import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

/**
 * In-app notifications (single-table DynamoDB, entityType = 'notification').
 *
 * GET    /api/notifications?personId=per-1           → newest first (max 100)
 * POST   /api/notifications { personIds?: string[], toRole?: 'admin', kind, title, message, link? }
 *                                                     → one notification per recipient
 * PUT    /api/notifications?id=ntf-1                  → mark one as read
 * PUT    /api/notifications?personId=per-1&all=1      → mark all as read
 * DELETE /api/notifications?id=ntf-1
 */

const KINDS = [
  'account-approved',
  'account-declined',
  'signup-pending',
  'event-assigned',
  'task-assigned',
  'stamp-approved',
  'stamp-declined',
  'checked-in',
  'certificate',
  'registration-approved',
  'registration-declined',
  'connection-request',
  'connection-accepted',
  'announcement',
];

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
      if (body.toRole === 'admin') {
        const users = await scanType(client, tableName, 'user');
        recipients.push(...users.filter((u) => u.role === 'admin').map((u) => u.id));
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
