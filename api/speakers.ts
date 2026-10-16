import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';

/**
 * Speaker directory (single-table DynamoDB, entityType = 'speaker').
 * The app merges these over its built-in seed speakers.
 *
 * GET  /api/speakers
 * POST /api/speakers            { name, headline, company, bio, linkedInUrl?, avatarUrl? }
 * PUT  /api/speakers?id=spk-1   full speaker (creates it if it was a built-in seed speaker)
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

function clean(item: any) {
  if (!item) return item;
  const { entityType: _t, ...rest } = item;
  void _t;
  return rest;
}

function pickSpeaker(body: any) {
  return {
    name: String(body.name || '').trim(),
    headline: String(body.headline || ''),
    company: String(body.company || ''),
    bio: String(body.bio || ''),
    linkedInUrl: body.linkedInUrl ? String(body.linkedInUrl) : undefined,
    avatarUrl: body.avatarUrl ? String(body.avatarUrl) : undefined,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { client, tableName } = getDynamoDocClient();

    if (req.method === 'GET') {
      const items: any[] = [];
      let ExclusiveStartKey: Record<string, any> | undefined;
      do {
        const page = await client.send(
          new ScanCommand({
            TableName: tableName,
            FilterExpression: 'entityType = :t',
            ExpressionAttributeValues: { ':t': 'speaker' },
            ExclusiveStartKey,
          })
        );
        items.push(...(page.Items || []));
        ExclusiveStartKey = page.LastEvaluatedKey;
      } while (ExclusiveStartKey);
      return res.status(200).json(items.map(clean));
    }

    if (req.method === 'POST') {
      const speaker = pickSpeaker(req.body || {});
      if (!speaker.name) return res.status(400).json({ error: 'Speaker name is required' });
      const item = {
        ...speaker,
        id: `spk-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        entityType: 'speaker',
      };
      await client.send(new PutCommand({ TableName: tableName, Item: item }));
      return res.status(201).json(clean(item));
    }

    if (req.method === 'PUT') {
      const id = typeof req.query.id === 'string' ? req.query.id : '';
      if (!id.startsWith('spk-')) return res.status(400).json({ error: 'Speaker id is required' });
      const existing = await client.send(new GetCommand({ TableName: tableName, Key: { id } }));
      if (existing.Item && existing.Item.entityType !== 'speaker') {
        return res.status(409).json({ error: 'Id belongs to another record' });
      }
      const speaker = pickSpeaker({ ...(existing.Item || {}), ...(req.body || {}) });
      if (!speaker.name) return res.status(400).json({ error: 'Speaker name is required' });
      const item = { ...speaker, id, entityType: 'speaker' };
      await client.send(new PutCommand({ TableName: tableName, Item: item }));
      return res.status(200).json(clean(item));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Speakers API Error:', err);
    return res.status(500).json({
      error: err.message || 'Internal server error',
      code: err.name || 'API_ERROR',
    });
  }
}
