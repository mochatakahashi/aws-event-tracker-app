import { describe, expect, it } from 'vitest';
import { badgesFor, buildLeaderboard } from './badges';
import type { Session, Stamp } from '../types/session';

const s = (id: string, eventId: string, type: Session['type'] = 'workshop', requiresStamp = true) =>
  ({ id, eventId, title: id, type, requiresStamp, startTime: '', endTime: '', room: '', speakerIds: [], status: 'completed', description: '' }) as Session;
const sessions = [s('a1', 'A'), s('a2', 'A'), s('a3', 'A', 'talk'), s('b1', 'B'), s('b2', 'B'), s('b3', 'B', 'keynote')];
let n = 0;
const st = (attendeeId: string, sessionId: string, status: Stamp['status'] = 'approved', at?: string): Stamp => ({
  id: `stp-${n++}`,
  attendeeId,
  sessionId,
  status,
  approvedAt: at ?? `2026-10-0${(n % 9) + 1}T00:00:00Z`,
});

describe('leaderboard', () => {
  const stamps = [
    st('p1', 'a1'), st('p1', 'a2'), st('p1', 'a3'), st('p1', 'b1'), st('p1', 'b2'), st('p1', 'a1'), // dup a1
    st('p2', 'a1'), st('p2', 'b1', 'pending'),
    st('p3', 'a1', 'approved', '2026-09-01T00:00:00Z'),
    st('admin', 'a1'),
  ];

  it('ranks by approved stamps, ignoring pending and duplicates', () => {
    const rows = buildLeaderboard(stamps, sessions, { excludeIds: new Set(['admin']) });
    expect(rows.map((r) => [r.personId, r.stamps, r.rank])).toEqual([
      ['p1', 5, 1],
      ['p3', 1, 2],
      ['p2', 1, 2],
    ]);
    expect(rows[0].workshops).toBe(4);
  });

  it('filters by event', () => {
    const rows = buildLeaderboard(stamps, sessions, { eventId: 'B' });
    expect(rows.map((r) => [r.personId, r.stamps])).toEqual([['p1', 2]]);
  });

  it('awards badges', () => {
    const rows = buildLeaderboard(stamps, sessions);
    const p1 = rows.find((r) => r.personId === 'p1')!;
    expect(p1.badges).toEqual(['first-stamp', 'workshop-warrior', 'cloud-explorer', 'full-passport', 'multi-event']);
    expect(p1.completedEvents).toBe(1); // A complete (a1,a2,a3); B missing b3
    expect(rows.find((r) => r.personId === 'p2')!.badges).toEqual(['first-stamp']);
  });

  it('gives no badges to someone without stamps', () => {
    expect(badgesFor('nobody', stamps, sessions)).toEqual([]);
    expect(badgesFor('p3', stamps, sessions)).toEqual(['first-stamp']);
  });
});
