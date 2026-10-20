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
 * PUT    /api/tasks?id=tsk-1     { actorId, ...changes } partial update
 * DELETE /api/tasks?id=tsk-1&actorId=per-1
 *
 * Who may do what (keep in sync with src/utils/taskScope.ts):
 * - admins and the President: every committee
 * - VP External: Marketing, Relations, Technicals; VP Internal: Operations, Secretariat, Technicals
 * - a committee's Director and Assistant Director: that committee
 *   (assign to its officers, edit, delete, approve what its officers add). Leads' own tasks are live right away.
 * - the officers on a task: change its status and their pubmat progress; withdraw a task they added
 *   that isn't approved yet.
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

/** Everyone on a task: assignees plus the pubmat designer, caption writer and poster. */
function peopleOn(task: any): string[] {
  const pm = task?.pubmat || {};
  return [...(task?.assigneeIds || []), ...(pm.designeeIds || []), ...(pm.captionWriterIds || []), ...(pm.posterIds || [])];
}

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


// ─── Who can manage which tasks ─────────────────────────────────────────────────
// 'all' (admins, President), a list of committees (VPs, Directors, Assistant Directors) or null.
type Scope = 'all' | string[] | null;
const VP_COMMITTEES: Record<string, string[]> = {
  'vp-external': ['marketing', 'relations', 'technicals'],
  'vp-internal': ['operations', 'secretariat', 'technicals'],
};

function scopeOf(u: any): Scope {
  if (!u || u.entityType !== 'user' || (u.status ?? 'approved') !== 'approved') return null;
  if (u.role === 'admin') return 'all';
  if (u.role !== 'officer') return null;
  if (u.officerPosition === 'president') return 'all';
  if (VP_COMMITTEES[u.officerPosition]) return VP_COMMITTEES[u.officerPosition];
  if (['director', 'assistant-director'].includes(u.officerPosition) && COMMITTEES.includes(u.committee)) return [u.committee];
  return null;
}

const scopeHas = (scope: Scope, committee: unknown) =>
  scope === 'all' || (Array.isArray(scope) && typeof committee === 'string' && scope.includes(committee));

function taskInScope(task: any, scope: Scope, people: Map<string, any>): boolean {
  if (scope === 'all') return true;
  if (!scope) return false;
  if (task.committee) return scopeHas(scope, task.committee);
  if (task.kind === 'pubmat') return scopeHas(scope, 'marketing');
  const ids: string[] = Array.isArray(task.assigneeIds) ? task.assigneeIds : [];
  return ids.length > 0 && ids.every((id) => scopeHas(scope, people.get(id)?.committee));
}

