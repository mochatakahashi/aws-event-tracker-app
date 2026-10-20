import type { AppEvent } from '../types/event';

/**
 * Event staff list: which assigned officers may approve stamps or check
 * people in. Admins can always do both; other officers only for events where
 * an admin ticked them on the staff list. The server checks the same rule.
 */

export type StaffDuty = 'stamps' | 'checkin' | 'food';

export const DUTY_LABELS: Record<StaffDuty, string> = {
  stamps: 'Approve stamps',
  checkin: 'Check people in',
  food: 'Food stubs',
};

export interface StaffActor {
  role?: string;
  personId?: string;
  /** Co-organizer staff: the partner org they work for (set by an admin). */
  partnerOrg?: string | null;
}
type Actor = StaffActor;

/** Co-organizer staff: an attendee account an admin marked as working for a partner org. */
export function isPartnerStaff(user: Actor | null | undefined): boolean {
  return Boolean(user && user.role === 'attendee' && user.partnerOrg && user.partnerOrg.trim());
}

/** Accounts that can be put on an event's staff list: officers and co-organizer staff. */
export function mayWorkEvents(user: Actor | null | undefined): boolean {
  return Boolean(user && (user.role === 'admin' || user.role === 'officer' || isPartnerStaff(user)));
}

export function dutyIds(event: Pick<AppEvent, 'stampOfficerIds' | 'checkinOfficerIds' | 'foodOfficerIds'>, duty: StaffDuty): string[] {
  return (duty === 'stamps' ? event.stampOfficerIds : duty === 'checkin' ? event.checkinOfficerIds : event.foodOfficerIds) ?? [];
}

/**
 * Can this user do the duty at this event? Admins always; officers and
 * co-organizer staff only when an admin ticked them for that duty.
 */
export function canDo(user: Actor | null | undefined, event: AppEvent | null | undefined, duty: StaffDuty): boolean {
  if (!user || !event) return false;
  if (user.role === 'admin') return true;
  if (!user.personId || !(user.role === 'officer' || isPartnerStaff(user))) return false;
  return dutyIds(event, duty).includes(user.personId);
}

/** Events where the user can do the duty (admins: all). */
export function eventsWithDuty(user: Actor | null | undefined, events: AppEvent[], duty: StaffDuty): AppEvent[] {
  return events.filter((e) => canDo(user, e, duty));
}

/** Events where the user has any staff duty. */
export function staffEvents(user: Actor | null | undefined, events: AppEvent[]): AppEvent[] {
  return events.filter((e) => canDo(user, e, 'stamps') || canDo(user, e, 'checkin') || (Boolean(e.food?.enabled) && canDo(user, e, 'food')));
}

/** Suggested duties for a new event role (admin can change the ticks). */
export function defaultDutiesForRole(role: string): StaffDuty[] {
  const r = role.toLowerCase();
  if (r === 'lead') return ['stamps', 'checkin'];
  if (r === 'registration booth' || r === 'co-organizer') return ['checkin'];
  if (r === 'usher') return ['stamps'];
  return [];
}
