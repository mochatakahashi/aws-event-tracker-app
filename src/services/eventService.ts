import type {
  AppEvent,
  NewEventInput,
  UpdateEventInput,
} from '../types/event';
import { seedEvents } from './seedData';

/**
 * In-memory event store. Simulates an async remote API so the component layer
 * is wired exactly as it would be against a real backend. To connect a real
 * backend later, replace the function bodies with fetch/SDK calls and keep the
 * same signatures.
 */

let events: AppEvent[] = seedEvents.map((e) => ({ ...e, speakerIds: [...e.speakerIds] }));

const LATENCY = 150;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY));
}

function generateId(): string {
  return `evt-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function clone(event: AppEvent): AppEvent {
  return { ...event, speakerIds: [...event.speakerIds] };
}

/** Return all events, soonest start first. */
export async function getEvents(): Promise<AppEvent[]> {
  const sorted = [...events].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );
  return delay(sorted.map(clone));
}

/** Return a single event by id, or null if not found. */
export async function getEvent(id: string): Promise<AppEvent | null> {
  const found = events.find((e) => e.id === id);
  return delay(found ? clone(found) : null);
}

/** Create a new event and return the persisted record. */
export async function createEvent(input: NewEventInput): Promise<AppEvent> {
  const created: AppEvent = {
    ...input,
    id: generateId(),
    speakerIds: [...(input.speakerIds ?? [])],
  };
  events = [created, ...events];
  return delay(clone(created));
}

/** Update an existing event; rejects if the id is unknown. */
export async function updateEvent(
  id: string,
  changes: UpdateEventInput,
): Promise<AppEvent> {
  const index = events.findIndex((e) => e.id === id);
  if (index === -1) {
    return Promise.reject(new Error(`Event not found: ${id}`));
  }
  const updated: AppEvent = { ...events[index], ...changes, id };
  if (changes.speakerIds) updated.speakerIds = [...changes.speakerIds];
  events[index] = updated;
  return delay(clone(updated));
}

/** Delete an event by id; resolves to true if something was removed. */
export async function deleteEvent(id: string): Promise<boolean> {
  const before = events.length;
  events = events.filter((e) => e.id !== id);
  return delay(events.length < before);
}

/** Assign a speaker to an event (no-op if already assigned). */
export async function assignSpeaker(
  eventId: string,
  speakerId: string,
): Promise<AppEvent> {
  const event = events.find((e) => e.id === eventId);
  if (!event) return Promise.reject(new Error(`Event not found: ${eventId}`));
  if (!event.speakerIds.includes(speakerId)) {
    event.speakerIds.push(speakerId);
  }
  return delay(clone(event));
}

/** Remove a speaker from an event. */
export async function unassignSpeaker(
  eventId: string,
  speakerId: string,
): Promise<AppEvent> {
  const event = events.find((e) => e.id === eventId);
  if (!event) return Promise.reject(new Error(`Event not found: ${eventId}`));
  event.speakerIds = event.speakerIds.filter((id) => id !== speakerId);
  return delay(clone(event));
}

/** Reset the store to the original seed data (tests / dev only). */
export function __resetEvents(): void {
  events = seedEvents.map((e) => ({ ...e, speakerIds: [...e.speakerIds] }));
}
