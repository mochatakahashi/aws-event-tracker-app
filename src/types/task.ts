export type TaskStatus = 'todo' | 'in-progress' | 'done';

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  'in-progress': 'In progress',
  done: 'Done',
};

/** A task an admin assigns to one or more officers. */
export interface OfficerTask {
  id: string;
  title: string;
  description?: string;
  /** Optional event this task is for. */
  eventId?: string;
  /** Person ids of the officers assigned. */
  assigneeIds: string[];
  status: TaskStatus;
  /** Optional due date (ISO 8601). */
  dueAt?: string;
  /** Person id of the admin who created it. */
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string | null;
  /** Person id of whoever marked it done. */
  completedBy?: string | null;
}

export type NewTaskInput = Omit<OfficerTask, 'id' | 'createdAt' | 'updatedAt' | 'completedAt' | 'completedBy'>;
export type UpdateTaskInput = Partial<Omit<OfficerTask, 'id' | 'createdAt' | 'createdBy'>>;
