import type {
  AppEvent,
  NewEventInput,
  UpdateEventInput,
} from '../types/event';
import { seedEvents } from './seedData';

/**
 * Event service with hybrid support:
 * Connects to live Amazon DynamoDB via /api/events when AWS credentials
 * are configured, and gracefully falls back to local memory store if offline or not yet configured.
 */

let localEvents: AppEvent[] = seedEvents.map((e) => ({
  ...e,
  speakerIds: [...e.speakerIds],
  tags: [...e.tags],
}));

let useRemoteApi: boolean | null = null;

function clone(event: AppEvent): AppEvent {
  return { ...event, speakerIds: [...event.speakerIds], tags: [...event.tags] };
}

function cloneList(list: AppEvent[]): AppEvent[] {
  return list.map(clone);
}

async function checkRemoteApi(): Promise<boolean> {
  if (typeof window === 'undefined' || import.meta.env?.MODE === 'test') {
    return false;
  }
  if (useRemoteApi !== null) return useRemoteApi;
  try {
    const res = await fetch('/api/events', { method: 'GET' });
    if (res.status === 503 || !res.ok) {
      useRemoteApi = false;
      return false;
    }
    useRemoteApi = true;
    return true;
  } catch {
    useRemoteApi = false;
    return false;
  }
}

/** Return all events, soonest start first. */
export async function getEvents(): Promise<AppEvent[]> {
  try {
    const isRemote = await checkRemoteApi();
    if (isRemote) {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.sort(
            (a: AppEvent, b: AppEvent) =>
              new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
          );
        }
      }
    }
  } catch (err) {
    console.warn('Falling back to local events store:', err);
  }

  const sorted = [...localEvents].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );
  return cloneList(sorted);
}

/** Return a single event by id, or null if not found. */
export async function getEvent(id: string): Promise<AppEvent | null> {
  try {
    const isRemote = await checkRemoteApi();
    if (isRemote) {
      const res = await fetch(`/api/events?id=${encodeURIComponent(id)}`);
      if (res.ok) {
        return await res.json();
      }
    }
  } catch (err) {
    console.warn('Falling back to local event store for getEvent:', err);
  }

  const found = localEvents.find((e) => e.id === id);
  return found ? clone(found) : null;
}

/** Create a new event and return the persisted record. */
export async function createEvent(input: NewEventInput): Promise<AppEvent> {
  try {
    const isRemote = await checkRemoteApi();
    if (isRemote) {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (res.ok) {
        return await res.json();
      }
    }
  } catch (err) {
    console.warn('Falling back to local createEvent:', err);
  }

  const created: AppEvent = {
    ...input,
    id: `evt-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    speakerIds: [...(input.speakerIds ?? [])],
    tags: [...(input.tags ?? [])],
  };
  localEvents = [created, ...localEvents];
  return clone(created);
}

/** Update an existing event; rejects if the id is unknown. */
export async function updateEvent(
  id: string,
  changes: UpdateEventInput
): Promise<AppEvent> {
  try {
    const isRemote = await checkRemoteApi();
    if (isRemote) {
      const res = await fetch(`/api/events?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
      if (res.ok) {
        return await res.json();
      }
    }
  } catch (err) {
    console.warn('Falling back to local updateEvent:', err);
  }

  const index = localEvents.findIndex((e) => e.id === id);
  if (index === -1) {
    return Promise.reject(new Error(`Event not found: ${id}`));
  }
  const updated: AppEvent = { ...localEvents[index], ...changes, id };
  if (changes.speakerIds) updated.speakerIds = [...changes.speakerIds];
  if (changes.tags) updated.tags = [...changes.tags];
  localEvents[index] = updated;
  return clone(updated);
}

/** Delete an event by id; resolves to true if something was removed. */
export async function deleteEvent(id: string): Promise<boolean> {
  try {
    const isRemote = await checkRemoteApi();
    if (isRemote) {
      const res = await fetch(`/api/events?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        return true;
      }
    }
  } catch (err) {
    console.warn('Falling back to local deleteEvent:', err);
  }

  const before = localEvents.length;
  localEvents = localEvents.filter((e) => e.id !== id);
  return localEvents.length < before;
}

/** Assign a speaker to an event. */
export async function assignSpeaker(
  eventId: string,
  speakerId: string
): Promise<AppEvent> {
  const event = await getEvent(eventId);
  if (!event) return Promise.reject(new Error(`Event not found: ${eventId}`));
  const speakerIds = event.speakerIds.includes(speakerId)
    ? event.speakerIds
    : [...event.speakerIds, speakerId];
  return updateEvent(eventId, { speakerIds });
}

/** Remove a speaker from an event. */
export async function unassignSpeaker(
  eventId: string,
  speakerId: string
): Promise<AppEvent> {
  const event = await getEvent(eventId);
  if (!event) return Promise.reject(new Error(`Event not found: ${eventId}`));
  const speakerIds = event.speakerIds.filter((id) => id !== speakerId);
  return updateEvent(eventId, { speakerIds });
}

/** Reset the store to the original seed data (tests / dev only). */
export function __resetEvents(): void {
  useRemoteApi = null;
  localEvents = seedEvents.map((e) => ({
    ...e,
    speakerIds: [...e.speakerIds],
    tags: [...e.tags],
  }));
}
