import type { Session, Stamp } from '../types/session';

/**
 * Builder Leaderboard: ranks people by approved stamps and completed
 * workshops, and works out which achievement badges they've earned.
 */

export type BadgeId = 'first-stamp' | 'workshop-warrior' | 'cloud-explorer' | 'full-passport' | 'multi-event';

export interface Badge {
  id: BadgeId;
  emoji: string;
  name: string;
  description: string;
}

export const BADGES: Badge[] = [
  { id: 'first-stamp', emoji: '⭐', name: 'First Stamp', description: 'Get your first stamp approved' },
  { id: 'workshop-warrior', emoji: '🛠️', name: 'Workshop Warrior', description: 'Complete 3 workshops' },
  { id: 'cloud-explorer', emoji: '☁️', name: 'Cloud Explorer', description: 'Collect 5 stamps' },
  { id: 'full-passport', emoji: '🏆', name: 'Full Passport Complete', description: 'Collect every stamp of an event' },
  { id: 'multi-event', emoji: '🚀', name: 'Multi-Event Builder', description: 'Collect stamps at 2 or more events' },
];

export interface LeaderboardRow {
  personId: string;
  stamps: number;
  workshops: number;
  /** Events where every stamp session was approved. */
  completedEvents: number;
  eventsWithStamps: number;
  badges: BadgeId[];
  /** Time of the last approved stamp (ties go to whoever got there first). */
  lastStampAt: string;
  rank: number;
}

/**
 * Build the ranking. `eventId` limits stamps to one event; badges are always
 * computed from all of a person's stamps so they don't change with the filter.
 */
export function buildLeaderboard(
  stamps: Stamp[],
  sessions: Session[],
  opts: { eventId?: string; excludeIds?: Set<string> } = {},
): LeaderboardRow[] {
  const sessionById = new Map(sessions.map((s) => [s.id, s]));
  const stampSessionsByEvent = new Map<string, number>();
  for (const s of sessions) {
    if (s.requiresStamp) stampSessionsByEvent.set(s.eventId, (stampSessionsByEvent.get(s.eventId) ?? 0) + 1);
  }

  // One approved stamp per person + session (ignore duplicates and unknown sessions)
  const byPerson = new Map<string, Map<string, Stamp>>();
  for (const st of stamps) {
    if (st.status !== 'approved' || !sessionById.has(st.sessionId)) continue;
    if (opts.excludeIds?.has(st.attendeeId)) continue;
    if (!byPerson.has(st.attendeeId)) byPerson.set(st.attendeeId, new Map());
    byPerson.get(st.attendeeId)!.set(st.sessionId, st);
  }

  const rows: LeaderboardRow[] = [];
  for (const [personId, mine] of byPerson) {
    const all = [...mine.values()];
    const perEvent = new Map<string, number>();
    for (const st of all) {
      const ev = sessionById.get(st.sessionId)!.eventId;
      perEvent.set(ev, (perEvent.get(ev) ?? 0) + 1);
    }
    const completedEvents = [...perEvent.entries()].filter(
      ([ev, n]) => (stampSessionsByEvent.get(ev) ?? 0) > 0 && n >= (stampSessionsByEvent.get(ev) ?? 0),
    ).length;
    const allWorkshops = all.filter((st) => sessionById.get(st.sessionId)!.type === 'workshop').length;

    const badges: BadgeId[] = [];
    if (all.length >= 1) badges.push('first-stamp');
    if (allWorkshops >= 3) badges.push('workshop-warrior');
    if (all.length >= 5) badges.push('cloud-explorer');
    if (completedEvents >= 1) badges.push('full-passport');
    if (perEvent.size >= 2) badges.push('multi-event');

    const counted = opts.eventId ? all.filter((st) => sessionById.get(st.sessionId)!.eventId === opts.eventId) : all;
    if (counted.length === 0) continue;
    rows.push({
      personId,
      stamps: counted.length,
      workshops: counted.filter((st) => sessionById.get(st.sessionId)!.type === 'workshop').length,
      completedEvents: opts.eventId
        ? Number(counted.length >= (stampSessionsByEvent.get(opts.eventId) ?? Infinity))
        : completedEvents,
      eventsWithStamps: perEvent.size,
      badges,
      lastStampAt: counted.reduce((max, st) => ((st.approvedAt ?? '') > max ? st.approvedAt ?? '' : max), ''),
      rank: 0,
    });
  }

  rows.sort(
    (a, b) =>
      b.stamps - a.stamps ||
      b.workshops - a.workshops ||
      (a.lastStampAt || '9999').localeCompare(b.lastStampAt || '9999') ||
      a.personId.localeCompare(b.personId),
  );
  // Same stamps + workshops share a rank (1, 2, 2, 4)
  rows.forEach((r, i) => {
    const prev = rows[i - 1];
    r.rank = prev && prev.stamps === r.stamps && prev.workshops === r.workshops ? prev.rank : i + 1;
  });
  return rows;
}

/** Badges for one person (all events), even if they have no stamps yet. */
export function badgesFor(personId: string, stamps: Stamp[], sessions: Session[]): BadgeId[] {
  return buildLeaderboard(stamps.filter((s) => s.attendeeId === personId), sessions)[0]?.badges ?? [];
}
