import type {
  Person,
  Registration,
  RsvpStatus,
} from '../types/attendee';
import { seedPeople, seedRegistrations } from './seedData';

/**
 * In-memory people directory + event registrations. Async to mirror a real API.
 */

let people: Person[] = seedPeople.map((p) => ({ ...p }));
let registrations: Registration[] = seedRegistrations.map((r) => ({ ...r }));

const LATENCY = 150;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY));
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/** All people in the directory. */
export async function getPeople(): Promise<Person[]> {
  return delay(people.map((p) => ({ ...p })));
}

/** A single person by id, or null. */
export async function getPerson(id: string): Promise<Person | null> {
  const found = people.find((p) => p.id === id);
  return delay(found ? { ...found } : null);
}

/** Registrations for a given event. */
export async function getRegistrationsByEvent(
  eventId: string,
): Promise<Registration[]> {
  return delay(
    registrations.filter((r) => r.eventId === eventId).map((r) => ({ ...r })),
  );
}

/** Registrations for a given person (their "tickets"). */
export async function getRegistrationsByPerson(
  personId: string,
): Promise<Registration[]> {
  return delay(
    registrations.filter((r) => r.personId === personId).map((r) => ({ ...r })),
  );
}

/** The registration linking a person to an event, if any. */
export async function findRegistration(
  eventId: string,
  personId: string,
): Promise<Registration | null> {
  const found = registrations.find(
    (r) => r.eventId === eventId && r.personId === personId,
  );
  return delay(found ? { ...found } : null);
}

/**
 * Register a person for an event (or update their RSVP if already registered).
 */
export async function registerForEvent(
  eventId: string,
  personId: string,
  rsvp: RsvpStatus = 'going',
): Promise<Registration> {
  const existing = registrations.find(
    (r) => r.eventId === eventId && r.personId === personId,
  );
  if (existing) {
    existing.rsvp = rsvp;
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
  registrations = [...registrations, created];
  return delay({ ...created });
}

/** Cancel a person's registration for an event. Returns true if removed. */
export async function cancelRegistration(
  eventId: string,
  personId: string,
): Promise<boolean> {
  const before = registrations.length;
  registrations = registrations.filter(
    (r) => !(r.eventId === eventId && r.personId === personId),
  );
  return delay(registrations.length < before);
}

/** Update the RSVP of an existing registration by id; rejects if unknown. */
export async function setRsvp(
  registrationId: string,
  rsvp: RsvpStatus,
): Promise<Registration> {
  const reg = registrations.find((r) => r.id === registrationId);
  if (!reg)
    return Promise.reject(new Error(`Registration not found: ${registrationId}`));
  reg.rsvp = rsvp;
  return delay({ ...reg });
}

/** Toggle check-in for a registration (admin-facing); rejects if unknown. */
export async function toggleCheckIn(
  registrationId: string,
): Promise<Registration> {
  const reg = registrations.find((r) => r.id === registrationId);
  if (!reg)
    return Promise.reject(new Error(`Registration not found: ${registrationId}`));
  reg.checkedIn = !reg.checkedIn;
  return delay({ ...reg });
}

/** Count of registrations for an event. */
export async function countRegistrations(eventId: string): Promise<number> {
  return delay(registrations.filter((r) => r.eventId === eventId).length);
}

/** Reset people + registrations to seed data (tests / dev only). */
export function __resetRegistrations(): void {
  people = seedPeople.map((p) => ({ ...p }));
  registrations = seedRegistrations.map((r) => ({ ...r }));
}
