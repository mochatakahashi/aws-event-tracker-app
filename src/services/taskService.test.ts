import { describe, it, expect, beforeEach } from 'vitest';
import { createTask, getTasks, getTasksForOfficer, updateTask, deleteTask, __resetTasks } from './taskService';

describe('taskService', () => {
  beforeEach(() => {
    localStorage.clear();
    __resetTasks();
  });

  it('assigns a task that the officer can see and finish', async () => {
    const task = await createTask({
      title: 'Prepare registration booth',
      assigneeIds: ['per-2'],
      status: 'todo',
      createdBy: 'per-1',
    });
    expect(await getTasksForOfficer('per-2')).toHaveLength(1);
    expect(await getTasksForOfficer('per-3')).toHaveLength(0);

    const done = await updateTask(task.id, { status: 'done' }, 'per-2');
    expect(done.status).toBe('done');
    expect(done.completedBy).toBe('per-2');

    const reopened = await updateTask(task.id, { status: 'todo' }, 'per-2');
    expect(reopened.completedAt).toBeNull();
  });

  it('requires a title and at least one officer', async () => {
    await expect(createTask({ title: ' ', assigneeIds: ['per-2'], status: 'todo', createdBy: 'per-1' })).rejects.toThrow();
    await expect(createTask({ title: 'X', assigneeIds: [], status: 'todo', createdBy: 'per-1' })).rejects.toThrow();
  });

  it('deletes a task', async () => {
    const task = await createTask({ title: 'X', assigneeIds: ['per-2'], status: 'todo', createdBy: 'per-1' });
    await deleteTask(task.id, 'per-1');
    expect(await getTasks()).toHaveLength(0);
  });
});