function canAssignTo(scope: Scope, person: any): boolean {
  if (!scope || person?.entityType !== 'user' || person.role !== 'officer' || (person.status ?? 'approved') !== 'approved') return false;
  return scopeHas(scope, person.committee);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { client, tableName } = getDynamoDocClient();
    const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);
    const getItem = async (id: unknown) =>
      typeof id === 'string' && id ? (await client.send(new GetCommand({ TableName: tableName, Key: { id } }))).Item : undefined;
    let peopleCache: Map<string, any> | null = null;
    const people = async () => (peopleCache ??= new Map((await scanType(client, tableName, 'user')).map((u) => [u.id, u])));

    if (req.method === 'GET') {
      let tasks = await scanType(client, tableName, 'task');
      const assigneeId = str(req.query.assigneeId);
      const eventId = str(req.query.eventId);
      if (assigneeId) tasks = tasks.filter((t) => Array.isArray(t.assigneeIds) && t.assigneeIds.includes(assigneeId));
      if (eventId) tasks = tasks.filter((t) => t.eventId === eventId);
      return res.status(200).json(tasks.map(clean));
    }

    // Comments on a task: admins and the officers assigned to it.
    //   POST ?action=comment { actorId, id, text }
    if (req.method === 'POST' && req.query.action === 'comment') {
      const body = req.body || {};
      const text = String(body.text || '').trim().slice(0, 1000);
      if (!text) return res.status(400).json({ error: 'Write a comment first.' });
      const [actor, task] = await Promise.all(
        [body.actorId, body.id].map(async (k) => (typeof k === 'string' && k ? (await client.send(new GetCommand({ TableName: tableName, Key: { id: k } }))).Item : null)),
      );
      if (!task || task.entityType !== 'task') return res.status(404).json({ error: 'Task not found' });
      const active = actor?.entityType === 'user' && (actor.status ?? 'approved') === 'approved';
      const onTask =
        peopleOn(task).includes(actor!.id) || task.proposedBy === actor!.id || task.createdBy === actor!.id;
      const allowed = active && (actor!.role === 'admin' || onTask || taskInScope(task, scopeOf(actor), await people()));
      if (!allowed) return res.status(403).json({ error: 'Only admins and the officers on this task can comment.' });
      const comment = {
        id: `cmt-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        authorId: actor!.id,
        authorName: actor!.name || 'Someone',
        text,
        createdAt: new Date().toISOString(),
      };
      const merged = { ...task, comments: [...(Array.isArray(task.comments) ? task.comments : []), comment].slice(-200) };
      await client.send(new PutCommand({ TableName: tableName, Item: merged }));
      return res.status(201).json(clean(merged));
    }

    // Officers propose their own tasks; an admin approves or declines them.
    //   POST ?action=propose { actorId, title, description?, eventId?, dueAt?, committee?, subcommittee? }
    //   POST ?action=review  { actorId, id, approve: boolean, note? }   (admin)
    if (req.method === 'POST' && (req.query.action === 'propose' || req.query.action === 'review')) {
      const body = req.body || {};
      const actor = typeof body.actorId === 'string' ? (await client.send(new GetCommand({ TableName: tableName, Key: { id: body.actorId } }))).Item : null;
      const active = actor?.entityType === 'user' && (actor.status ?? 'approved') === 'approved';
      if (req.query.action === 'propose') {
        if (!active || (actor!.role !== 'officer' && actor!.role !== 'admin')) {
          return res.status(403).json({ error: 'Only officers can add tasks.' });
        }
        const title = String(body.title || '').trim().slice(0, 140);
        if (!title) return res.status(400).json({ error: 'Task title is required' });
        const committee = COMMITTEES.includes(body.committee) ? body.committee : actor!.committee || undefined;
        // Admins and committee leads don't need anyone to approve their own tasks
        const isAdmin = Boolean(scopeOf(actor));
        const item = {
          id: `tsk-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          entityType: 'task',
          title,
          description: body.description ? String(body.description).slice(0, 2000) : undefined,
          eventId: str(body.eventId),
          assigneeIds: [actor!.id],
          status: 'todo',
          dueAt: str(body.dueAt),
          committee,
          subcommittee: committee && (SUBCOMMITTEES[committee] || []).includes(body.subcommittee) ? body.subcommittee : undefined,
          kind: 'task',
          createdBy: actor!.id,
          proposedBy: actor!.id,
          approval: isAdmin ? 'approved' : 'pending',
          createdAt: new Date().toISOString(),
        };
        await client.send(new PutCommand({ TableName: tableName, Item: item }));
        return res.status(201).json(clean(item));
      }
      // review: admins, the President / VPs, or the Director / Assistant Director of the proposer's committee
      const id = str(body.id);
      const found = id ? (await client.send(new GetCommand({ TableName: tableName, Key: { id } }))).Item : null;
      if (!found || found.entityType !== 'task') return res.status(404).json({ error: 'Task not found' });
      const scope = active ? scopeOf(actor) : null;
      const proposer = (await people()).get(found.proposedBy || (found.assigneeIds || [])[0]);
      if (!scope || !scopeHas(scope, proposer?.committee)) {
        return res.status(403).json({ error: "Only admins, the President, the VPs and the committee's Director or Assistant Director can approve this task." });
      }
      const approve = Boolean(body.approve);
      const merged = {
        ...found,
        approval: approve ? 'approved' : 'declined',
        reviewedBy: actor!.id,
        reviewedAt: new Date().toISOString(),
        reviewNote: !approve && body.note ? String(body.note).slice(0, 300) : undefined,
        updatedAt: new Date().toISOString(),
      };
      await client.send(new PutCommand({ TableName: tableName, Item: merged }));
      return res.status(200).json(clean(merged));
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      if (!String(body.title || '').trim()) return res.status(400).json({ error: 'Task title is required' });
      const isPubmat = body.kind === 'pubmat';
      if (!isPubmat && (!Array.isArray(body.assigneeIds) || body.assigneeIds.length === 0)) {
        return res.status(400).json({ error: 'Assign at least one officer' });
      }
      // Only admins, the President / VPs and committee leads assign tasks
      const creator = await getItem(body.actorId || body.createdBy);
      const scope = scopeOf(creator);
      if (!scope) return res.status(403).json({ error: "Only admins, the President, the VPs and committee Directors / Assistant Directors can assign tasks." });
      const requested = COMMITTEES.includes(body.committee) ? body.committee : isPubmat ? 'marketing' : undefined;
      // A lead's tasks belong to one of their committees (their own, if they lead just one)
      const committee = scope === 'all' ? requested : scopeHas(scope, requested) ? requested : scope.length === 1 ? scope[0] : undefined;
      if (scope !== 'all' && !committee) return res.status(400).json({ error: 'Choose one of your committees for this task.' });
      if (isPubmat && committee !== 'marketing') return res.status(403).json({ error: 'Pubmats belong to the Marketing committee.' });
      if (scope !== 'all') {
        const all = await people();
        const assigneeList: string[] = [
          ...(Array.isArray(body.assigneeIds) ? body.assigneeIds : []),
          ...(isPubmat ? [...(body.pubmat?.designeeIds || []), ...(body.pubmat?.captionWriterIds || []), ...(body.pubmat?.posterIds || [])] : []),
        ];
        const outside = assigneeList.filter((id) => !canAssignTo(scope, all.get(id)));
        if (outside.length) return res.status(403).json({ error: 'You can only assign tasks to officers in your committee.' });
      }
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
        createdBy: creator!.id,
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
      // A proposed task can't be worked on until an admin approves it
      if (body.status !== undefined && result.Item.approval && result.Item.approval !== 'approved' && body.status !== result.Item.status) {
        return res.status(409).json({ error: 'This task is waiting for an admin to approve it.' });
      }
      const actor = await getItem(body.actorId);
      const scope = scopeOf(actor);
      const all = await people();
      const manages = taskInScope(result.Item, scope, all);
      const onTask = Boolean(actor) && peopleOn(result.Item).includes(actor!.id);
      if (!manages && !onTask) return res.status(403).json({ error: 'You can only update tasks you are on or that your committee leads.' });
      const updates: Record<string, any> = {};
      // The officers on a task change its status and their pubmat progress; leads change anything
      const allowedKeys = manages ? EDITABLE : ['status', 'completedAt', 'completedBy', 'updatedAt', 'pubmat'];
      for (const key of allowedKeys) if (key in body) updates[key] = body[key];
      if ('pubmat' in updates) {
        const next = cleanPubmat(updates.pubmat);
        const prev = result.Item.pubmat || {};
        updates.pubmat = manages
          ? next
          : { ...next, designeeIds: prev.designeeIds || [], captionWriterIds: prev.captionWriterIds || [], posterIds: prev.posterIds || [] };
      }
      if ('assigneeIds' in updates) updates.assigneeIds = ids(updates.assigneeIds);
      if (manages && scope !== 'all') {
        if (updates.committee !== undefined && !scopeHas(scope, updates.committee)) {
          return res.status(403).json({ error: 'You can only move tasks between your own committees.' });
        }
        const newIds: string[] = [
          ...(updates.assigneeIds || []),
          ...(updates.pubmat ? [...updates.pubmat.designeeIds, ...updates.pubmat.captionWriterIds, ...updates.pubmat.posterIds] : []),
        ];
        if (newIds.some((pid) => !(result.Item.assigneeIds || []).includes(pid) && !canAssignTo(scope, all.get(pid)))) {
          return res.status(403).json({ error: 'You can only assign tasks to officers in your committee.' });
        }
      }
      if (manages) {
        if ('title' in updates) {
          updates.title = text(updates.title, 200);
          if (!updates.title || !String(updates.title).trim()) return res.status(400).json({ error: 'The task needs a name.' });
        }
        if ('description' in updates) updates.description = text(updates.description, 2000);
        // Whole org: no event
        if ('eventId' in updates && !updates.eventId) updates.eventId = undefined;
        if ('assigneeIds' in updates && result.Item.kind !== 'pubmat' && updates.assigneeIds.length === 0) {
          return res.status(400).json({ error: 'Assign at least one officer.' });
        }
      }
      // A moved deadline gets its reminders again
      if ('dueAt' in updates && updates.dueAt !== result.Item.dueAt) {
        updates.dueReminderSentAt = undefined;
        updates.overdueReminderAt = undefined;
      }
      const merged = { ...result.Item, ...updates, id, entityType: 'task' };
      await client.send(new PutCommand({ TableName: tableName, Item: merged }));
      return res.status(200).json(clean(merged));
    }

    if (req.method === 'DELETE') {
      const id = str(req.query.id);
      if (!id) return res.status(400).json({ error: 'Task id is required' });
      const result = await client.send(new GetCommand({ TableName: tableName, Key: { id } }));
      if (result.Item?.entityType === 'task') {
        const actor = await getItem(req.query.actorId);
        const manages = taskInScope(result.Item, scopeOf(actor), await people());
        // Officers can withdraw a task they added while it isn't approved
        const ownProposal = Boolean(actor) && result.Item.proposedBy === actor!.id && result.Item.approval && result.Item.approval !== 'approved';
        if (!manages && !ownProposal) return res.status(403).json({ error: 'You can only delete tasks your committee leads.' });
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
