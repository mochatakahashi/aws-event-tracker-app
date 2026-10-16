import type { Person, Registration, RsvpStatus } from '../types/attendee';
import type { User } from '../types/auth';
import { seedPeople, seedRegistrations } from './seedData';
import { getUsers } from './authService';
import { apiJson, delay, generateId, isRemoteAvailable, localCollection } from './apiClient';

/**
 * People directory + event registrations.
 *
 * People come from approved accounts (see authService). Registrations are
 * stored in DynamoDB through `/api/registrations` when deployed, and in
 * localStorage otherwise, so every login sees the same list.
 */

const API = '/api/registrations';

const local = localCollection<Registration>('aws-event-tracker.registrations.v1', () =>
  seedRegistrations.map((r) => ({ ...r })),
);

function toPerson(u: User): Person {
  const seed = seedPeople.find((p) => p.id === u.personId);
  return {
    ...(seed || {}),
    id: u.personId,
    name: u.name,
    email: u.email || seed?.email || u.username,
    studentId: u.studentId ?? seed?.studentId,
    avatarUrl: u.avatarUrl ?? seed?.avatarUrl,
    bio: u.bio ?? seed?.bio,
    socials: u.socials ?? seed?.socials,
    role: u.role,
    memberType: u.memberType,
    organization: u.organization,
    officerPosition: u.officerPosition,
    committee: u.committee,
  };
}

/** All people in the directory (approved accounts). */
export async function getPeople(): Promise<Person[]> {
  const users = await getUsers();
  return users.filter((u) => !u.status || u.status === 'approved').map(toPerson);
}

/** A single person by id, or null. */
export async function getPerson(id: string): Promise<Person | null> {
  return (await getPeople()).find((p) => p.id === id) ?? null;
}

/** Multiple people by id. */
export async function getPeopleByIds(ids: string[]): Promise<Person[]> {
  const set = new Set(ids);
  return (await getPeople()).filter((p) => set.has(p.id));
}

/** Every registration (admin monitoring). */
export async function getAllRegistrations(): Promise<Registration[]> {
  if (await isRemoteAvailable(API)) return apiJson<Registration[]>(API);
  return delay(local.load());
}

/** Registrations for a given event. */
export async function getRegistrationsByEvent(eventId: string): Promise<Registration[]> {
  if (await isRemoteAvailable(API)) {
    return apiJson<Registration[]>(`${API}?eventId=${encodeURIComponent(eventId)}`);
  }
  return delay(local.load().filter((r) => r.eventId === eventId));
}

/** Registrations for a given person (their "tickets"). */
export async function getRegistrationsByPerson(personId: string): Promise<Registration[]> {
  if (await isRemoteAvailable(API)) {
    return apiJson<Registration[]>(`${API}?personId=${encodeURIComponent(personId)}`);
  }
  return delay(local.load().filter((r) => r.personId === personId));
}

/** The registration linking a person to an event, if any. */
export async function findRegistration(eventId: string, personId: string): Promise<Registration | null> {
  const regs = await getRegistrationsByPerson(personId);
  return regs.find((r) => r.eventId === eventId) ?? null;
}

/**
 * Register a person for an event (or update their RSVP if already registered).
 */
export async function registerForEvent(
  eventId: string,
  personId: string,
  rsvp: RsvpStatus = 'going',
): Promise<Registration> {
  if (await isRemoteAvailable(API)) {
    return apiJson<Registration>(API, {
      method: 'POST',
      body: JSON.stringify({ eventId, personId, rsvp }),
    });
  }
  const regs = local.load();
  const existing = regs.find((r) => r.eventId === eventId && r.personId === personId);
  if (existing) {
    existing.rsvp = rsvp;
    local.save(regs);
    return delay({ ...existing });
  }
  const created: Registration = {
    id: generateId('reg'),
    eventId,
    personId,
    rsvp,
    checkedIn: false,
    registeredAt: new Date().toISOString(),
  };
  local.save([...regs, created]);
  return delay({ ...created });
}

/** Cancel a person's registration for an event. Returns true if removed. */
export async function cancelRegistration(eventId: string, personId: string): Promise<boolean> {
  if (await isRemoteAvailable(API)) {
    const res = await apiJson<{ removed: boolean }>(
      `${API}?eventId=${encodeURIComponent(eventId)}&personId=${encodeURIComponent(personId)}`,
      { method: 'DELETE' },
    );
    return res.removed;
  }
  const regs = local.load();
  const kept = regs.filter((r) => !(r.eventId === eventId && r.personId === personId));
  local.save(kept);
  return delay(kept.length < regs.length);
}

async function updateRegistration(
  registrationId: string,
  change: (reg: Registration) => Partial<Registration>,
): Promise<Registration> {
  if (await isRemoteAvailable(API)) {
    const current = await apiJson<Registration>(`${API}?id=${encodeURIComponent(registrationId)}`);
    return apiJson<Registration>(`${API}?id=${encodeURIComponent(registrationId)}`, {
      method: 'PUT',
      body: JSON.stringify(change(current)),
    });
  }
  const regs = local.load();
  const reg = regs.find((r) => r.id === registrationId);
  if (!reg) throw new Error(`Registration not found: ${registrationId}`);
  Object.assign(reg, change(reg));
  local.save(regs);
  return delay({ ...reg });
}

/** Update the RSVP of an existing registration by id; rejects if unknown. */
export function setRsvp(registrationId: string, rsvp: RsvpStatus): Promise<Registration> {
  return updateRegistration(registrationId, () => ({ rsvp }));
}

/** Toggle check-in for a registration (admin-facing); rejects if unknown. */
export function toggleCheckIn(registrationId: string): Promise<Registration> {
  return updateRegistration(registrationId, (reg) => ({ checkedIn: !reg.checkedIn }));
}

/** Count of registrations for an event. */
export async function countRegistrations(eventId: string): Promise<number> {
  return (await getRegistrationsByEvent(eventId)).length;
}

/** Reset registrations to seed data (tests / dev only). */
export function __resetRegistrations(): void {
  local.reset();
}
