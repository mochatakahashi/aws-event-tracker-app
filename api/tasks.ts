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
 * Officer tasks assigned by admins (single-table DynamoDB, entityType = 'task').
 *
 * GET    /api/tasks[?assigneeId=&eventId=]
 * POST   /api/tasks              { title, description?, eventId?, assigneeIds, status, dueAt?, createdBy }
 * PUT    /api/tasks?id=tsk-1     partial update
 * DELETE /api/tasks?id=tsk-1
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

const STATUSES = ['todo', 'in-progress', 'done'];
const EDITABLE = [
  'title',
  'description',
  'eventId',
  'assigneeIds',
  'status',
  'dueAt',
  'updatedAt',
  'completedAt',
  'completedBy',
  'committee',
  'subcommittee',
  'pubmat',
];
const COMMITTEES = ['secretariat', 'operations', 'marketing', 'technicals', 'relations'];
const SUBCOMMITTEES: Record<string, string[]> = { marketing: ['creatives', 'media'], secretariat: ['finance', 'documents'] };
const STAGES = ['not-started', 'in-progress', 'for-review', 'approved', 'posted'];

const ids = (v: unknown) => (Array.isArray(v) ? [...new Set(v.filter((x) => typeof x === 'string'))].slice(0, 50) : []);
const text = (v: unknown, max: number) => (v === undefined || v === null || v === '' ? undefined : String(v).slice(0, max));

/** Clean a pubmat object from the request. */
function cleanPubmat(p: any) {
  if (!p || typeof p !== 'object') return undefined;
  const link = text(p.fileLink, 1000);
  return {
    details: text(p.details, 2000),
    designeeIds: ids(p.designeeIds),
    captionWriterIds: ids(p.captionWriterIds),
    posterIds: ids(p.posterIds),
    stage: STAGES.includes(p.stage) ? p.stage : 'not-started',
    postDate: text(p.postDate, 40),
    fileLink: link && /^https?:\/\//i.test(link) ? link : undefined,
    notes: text(p.notes, 2000),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { client, tableName } = getDynamoDocClient();
    const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);

    if (req.method === 'GET') {
      let tasks = await scanType(client, tableName, 'task');
      const assigneeId = str(req.query.assigneeId);
      const eventId = str(req.query.eventId);
      if (assigneeId) tasks = tasks.filter((t) => Array.isArray(t.assigneeIds) && t.assigneeIds.includes(assigneeId));
      if (eventId) tasks = tasks.filter((t) => t.eventId === eventId);
      return res.status(200).json(tasks.map(clean));
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      if (!String(body.title || '').trim()) return res.status(400).json({ error: 'Task title is required' });
      const isPubmat = body.kind === 'pubmat';
      if (!isPubmat && (!Array.isArray(body.assigneeIds) || body.assigneeIds.length === 0)) {
        return res.status(400).json({ error: 'Assign at least one officer' });
      }
      const committee = COMMITTEES.includes(body.committee) ? body.committee : isPubmat ? 'marketing' : undefined;
      const item = {
        id: `tsk-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        entityType: 'task',
        title: String(body.title).trim(),
        description: body.description ? String(body.description) : undefined,
        eventId: body.eventId || undefined,
        assigneeIds: ids(body.assigneeIds),
        status: STATUSES.includes(body.status) ? body.status : 'todo',
        dueAt: body.dueAt || undefined,
        committee,
        subcommittee: committee && (SUBCOMMITTEES[committee] || []).includes(body.subcommittee) ? body.subcommittee : undefined,
        kind: isPubmat ? 'pubmat' : 'task',
        pubmat: isPubmat ? cleanPubmat(body.pubmat) : undefined,
        createdBy: body.createdBy,
        createdAt: new Date().toISOString(),
      };
      await client.send(new PutCommand({ TableName: tableName, Item: item }));
      return res.status(201).json(clean(item));
    }

    if (req.method === 'PUT') {
      const id = str(req.query.id);
      if (!id) return res.status(400).json({ error: 'Task id is required' });
      const result = await client.send(new GetCommand({ TableName: tableName, Key: { id } }));
      if (!result.Item || result.Item.entityType !== 'task') return res.status(404).json({ error: 'Task not found' });
      const body = req.body || {};
      if (body.status !== undefined && !STATUSES.includes(body.status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      const updates: Record<string, any> = {};
      for (const key of EDITABLE) if (key in body) updates[key] = body[key];
      if ('pubmat' in updates) updates.pubmat = cleanPubmat(updates.pubmat);
      if ('assigneeIds' in updates) updates.assigneeIds = ids(updates.assigneeIds);
      const merged = { ...result.Item, ...updates, id, entityType: 'task' };
      await client.send(new PutCommand({ TableName: tableName, Item: merged }));
      return res.status(200).json(clean(merged));
    }

    if (req.method === 'DELETE') {
      const id = str(req.query.id);
      if (!id) return res.status(400).json({ error: 'Task id is required' });
      const result = await client.send(new GetCommand({ TableName: tableName, Key: { id } }));
      if (result.Item?.entityType === 'task') {
        await client.send(new DeleteCommand({ TableName: tableName, Key: { id } }));
      }
      return res.status(200).json({ success: true, id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Tasks API Error:', err);
    return res.status(500).json({
      error: err.message || 'Internal server error',
      code: err.name || 'API_ERROR',
    });
  }
}
