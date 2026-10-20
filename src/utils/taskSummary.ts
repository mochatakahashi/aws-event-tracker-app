/**
 * Table rows and summaries for the task board: the table view, the
 * per-officer summary and the Excel download all use these.
 */
import { COMMITTEE_LABELS, SUBCOMMITTEE_LABELS } from './people';
import type { Committee } from '../types/auth';
import { TASK_STATUS_LABELS, deadlineInfo, type OfficerTask } from '../types/task';

/** Label for tasks that aren't for a specific event. */
export const WHOLE_ORG = 'Whole org';

/** Filter value for "whole org" tasks in the event filter. */
export const WHOLE_ORG_FILTER = '__org';

/** Does the task match the event filter ('' = all, WHOLE_ORG_FILTER, or an event id)? */
export function matchesEventFilter(t: Pick<OfficerTask, 'eventId'>, filter: string): boolean {
  if (!filter) return true;
  if (filter === WHOLE_ORG_FILTER) return !t.eventId;
  return t.eventId === filter;
}

export interface TaskRow {
  id: string;
  title: string;
  committee: string;
  subcommittee: string;
  forWhat: string;
  assignees: string;
  status: string;
  /** Raw values for sorting. */
  statusOrder: number;
  dueAt?: string;
  deadline: string;
  tone: ReturnType<typeof deadlineInfo>['tone'];
  completedAt?: string;
}

const STATUS_ORDER = { todo: 0, 'in-progress': 1, done: 2 } as const;

export function taskRows(
  tasks: OfficerTask[],
  nameOf: (personId: string) => string,
  eventTitle: (eventId: string) => string | undefined,
  now = Date.now(),
): TaskRow[] {
  return tasks.map((t) => {
    const d = deadlineInfo(t, now);
    return {
      id: t.id,
      title: t.title,
      committee: t.committee ? COMMITTEE_LABELS[t.committee] : '',
      subcommittee: t.subcommittee ? SUBCOMMITTEE_LABELS[t.subcommittee] : '',
      forWhat: t.eventId ? eventTitle(t.eventId) || 'Event' : WHOLE_ORG,
      assignees: t.assigneeIds.map(nameOf).join(', '),
      status: TASK_STATUS_LABELS[t.status],
      statusOrder: STATUS_ORDER[t.status],
      dueAt: t.dueAt,
      deadline: d.label,
      tone: d.tone,
      completedAt: t.completedAt || undefined,
    };
  });
}

export interface Counts {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  onTime: number;
  late: number;
  overdue: number;
}

const emptyCounts = (): Counts => ({ total: 0, todo: 0, inProgress: 0, done: 0, onTime: 0, late: 0, overdue: 0 });

function add(c: Counts, t: OfficerTask, now: number) {
  c.total++;
  if (t.status === 'todo') c.todo++;
  else if (t.status === 'in-progress') c.inProgress++;
  else c.done++;
  const d = deadlineInfo(t, now);
  if (d.label === 'Done on time') c.onTime++;
  else if (t.status === 'done' && d.tone === 'late') c.late++;
  else if (t.status !== 'done' && d.tone === 'late') c.overdue++;
}

export interface OfficerSummary extends Counts {
  personId: string;
  name: string;
  committee: string;
}

/** One row per officer on the tasks (busiest first). */
export function officerSummary(
  tasks: OfficerTask[],
  personOf: (id: string) => { name: string; committee?: Committee | null } | undefined,
  now = Date.now(),
): OfficerSummary[] {
  const by = new Map<string, OfficerSummary>();
  for (const t of tasks) {
    for (const id of new Set(t.assigneeIds)) {
      let row = by.get(id);
      if (!row) {
        const p = personOf(id);
        row = { personId: id, name: p?.name || id, committee: p?.committee ? COMMITTEE_LABELS[p.committee] : '', ...emptyCounts() };
        by.set(id, row);
      }
      add(row, t, now);
    }
  }
  return [...by.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

/** One row per committee. */
export function committeeSummary(tasks: OfficerTask[], now = Date.now()): ({ committee: string } & Counts)[] {
  const by = new Map<string, Counts>();
  for (const t of tasks) {
    const key = t.committee ? COMMITTEE_LABELS[t.committee] : 'No committee';
    if (!by.has(key)) by.set(key, emptyCounts());
    add(by.get(key)!, t, now);
  }
  return [...by.entries()].map(([committee, c]) => ({ committee, ...c }));
}
