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

      const scanResult = await client.send(
        new ScanCommand({
          TableName: tableName,
        })
      );

      let sessions = (scanResult.Items || []).filter(
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
      if (!session || !session.title || !session.eventId) {
        return res.status(400).json({ error: 'title and eventId are required' });
      }

      const id = session.id || `ses-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const itemToSave = {
        ...session,
        id,
        entityType: 'session',
        createdAt: session.createdAt || new Date().toISOString(),
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

      const merged = {
        ...(existing.Item || {}),
        ...updates,
        id: sessionId,
        entityType: 'session',
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

    // DELETE /api/sessions?id=...
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Session ID is required for deletion' });
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
