import type { Person } from '../types/attendee';
import type { BoardData } from './leaderboard';
import { isApprovedTask } from '../types/task';

/**
 * Officer badges. Some are earned automatically from the work officers do;
 * the rest are given by an admin (e.g. "Best in Pubmat" for one event).
 */

export type AutoOfficerBadgeId =
  | 'first-duty'
  | 'stamp-master'
  | 'door-keeper'
  | 'task-finisher'
  | 'content-creator'
  | 'event-host'
  | 'event-regular';

export type AwardBadgeId = 'best-host' | 'best-pubmat' | 'mvp' | 'team-player' | 'rising-star';

export type OfficerBadgeId = AutoOfficerBadgeId | AwardBadgeId;

export interface OfficerBadge {
  id: OfficerBadgeId;
  emoji: string;
  name: string;
  description: string;
  /** Given by an admin instead of earned automatically. */
  awarded: boolean;
}

export const OFFICER_BADGES: OfficerBadge[] = [
  { id: 'first-duty', emoji: '🎟️', name: 'First Duty', description: 'Approve a stamp or check someone in for the first time', awarded: false },
  { id: 'stamp-master', emoji: '⭐', name: 'Stamp Master', description: 'Approve 25 stamps', awarded: false },
  { id: 'door-keeper', emoji: '🚪', name: 'Door Keeper', description: 'Check in 25 attendees', awarded: false },
  { id: 'task-finisher', emoji: '✅', name: 'Task Finisher', description: 'Finish 5 tasks', awarded: false },
  { id: 'content-creator', emoji: '🎨', name: 'Content Creator', description: 'Work on a pubmat that got posted', awarded: false },
  { id: 'event-host', emoji: '🎤', name: 'Event Host', description: 'Host an event (assigned as Host)', awarded: false },
  { id: 'event-regular', emoji: '🚀', name: 'Event Regular', description: 'Work at 3 events', awarded: false },
  { id: 'best-host', emoji: '🏅', name: 'Best Host', description: 'Given by an admin for outstanding hosting', awarded: true },
  { id: 'best-pubmat', emoji: '🖼️', name: 'Best in Pubmat', description: 'Given by an admin for the best pubmat', awarded: true },
  { id: 'mvp', emoji: '🏆', name: 'Event MVP', description: 'Given by an admin to the standout officer of an event', awarded: true },
  { id: 'team-player', emoji: '🤝', name: 'Team Player', description: 'Given by an admin for helping the whole team', awarded: true },
  { id: 'rising-star', emoji: '🌟', name: 'Rising Star', description: 'Given by an admin to a new officer who stepped up', awarded: true },
];

export const AUTO_OFFICER_BADGES = OFFICER_BADGES.filter((b) => !b.awarded);
export const AWARD_BADGES = OFFICER_BADGES.filter((b) => b.awarded);

export function officerBadge(id: string): OfficerBadge | undefined {
  return OFFICER_BADGES.find((b) => b.id === id);
}

/** Automatic badges an officer has earned from their work so far. */
export function autoOfficerBadges(personId: string, d: BoardData, now = Date.now()): AutoOfficerBadgeId[] {
  const stampsApproved = d.stamps.filter((s) => s.status === 'approved' && s.approvedBy === personId).length;
  const checkIns = d.registrations.filter((r) => r.checkedIn && r.checkedInBy === personId).length;
  const tasksDone = d.tasks.filter((t) => isApprovedTask(t) && t.assigneeIds.includes(personId) && t.status === 'done').length;
  const postedPubmat = d.tasks.some(
    (t) =>
      t.kind === 'pubmat' &&
      t.pubmat?.stage === 'posted' &&
      [...t.pubmat.designeeIds, ...t.pubmat.captionWriterIds, ...t.pubmat.posterIds].includes(personId),
  );
  const worked = d.events.filter((e) => (e.officerIds || []).includes(personId) && e.status !== 'cancelled');
  const hosted = worked.some(
    (e) => (e.officerRoles?.[personId] || '').toLowerCase() === 'host' && new Date(e.startAt).getTime() <= now,
  );

  const out: AutoOfficerBadgeId[] = [];
  if (stampsApproved + checkIns >= 1) out.push('first-duty');
  if (stampsApproved >= 25) out.push('stamp-master');
  if (checkIns >= 25) out.push('door-keeper');
  if (tasksDone >= 5) out.push('task-finisher');
  if (postedPubmat) out.push('content-creator');
  if (hosted) out.push('event-host');
  if (worked.length >= 3) out.push('event-regular');
  return out;
}

export interface EarnedOfficerBadge {
  badge: OfficerBadge;
  /** How many times (awards can repeat for different events). */
  count: number;
  /** Event titles for awarded badges. */
  events: string[];
}

/** Every officer badge a person has, automatic and awarded, in catalogue order. */
export function officerBadgesFor(person: Pick<Person, 'id' | 'awards'>, d: BoardData): EarnedOfficerBadge[] {
  const auto = new Set<string>(autoOfficerBadges(person.id, d));
  const titles = new Map(d.events.map((e) => [e.id, e.title]));
  const out: EarnedOfficerBadge[] = [];
  for (const b of OFFICER_BADGES) {
    if (!b.awarded) {
      if (auto.has(b.id)) out.push({ badge: b, count: 1, events: [] });
      continue;
    }
    const mine = (person.awards ?? []).filter((a) => a.badge === b.id);
    if (mine.length) {
      out.push({
        badge: b,
        count: mine.length,
        events: mine.map((a) => (a.eventId ? titles.get(a.eventId) : undefined)).filter((t): t is string => Boolean(t)),
      });
    }
  }
  return out;
}

/** Number of officer badges (awards count each time) - used for points. */
export function officerBadgeCount(person: Pick<Person, 'id' | 'awards'>, d: BoardData): number {
  return officerBadgesFor(person, d).reduce((n, e) => n + e.count, 0);
}
