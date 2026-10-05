/** Kind of event. */
export type EventCategory = 'conference' | 'workshop' | 'meetup' | 'webinar';

/** Lifecycle status of an event. */
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export const EVENT_CATEGORIES: EventCategory[] = [
  'conference',
  'workshop',
  'meetup',
  'webinar',
];

export const EVENT_STATUSES: EventStatus[] = [
  'upcoming',
  'ongoing',
  'completed',
  'cancelled',
];

/**
 * A real-world event (conference, workshop, meetup, webinar). Speakers are
 * referenced by id from the shared speaker directory; attendees are tracked
 * separately via registrations.
 */
export interface AppEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  status: EventStatus;
  /** ISO 8601 start datetime. */
  startAt: string;
  /** ISO 8601 end datetime. */
  endAt: string;
  /** Venue / location, e.g. "Main Hall, Convention Center" or "Online". */
  venue: string;
  /** Maximum number of attendees (0 = unlimited). */
  capacity: number;
  /** Ids of speakers (from the speaker directory) assigned to this event. */
  speakerIds: string[];
  /** Optional custom image URL for the event cover. */
  imageUrl?: string;
  /** Automatically assigned timestamp. */
  createdAt?: string;
}

export type NewEventInput = Omit<AppEvent, 'id'>;
export type UpdateEventInput = Partial<Omit<AppEvent, 'id'>>;
