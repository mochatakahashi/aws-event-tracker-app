import { describe, it, expect, beforeEach } from 'vitest';
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  assignSpeaker,
  unassignSpeaker,
  __resetEvents,
} from './eventService';
import { seedEvents } from './seedData';

const NEW_EVENT = {
  title: 'Test Meetup',
  description: 'A meetup created in a test.',
  category: 'meetup' as const,
  status: 'upcoming' as const,
  startAt: '2026-12-01T18:00:00.000Z',
  endAt: '2026-12-01T20:00:00.000Z',
  venue: 'Test Venue',
  capacity: 50,
  speakerIds: [] as string[],
};

describe('eventService', () => {
  beforeEach(() => {
    __resetEvents();
  });

  it('loads all seeded events sorted by soonest start', async () => {
    const result = await getEvents();
    expect(result).toHaveLength(seedEvents.length);
    for (let i = 1; i < result.length; i++) {
      const prev = new Date(result[i - 1].startAt).getTime();
      const curr = new Date(result[i].startAt).getTime();
      expect(prev).toBeLessThanOrEqual(curr);
    }
  });

  it('gets an event by id', async () => {
    const event = await getEvent('evt-1');
    expect(event?.title).toBe('CloudConf 2026');
  });

  it('returns null for an unknown id', async () => {
    expect(await getEvent('nope')).toBeNull();
  });

  it('creates a new event', async () => {
    const created = await createEvent(NEW_EVENT);
    expect(created.id).toBeTruthy();
    const all = await getEvents();
    expect(all).toHaveLength(seedEvents.length + 1);
    expect(all.some((e) => e.title === 'Test Meetup')).toBe(true);
  });

  it('updates an event', async () => {
    const updated = await updateEvent('evt-1', { status: 'completed' });
    expect(updated.status).toBe('completed');
    expect((await getEvent('evt-1'))?.status).toBe('completed');
  });

  it('rejects updating an unknown event', async () => {
    await expect(updateEvent('nope', { status: 'completed' })).rejects.toThrow(
      /not found/i,
    );
  });

  it('deletes an event', async () => {
    expect(await deleteEvent('evt-1')).toBe(true);
    expect(await getEvent('evt-1')).toBeNull();
  });

  it('assigns and unassigns a speaker', async () => {
    const assigned = await assignSpeaker('evt-2', 'spk-4');
    expect(assigned.speakerIds).toContain('spk-4');
    // Idempotent.
    const again = await assignSpeaker('evt-2', 'spk-4');
    expect(again.speakerIds.filter((id) => id === 'spk-4')).toHaveLength(1);

    const removed = await unassignSpeaker('evt-2', 'spk-4');
    expect(removed.speakerIds).not.toContain('spk-4');
  });
});
