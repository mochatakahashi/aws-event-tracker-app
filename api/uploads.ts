import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

function isUploadRecord(item: any): boolean {
  return Boolean(item) && (item.entityType === 'upload' || (!item.entityType && String(item.id || '').startsWith('upl-')));
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

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { client, tableName } = getDynamoDocClient();

    // GET /api/uploads or GET /api/uploads?eventId=... or GET /api/uploads?category=...
    if (req.method === 'GET') {
      const { id, eventId, category } = req.query;

      if (id && typeof id === 'string') {
        const result = await client.send(
          new GetCommand({
            TableName: tableName,
            Key: { id },
          })
        );
        if (!result.Item || !isUploadRecord(result.Item)) {
          return res.status(404).json({ error: 'Upload not found' });
        }
        return res.status(200).json(result.Item);
      }

      const scanResult = await client.send(
        new ScanCommand({
          TableName: tableName,
        })
      );

      let items = (scanResult.Items || []).filter(isUploadRecord);

      if (eventId && typeof eventId === 'string') {
        items = items.filter((item) => item.eventId === eventId);
      }

      if (category && typeof category === 'string') {
        items = items.filter((item) => item.category === category);
      }

      // Sort newest first
      items.sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime());

      return res.status(200).json(items);
    }

    // POST /api/uploads - Save upload record
    if (req.method === 'POST') {
      const body = req.body || {};
      if (!body.url) {
        return res.status(400).json({ error: 'url is required' });
      }

      const item = {
        id: body.id || `upl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        entityType: 'upload',
        url: body.url,
        name: body.name || 'uploaded-image.jpg',
        size: body.size || 0,
        mimeType: body.mimeType || 'image/jpeg',
        uploadedAt: body.uploadedAt || new Date().toISOString(),
        eventId: body.eventId || '',
        eventTitle: body.eventTitle || '',
        category: body.category || 'banner',
        storageType: body.storageType || 's3',
        width: body.width,
        height: body.height,
      };

      await client.send(
        new PutCommand({
          TableName: tableName,
          Item: item,
        })
      );

      return res.status(201).json(item);
    }

    // DELETE /api/uploads?id=...
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'id query parameter required' });
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
    if (
      err.message?.includes('AWS credentials missing') ||
      err.name === 'ResourceNotFoundException' ||
      err.name === 'UnrecognizedClientException'
    ) {
      return res.status(503).json({
        error: 'DynamoDB backend not configured. Using local persistent storage.',
        fallback: true,
      });
    }

    console.error('Error handling /api/uploads:', err);
    return res.status(500).json({
      error: err.message || 'Internal server error',
    });
  }
}
