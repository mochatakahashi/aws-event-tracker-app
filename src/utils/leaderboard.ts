import type { Session, Stamp } from '../types/session';
import type { Registration, Person } from '../types/attendee';
import type { OfficerTask } from '../types/task';
import type { AppEvent } from '../types/event';
import { buildLeaderboard, type BadgeId } from './badges';
import { officerBadgesFor, type EarnedOfficerBadge } from './officerBadges';

/**
 * Achievement points for the Builder Leaderboard. Everyone with an approved
 * account is listed (0 points included): every non-admin on the Attendees
 * board, and officers also on the Officers board.
 */

export const ATTENDEE_POINTS = {
  stamp: 10,
  workshopBonus: 5,
  checkIn: 15,
  badge: 20,
} as const;

export const OFFICER_POINTS = {
  stampApproved: 5,
  checkInDone: 5,
  taskDone: 20,
  eventVolunteered: 25,
  badge: 20,
} as const;

export interface BoardData {
  people: Person[];
  stamps: Stamp[];
  sessions: Session[];
  registrations: Registration[];
  tasks: OfficerTask[];
  events: AppEvent[];
}

export interface AttendeeRow {
  personId: string;
  points: number;
  stamps: number;
  workshops: number;
  checkIns: number;
  badges: BadgeId[];
  rank: number;
}

export interface OfficerRow {
  personId: string;
  points: number;
  stampsApproved: number;
  checkInsDone: number;
  tasksDone: number;
  tasksAssigned: number;
  eventsVolunteered: number;
  /** Officer badges (automatic + admin-awarded). */
  badges: EarnedOfficerBadge[];
  rank: number;
}

/** Highest points first; same points share a rank (1, 2, 2, 4); ties listed by name. */
function rankRows<T extends { personId: string; points: number; rank: number }>(rows: T[], people: Map<string, Person>): T[] {
  rows.sort(
    (a, b) =>
      b.points - a.points ||
      (people.get(a.personId)?.name ?? '').localeCompare(people.get(b.personId)?.name ?? '') ||
      a.personId.localeCompare(b.personId),
  );
  rows.forEach((r, i) => {
    const prev = rows[i - 1];
    r.rank = prev && prev.points === r.points ? prev.rank : i + 1;
  });
  return rows;
}

/** Attendees board. With `eventId`, only that event counts (badge points are left out). */
export function attendeeBoard(d: BoardData, eventId?: string): AttendeeRow[] {
  const peopleById = new Map(d.people.map((p) => [p.id, p]));
  const sessionById = new Map(d.sessions.map((s) => [s.id, s]));
  const allBadges = new Map(buildLeaderboard(d.stamps, d.sessions).map((r) => [r.personId, r.badges]));

  // One approved stamp per person + session
  const approved = new Map<string, Set<string>>();
  for (const st of d.stamps) {
    const session = sessionById.get(st.sessionId);
    if (st.status !== 'approved' || !session) continue;
    if (eventId && session.eventId !== eventId) continue;
    if (!approved.has(st.attendeeId)) approved.set(st.attendeeId, new Set());
    approved.get(st.attendeeId)!.add(st.sessionId);
  }

  const rows: AttendeeRow[] = d.people
    .filter((p) => p.role !== 'admin')
    .map((p) => {
      const mine = [...(approved.get(p.id) ?? [])];
      const workshops = mine.filter((id) => sessionById.get(id)?.type === 'workshop').length;
      const checkIns = d.registrations.filter(
        (r) => r.personId === p.id && r.checkedIn && (!eventId || r.eventId === eventId),
      ).length;
      const badges = allBadges.get(p.id) ?? [];
      const points =
        mine.length * ATTENDEE_POINTS.stamp +
        workshops * ATTENDEE_POINTS.workshopBonus +
        checkIns * ATTENDEE_POINTS.checkIn +
        (eventId ? 0 : badges.length * ATTENDEE_POINTS.badge);
      return { personId: p.id, points, stamps: mine.length, workshops, checkIns, badges, rank: 0 };
    });
  return rankRows(rows, peopleById);
}

/** Officers board. With `eventId`, only work for that event counts (badge points are left out). */
export function officerBoard(d: BoardData, eventId?: string): OfficerRow[] {
  const peopleById = new Map(d.people.map((p) => [p.id, p]));
  const sessionById = new Map(d.sessions.map((s) => [s.id, s]));
  const rows: OfficerRow[] = d.people
    .filter((p) => p.role === 'officer')
    .map((p) => {
      const stampsApproved = d.stamps.filter((st) => {
        const session = sessionById.get(st.sessionId);
        return st.status === 'approved' && st.approvedBy === p.id && session && (!eventId || session.eventId === eventId);
      }).length;
      const checkInsDone = d.registrations.filter(
        (r) => r.checkedIn && r.checkedInBy === p.id && (!eventId || r.eventId === eventId),
      ).length;
      const mine = d.tasks.filter((t) => t.assigneeIds.includes(p.id) && (!eventId || t.eventId === eventId));
      const tasksDone = mine.filter((t) => t.status === 'done').length;
      const tasksAssigned = mine.length;
      const eventsVolunteered = d.events.filter(
        (e) => (e.officerIds || []).includes(p.id) && (!eventId || e.id === eventId),
      ).length;
      const badges = officerBadgesFor(p, d);
      const badgeCount = badges.reduce((n, b) => n + b.count, 0);
      const points =
        stampsApproved * OFFICER_POINTS.stampApproved +
        checkInsDone * OFFICER_POINTS.checkInDone +
        tasksDone * OFFICER_POINTS.taskDone +
        eventsVolunteered * OFFICER_POINTS.eventVolunteered +
        (eventId ? 0 : badgeCount * OFFICER_POINTS.badge);
      return { personId: p.id, points, stampsApproved, checkInsDone, tasksDone, tasksAssigned, eventsVolunteered, badges, rank: 0 };
    });
  return rankRows(rows, peopleById);
}
