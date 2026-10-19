import type { NewTaskInput, OfficerTask, UpdateTaskInput } from '../types/task';
import { apiJson, delay, generateId, isRemoteAvailable, localCollection } from './apiClient';

/**
 * Officer tasks assigned by an admin. Stored in DynamoDB through `/api/tasks`
 * when deployed, and in localStorage otherwise.
 */

const API = '/api/tasks';

const local = localCollection<OfficerTask>('aws-event-tracker.tasks.v1', () => []);

function newestFirst(a: OfficerTask, b: OfficerTask) {
  return b.createdAt.localeCompare(a.createdAt);
}

export async function getTasks(): Promise<OfficerTask[]> {
  if (await isRemoteAvailable(API)) {
    return (await apiJson<OfficerTask[]>(API)).sort(newestFirst);
  }
  return delay(local.load().sort(newestFirst));
}

/** Tasks assigned to one officer. */
export async function getTasksForOfficer(personId: string): Promise<OfficerTask[]> {
  if (await isRemoteAvailable(API)) {
    return (await apiJson<OfficerTask[]>(`${API}?assigneeId=${encodeURIComponent(personId)}`)).sort(newestFirst);
  }
  return delay(local.load().filter((t) => t.assigneeIds.includes(personId)).sort(newestFirst));
}

export async function createTask(input: NewTaskInput): Promise<OfficerTask> {
  if (!input.title.trim()) throw new Error('Please enter a task title.');
  if (input.kind !== 'pubmat' && input.assigneeIds.length === 0) throw new Error('Please assign at least one officer.');
  if (await isRemoteAvailable(API)) {
    return apiJson<OfficerTask>(API, { method: 'POST', body: JSON.stringify(input) });
  }
  const task: OfficerTask = { ...input, id: generateId('tsk'), createdAt: new Date().toISOString() };
  local.save([...local.load(), task]);
  return delay(task);
}

export async function updateTask(id: string, changes: UpdateTaskInput, actorId: string): Promise<OfficerTask> {
  const withMeta: UpdateTaskInput = { ...changes, updatedAt: new Date().toISOString() };
  if (changes.status === 'done') {
    withMeta.completedAt = new Date().toISOString();
    withMeta.completedBy = actorId;
  } else if (changes.status) {
    withMeta.completedAt = null;
    withMeta.completedBy = null;
  }
  if (await isRemoteAvailable(API)) {
    return apiJson<OfficerTask>(`${API}?id=${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(withMeta),
    });
  }
  const tasks = local.load();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error('Task not found');
  tasks[idx] = { ...tasks[idx], ...withMeta };
  local.save(tasks);
  return delay(tasks[idx]);
}

/** What an officer fills in to add their own task. */
export interface TaskProposal {
  title: string;
  description?: string;
  eventId?: string;
  dueAt?: string;
  committee?: OfficerTask['committee'];
  subcommittee?: OfficerTask['subcommittee'];
}

/**
 * An officer adds their own task. It waits for an admin to approve it
 * (admins' own are approved right away). Server-checked.
 */
export async function proposeTask(input: TaskProposal, actorId: string, isAdmin = false): Promise<OfficerTask> {
  if (!input.title.trim()) throw new Error('Please enter a task title.');
  if (await isRemoteAvailable(API)) {
    return apiJson<OfficerTask>(`${API}?action=propose`, { method: 'POST', body: JSON.stringify({ ...input, actorId }) });
  }
  const task: OfficerTask = {
    ...input,
    title: input.title.trim(),
    id: generateId('tsk'),
    assigneeIds: [actorId],
    status: 'todo',
    kind: 'task',
    createdBy: actorId,
    proposedBy: actorId,
    approval: isAdmin ? 'approved' : 'pending',
    createdAt: new Date().toISOString(),
  };
  local.save([...local.load(), task]);
  return delay(task);
}

/** Admin approves or declines an officer's task. */
export async function reviewTask(id: string, approve: boolean, actorId: string, note?: string): Promise<OfficerTask> {
  if (await isRemoteAvailable(API)) {
    return apiJson<OfficerTask>(`${API}?action=review`, { method: 'POST', body: JSON.stringify({ id, approve, actorId, note }) });
  }
  const tasks = local.load();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error('Task not found');
  tasks[idx] = {
    ...tasks[idx],
    approval: approve ? 'approved' : 'declined',
    reviewedBy: actorId,
    reviewedAt: new Date().toISOString(),
    reviewNote: approve ? undefined : note,
  };
  local.save(tasks);
  return delay(tasks[idx]);
}

/** Add a comment to a task (admins and the officers assigned). */
export async function commentOnTask(id: string, text: string, actor: { personId: string; name: string }): Promise<OfficerTask> {
  if (!text.trim()) throw new Error('Write a comment first.');
  if (await isRemoteAvailable(API)) {
    return apiJson<OfficerTask>(`${API}?action=comment`, { method: 'POST', body: JSON.stringify({ id, text, actorId: actor.personId }) });
  }
  const tasks = local.load();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error('Task not found');
  tasks[idx] = {
    ...tasks[idx],
    comments: [
      ...(tasks[idx].comments ?? []),
      { id: generateId('cmt'), authorId: actor.personId, authorName: actor.name, text: text.trim(), createdAt: new Date().toISOString() },
    ],
  };
  local.save(tasks);
  return delay(tasks[idx]);
}

export async function deleteTask(id: string): Promise<void> {
  if (await isRemoteAvailable(API)) {
    await apiJson(`${API}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    return;
  }
  local.save(local.load().filter((t) => t.id !== id));
  await delay(null);
}

/** Clear local tasks (tests / dev only). */
export function __resetTasks(): void {
  local.reset();
}
