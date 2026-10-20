import { describe, expect, it } from 'vitest';
import { WHOLE_ORG, WHOLE_ORG_FILTER, committeeSummary, matchesEventFilter, officerSummary, taskRows } from './taskSummary';
import type { OfficerTask } from '../types/task';

const NOW = new Date('2026-10-20T12:00:00+08:00').getTime();
const t = (o: Partial<OfficerTask>): OfficerTask => ({ id: Math.random().toString(36), title: 'T', assigneeIds: ['a'], status: 'todo', createdBy: 'x', createdAt: '', ...o });

describe('taskSummary', () => {
  it('event filter: all, whole org, one event', () => {
    expect(matchesEventFilter({}, '')).toBe(true);
    expect(matchesEventFilter({}, WHOLE_ORG_FILTER)).toBe(true);
    expect(matchesEventFilter({ eventId: 'e1' }, WHOLE_ORG_FILTER)).toBe(false);
    expect(matchesEventFilter({ eventId: 'e1' }, 'e1')).toBe(true);
    expect(matchesEventFilter({ eventId: 'e2' }, 'e1')).toBe(false);
  });
  it('rows label whole-org tasks and events', () => {
    const rows = taskRows([t({ committee: 'marketing', subcommittee: 'creatives' }), t({ eventId: 'e1', assigneeIds: ['a', 'b'] })], (id) => id.toUpperCase(), (id) => (id === 'e1' ? 'Tech Barangay' : undefined), NOW);
    expect(rows[0]).toMatchObject({ forWhat: WHOLE_ORG, committee: 'Marketing', subcommittee: 'Creatives', status: 'To do', deadline: 'No deadline' });
    expect(rows[1]).toMatchObject({ forWhat: 'Tech Barangay', assignees: 'A, B' });
  });
  it('counts per officer and per committee', () => {
    const tasks = [
      t({ assigneeIds: ['a', 'b'], committee: 'marketing', status: 'done', dueAt: '2026-10-19T09:00:00+08:00', completedAt: '2026-10-18T09:00:00+08:00' }),
      t({ assigneeIds: ['a'], committee: 'marketing', status: 'done', dueAt: '2026-10-10T09:00:00+08:00', completedAt: '2026-10-12T09:00:00+08:00' }),
      t({ assigneeIds: ['a'], committee: 'operations', status: 'in-progress', dueAt: '2026-10-15T09:00:00+08:00' }),
      t({ assigneeIds: ['b'], status: 'todo', dueAt: '2026-10-30T09:00:00+08:00' }),
    ];
    const by = officerSummary(tasks, (id) => ({ name: id === 'a' ? 'Ana' : 'Ben', committee: 'marketing' }), NOW);
    expect(by[0]).toMatchObject({ name: 'Ana', total: 3, done: 2, inProgress: 1, onTime: 1, late: 1, overdue: 1, committee: 'Marketing' });
    expect(by[1]).toMatchObject({ name: 'Ben', total: 2, done: 1, todo: 1, onTime: 1, late: 0, overdue: 0 });
    const c = committeeSummary(tasks, NOW);
    expect(c.find((x) => x.committee === 'Marketing')).toMatchObject({ total: 2, onTime: 1, late: 1 });
    expect(c.find((x) => x.committee === 'No committee')).toMatchObject({ total: 1, todo: 1 });
  });
});
