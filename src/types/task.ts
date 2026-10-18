import type { Committee, Subcommittee } from './auth';

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export type TaskApproval = 'pending' | 'approved' | 'declined';

/** Officer-proposed tasks count only once an admin approves them. */
export const isApprovedTask = (t: { approval?: TaskApproval }) => !t.approval || t.approval === 'approved';

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  'in-progress': 'In progress',
  done: 'Done',
};

/** Where a pubmat is in the Marketing pipeline (mirrors the old Google Sheet). */
export type PubmatStage = 'not-started' | 'in-progress' | 'for-review' | 'approved' | 'posted';

export const PUBMAT_STAGES: PubmatStage[] = ['not-started', 'in-progress', 'for-review', 'approved', 'posted'];

export const PUBMAT_STAGE_LABELS: Record<PubmatStage, string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  'for-review': 'For Review',
  approved: 'Approved',
  posted: 'Posted',
};

/** Pubmat (publication material) details for Marketing content items. */
export interface Pubmat {
  /** Details / reference post. */
  details?: string;
  /** Creatives team designee(s) who make the design. */
  designeeIds: string[];
  /** Who writes the caption. */
  captionWriterIds: string[];
  /** Who posts it. */
  posterIds: string[];
  stage: PubmatStage;
  /** Planned post date (ISO). */
  postDate?: string;
  /** Link to the design / Canva / Drive file. */
  fileLink?: string;
  notes?: string;
}

/** A task an admin assigns to one or more officers, or a Marketing pubmat. */
export interface OfficerTask {
  id: string;
  title: string;
  description?: string;
  /** Optional event this task is for. */
  eventId?: string;
  /** Person ids of the officers assigned (for pubmats: designees + caption writers + posters). */
  assigneeIds: string[];
  status: TaskStatus;
  /** Deadline (ISO 8601). */
  dueAt?: string;
  /** Committee and sub-committee the task belongs to. */
  committee?: Committee;
  subcommittee?: Subcommittee;
  /** 'pubmat' items appear in the Marketing Content Tracker. */
  kind?: 'task' | 'pubmat';
  pubmat?: Pubmat;
  /** Person id of the admin who created it (or the officer who proposed it). */
  createdBy: string;
  /**
   * Officer-proposed tasks wait for an admin: 'pending' → 'approved' / 'declined'.
   * Missing means approved (tasks an admin made).
   */
  approval?: TaskApproval;
  /** Officer who proposed the task (officer-added tasks only). */
  proposedBy?: string;
  /** Admin who approved or declined it, when, and why (declines). */
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string | null;
  /** Person id of whoever marked it done. */
  completedBy?: string | null;
}

export type NewTaskInput = Omit<OfficerTask, 'id' | 'createdAt' | 'updatedAt' | 'completedAt' | 'completedBy'>;
export type UpdateTaskInput = Partial<Omit<OfficerTask, 'id' | 'createdAt' | 'createdBy'>>;

/** Everyone on a pubmat, for notifications and "My tasks". */
export function pubmatPeople(p: Pubmat): string[] {
  return [...new Set([...p.designeeIds, ...p.captionWriterIds, ...p.posterIds])];
}

/** Task status that matches a pubmat stage. */
export function statusForStage(stage: PubmatStage): TaskStatus {
  return stage === 'posted' ? 'done' : stage === 'not-started' ? 'todo' : 'in-progress';
}

/** Google Doc with the caption guidelines for Marketing. */
export const CAPTION_GUIDELINES_URL =
  'https://docs.google.com/document/d/1dMMyBQtYgGwg87Q45XHGTZEVlBsrX366VMgDBryfc1k/edit?usp=sharing';
