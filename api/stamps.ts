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

      const id = stamp.id || `stp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const itemToSave = {
        ...stamp,
        id,
        entityType: 'stamp',
        status: stamp.status || 'pending',
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

    // PUT /api/stamps (Officer Approves Stamp)
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

      const merged = {
        ...existing.Item,
        ...updates,
        id: stampId,
        entityType: 'stamp',
        approvedAt: updates.approvedAt || new Date().toISOString(),
      };

      await client.send(
        new PutCommand({
          TableName: tableName,
          Item: merged,
        })
      );
      return res.status(200).json(merged);
    }

    // DELETE /api/stamps?id=... (Officer Declines Stamp)
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Stamp ID is required for deletion' });
      }

      const toDelete = await client.send(new GetCommand({ TableName: tableName, Key: { id } }));
      if (!isOwnRecord(toDelete.Item)) {
        return res.status(404).json({ error: 'Stamp not found' });
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
