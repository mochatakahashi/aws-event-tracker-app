import type { Committee } from '../types/auth';
import type { OfficerTask } from '../types/task';

/**
 * Who can monitor and assign officer tasks (keep in sync with api/tasks.ts):
 * - 'all': admins and the President (every committee)
 * - VP External: Marketing, Relations, Technicals
 * - VP Internal: Operations, Secretariat, Technicals
 * - a committee's Director and Assistant Director: only that committee
 * - null: everyone else (they see their own tasks)
 */
export type TaskScope = 'all' | Committee[] | null;

export const VP_COMMITTEES: Record<'vp-external' | 'vp-internal', Committee[]> = {
  'vp-external': ['marketing', 'relations', 'technicals'],
  'vp-internal': ['operations', 'secretariat', 'technicals'],
};

/** Whether a committee is within the scope. */
export function scopeHas(scope: TaskScope, committee: string | null | undefined): boolean {
  return scope === 'all' || (Boolean(scope) && Boolean(committee) && scope!.includes(committee as Committee));
}

type Person = { role?: string; status?: string; officerPosition?: string | null; committee?: string | null };

export function taskScope(u: Person | null | undefined): TaskScope {
  if (!u || (u.status && u.status !== 'approved')) return null;
  if (u.role === 'admin') return 'all';
  if (u.role !== 'officer') return null;
  if (u.officerPosition === 'president') return 'all';
  if (u.officerPosition === 'vp-external' || u.officerPosition === 'vp-internal') return VP_COMMITTEES[u.officerPosition];
  if ((u.officerPosition === 'director' || u.officerPosition === 'assistant-director') && u.committee) return [u.committee as Committee];
  return null;
}

/** Officers a lead can assign tasks to: their committee (or every officer for 'all'). */
export function canAssignTo(scope: TaskScope, person: Person | null | undefined): boolean {
  if (!scope || !person || person.role !== 'officer' || (person.status && person.status !== 'approved')) return false;
  return scopeHas(scope, person.committee);
}

/**
 * Whether a task falls under a lead's scope: its committee, or (no committee
 * set) everyone on it is in that committee.
 */
export function taskInScope(
  task: Pick<OfficerTask, 'committee' | 'assigneeIds' | 'kind'>,
  scope: TaskScope,
  personOf: (id: string) => Person | null | undefined,
): boolean {
  if (scope === 'all') return true;
  if (!scope) return false;
  if (task.committee) return scopeHas(scope, task.committee);
  if (task.kind === 'pubmat') return scopeHas(scope, 'marketing');
  return task.assigneeIds.length > 0 && task.assigneeIds.every((id) => scopeHas(scope, personOf(id)?.committee));
}

/** A proposed task belongs to the committee of the officer who added it. */
export function proposalInScope(
  task: Pick<OfficerTask, 'proposedBy' | 'assigneeIds'>,
  scope: TaskScope,
  personOf: (id: string) => Person | null | undefined,
): boolean {
  if (scope === 'all') return true;
  if (!scope) return false;
  const who = task.proposedBy || task.assigneeIds[0];
  return Boolean(who) && scopeHas(scope, personOf(who!)?.committee);
}

export function scopeLabel(scope: TaskScope, labels: Record<string, string>): string {
  if (scope === 'all') return 'All committees';
  if (!scope) return '';
  return scope.length === 1 ? `${labels[scope[0]] ?? scope[0]} committee` : scope.map((c) => labels[c] ?? c).join(', ');
}
