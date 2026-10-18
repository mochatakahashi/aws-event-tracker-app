import type { AppEvent } from '../types/event';

/**
 * Event staff list: which assigned officers may approve stamps or check
 * people in. Admins can always do both; other officers only for events where
 * an admin ticked them on the staff list. The server checks the same rule.
 */

export type StaffDuty = 'stamps' | 'checkin';

export const DUTY_LABELS: Record<StaffDuty, string> = {
  stamps: 'Approve stamps',
  checkin: 'Check people in',
};

interface Actor {
  role?: string;
  personId?: string;
}

export function dutyIds(event: Pick<AppEvent, 'stampOfficerIds' | 'checkinOfficerIds'>, duty: StaffDuty): string[] {
  return (duty === 'stamps' ? event.stampOfficerIds : event.checkinOfficerIds) ?? [];
}

/** Can this user do the duty at this event? */
export function canDo(user: Actor | null | undefined, event: AppEvent | null | undefined, duty: StaffDuty): boolean {
  if (!user || !event) return false;
  if (user.role === 'admin') return true;
  if (user.role !== 'officer' || !user.personId) return false;
  return dutyIds(event, duty).includes(user.personId);
}

/** Events where the user can do the duty (admins: all). */
export function eventsWithDuty(user: Actor | null | undefined, events: AppEvent[], duty: StaffDuty): AppEvent[] {
  return events.filter((e) => canDo(user, e, duty));
}

/** Events where the user has any staff duty. */
export function staffEvents(user: Actor | null | undefined, events: AppEvent[]): AppEvent[] {
  return events.filter((e) => canDo(user, e, 'stamps') || canDo(user, e, 'checkin'));
}

/** Suggested duties for a new event role (admin can change the ticks). */
export function defaultDutiesForRole(role: string): StaffDuty[] {
  const r = role.toLowerCase();
  if (r === 'lead') return ['stamps', 'checkin'];
  if (r === 'registration booth') return ['checkin'];
  if (r === 'usher') return ['stamps'];
  return [];
}
