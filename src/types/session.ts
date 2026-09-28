/** Type of session within an event. */
export type SessionType = 'keynote' | 'talk' | 'workshop' | 'break' | 'networking' | 'panel';

/** Lifecycle status of a session. */
export type SessionStatus = 'not-started' | 'ongoing' | 'completed';

/**
 * A session within an event (e.g. a keynote talk, workshop, break).
 */
export interface Session {
  id: string;
  eventId: string;
  title: string;
  description: string;
  /** ISO 8601 start time. */
  startTime: string;
  /** ISO 8601 end time. */
  endTime: string;
  /** Room or location within the venue. */
  room: string;
  /** Ids of speakers for this session. */
  speakerIds: string[];
  type: SessionType;
  status: SessionStatus;
  /** Whether this session requires a stamp (activity completion). */
  requiresStamp: boolean;
}

/**
 * A stamp awarded to an attendee for completing a session's activity.
 * Officers approve stamps; students cannot self-approve.
 */
export interface Stamp {
  id: string;
  sessionId: string;
  attendeeId: string;
  /** Officer who approved this stamp. */
  approvedBy?: string;
  /** ISO 8601 timestamp of approval. */
  approvedAt?: string;
  status: 'pending' | 'approved';
}

export type NewStampInput = Pick<Stamp, 'sessionId' | 'attendeeId' | 'status'>;
