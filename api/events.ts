import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  ScanCommand,
  GetCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { ddbDocClient, DYNAMODB_TABLE_NAME } from './lib/aws';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const hasCredentials =
    (process.env.APP_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID) &&
    (process.env.APP_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY);

  if (!hasCredentials) {
    return res.status(503).json({
      error: 'AWS credentials not configured yet. Please add APP_AWS_ACCESS_KEY_ID in Vercel.',
      code: 'AWS_NOT_CONFIGURED',
    });
  }

  try {
    // GET /api/events or GET /api/events?id=...
    if (req.method === 'GET') {
      const { id } = req.query;
      if (id && typeof id === 'string') {
        const result = await ddbDocClient.send(
          new GetCommand({
            TableName: DYNAMODB_TABLE_NAME,
            Key: { id },
          })
        );
        if (!result.Item) {
          return res.status(404).json({ error: 'Event not found' });
        }
        return res.status(200).json(result.Item);
      }

      const result = await ddbDocClient.send(
        new ScanCommand({
          TableName: DYNAMODB_TABLE_NAME,
        })
      );
      return res.status(200).json(result.Items || []);
    }

    // POST /api/events
    if (req.method === 'POST') {
      const event = req.body;
      if (!event || !event.title) {
        return res.status(400).json({ error: 'Event title is required' });
      }

      const id = event.id || `evt-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const itemToSave = {
        ...event,
        id,
        createdAt: event.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await ddbDocClient.send(
        new PutCommand({
          TableName: DYNAMODB_TABLE_NAME,
          Item: itemToSave,
        })
      );
      return res.status(201).json(itemToSave);
    }

    // PUT /api/events or PUT /api/events?id=...
    if (req.method === 'PUT') {
      const { id } = req.query;
      const eventUpdates = req.body;
      const eventId = (id as string) || eventUpdates?.id;

      if (!eventId) {
        return res.status(400).json({ error: 'Event ID is required for update' });
      }

      const existing = await ddbDocClient.send(
        new GetCommand({
          TableName: DYNAMODB_TABLE_NAME,
          Key: { id: eventId },
        })
      );

      const merged = {
        ...(existing.Item || {}),
        ...eventUpdates,
        id: eventId,
        updatedAt: new Date().toISOString(),
      };

      await ddbDocClient.send(
        new PutCommand({
          TableName: DYNAMODB_TABLE_NAME,
          Item: merged,
        })
      );
      return res.status(200).json(merged);
    }

    // DELETE /api/events?id=...
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Event ID is required for deletion' });
      }

      await ddbDocClient.send(
        new DeleteCommand({
          TableName: DYNAMODB_TABLE_NAME,
          Key: { id },
        })
      );
      return res.status(200).json({ success: true, id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('DynamoDB API Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
