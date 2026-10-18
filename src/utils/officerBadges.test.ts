import { describe, expect, it } from 'vitest';
import { autoOfficerBadges, officerBadgesFor, OFFICER_BADGES } from './officerBadges';
import type { BoardData } from './leaderboard';
import type { OfficerTask } from '../types/task';

const base: BoardData = { people: [], stamps: [], sessions: [], registrations: [], tasks: [], events: [] };

describe('officer badges', () => {
  it('has unique ids and both automatic and awarded badges', () => {
    expect(new Set(OFFICER_BADGES.map((b) => b.id)).size).toBe(OFFICER_BADGES.length);
    expect(OFFICER_BADGES.some((b) => b.awarded)).toBe(true);
    expect(OFFICER_BADGES.some((b) => !b.awarded)).toBe(true);
  });

  it('gives nothing to an officer with no work', () => {
    expect(autoOfficerBadges('o1', base)).toEqual([]);
  });

  it('earns Event Host when assigned as Host on an event that has started', () => {
    const d: BoardData = {
      ...base,
      events: [
        { id: 'E1', officerIds: ['o1'], officerRoles: { o1: 'host' }, startAt: '2026-01-01T00:00:00Z', status: 'accomplished' },
        { id: 'E2', officerIds: ['o2'], officerRoles: { o2: 'host' }, startAt: '2099-01-01T00:00:00Z', status: 'upcoming' },
      ] as unknown as BoardData['events'],
    };
    expect(autoOfficerBadges('o1', d)).toContain('event-host');
    expect(autoOfficerBadges('o2', d)).not.toContain('event-host');
  });

  it('earns Content Creator for any role on a posted pubmat', () => {
    const t = {
      id: 't',
      title: 'Poster',
      assigneeIds: ['o1', 'o2'],
      status: 'done',
      createdBy: 'a',
      createdAt: '',
      kind: 'pubmat',
      pubmat: { designeeIds: ['o1'], captionWriterIds: [], posterIds: ['o2'], stage: 'posted' },
    } as OfficerTask;
    const d = { ...base, tasks: [t] };
    expect(autoOfficerBadges('o1', d)).toContain('content-creator');
    expect(autoOfficerBadges('o2', d)).toContain('content-creator');
    expect(autoOfficerBadges('o3', d)).not.toContain('content-creator');
  });

  it('lists awarded badges with their event titles', () => {
    const d = { ...base, events: [{ id: 'E1', title: 'Cloud Day' }] as BoardData['events'] };
    const earned = officerBadgesFor(
      { id: 'o1', awards: [{ id: 'w', badge: 'mvp', eventId: 'E1', awardedBy: 'a', awardedAt: '' }] },
      d,
    );
    expect(earned).toHaveLength(1);
    expect(earned[0].badge.id).toBe('mvp');
    expect(earned[0].events).toEqual(['Cloud Day']);
  });
});
