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
      const itemToSave = {
        ...event,
        id,
        entityType: 'event',
        createdAt: event.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

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

      const merged = {
        ...(existing.Item || {}),
        ...eventUpdates,
        id: eventId,
        entityType: 'event',
        updatedAt: new Date().toISOString(),
      };

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
