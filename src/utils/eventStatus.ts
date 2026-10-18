import type { AppEvent, EventStatus } from '../types/event';
import { imageSrc } from './imageUrl';

/**
 * The status an event should show right now, from its dates: anything that
 * has ended is "accomplished" (Past), anything happening now is "ongoing".
 * Cancelled events stay cancelled. This keeps the Past tab correct even if
 * nobody updates the status by hand after the event.
 */
export function liveStatus(event: Pick<AppEvent, 'status' | 'startAt' | 'endAt'>, now = Date.now()): EventStatus {
  if (event.status === 'cancelled') return 'cancelled';
  const start = new Date(event.startAt).getTime();
  const end = new Date(event.endAt || event.startAt).getTime();
  if (Number.isFinite(end) && end < now) return 'accomplished';
  if (Number.isFinite(start) && start <= now && now <= end) return 'ongoing';
  // Not started yet: trust "accomplished" only if someone set it on purpose
  return event.status === 'accomplished' ? 'accomplished' : 'upcoming';
}

/** The event with its date-based status (and a picture link that works with a private bucket). */
export function withLiveStatus<T extends AppEvent>(event: T, now = Date.now()): T {
  const status = liveStatus(event, now);
  const imageUrl = imageSrc(event.imageUrl);
  return status === event.status && imageUrl === event.imageUrl ? event : { ...event, status, imageUrl };
}
