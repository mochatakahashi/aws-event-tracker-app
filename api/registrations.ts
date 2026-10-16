import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

/**
 * Event registrations (single-table DynamoDB, entityType = 'registration').
 *
 * GET    /api/registrations[?eventId=&personId=&id=]
 * POST   /api/registrations            { eventId, personId, rsvp } (upsert)
 * PUT    /api/registrations?id=reg-1   { rsvp?, checkedIn? }
 * DELETE /api/registrations?id=reg-1 | ?eventId=&personId=
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { client, tableName } = getDynamoDocClient();
    const q = req.query;
    const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);

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
