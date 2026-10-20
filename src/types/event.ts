import type { EventEvaluation } from './evaluation';
/** How the event is delivered. */
export type EventModality = 'onsite' | 'hybrid' | 'virtual';

/** Lifecycle status of an event. */
export type EventStatus = 'upcoming' | 'ongoing' | 'accomplished' | 'cancelled';

/** Tag/type classifications for an event. */
export type EventTag = 'technical' | 'leadership' | 'career-growth' | 'diversity';

export const EVENT_MODALITIES: EventModality[] = [
  'onsite',
  'hybrid',
  'virtual',
];

export const EVENT_STATUSES: EventStatus[] = [
  'upcoming',
  'ongoing',
  'accomplished',
  'cancelled',
];

export const EVENT_TAGS: EventTag[] = [
  'technical',
  'leadership',
  'career-growth',
  'diversity',
];

/**
 * A real-world event tracked by AWS Student Builder Group – Asia Pacific College.
 * Speakers are referenced by id from the shared speaker directory; attendees are
 * tracked separately via registrations.
 */
/** One row of an event's program flow. */
export interface ProgramRow {
  time: string;
  duration?: string;
  activity: string;
  personInCharge?: string;
}

export interface AppEvent {
  id: string;
  title: string;
  description: string;
  /** How the event is delivered (onsite, hybrid, virtual). */
  modality: EventModality;
  status: EventStatus;
  /** Classification tags (technical, leadership, career-growth, diversity). */
  tags: EventTag[];
  /** ISO 8601 start datetime. */
  startAt: string;
  /** ISO 8601 end datetime. */
  endAt: string;
  /** Venue / location, e.g. "Asia Pacific College" or "Online". */
  venue: string;
  /** Number of participants (actual or estimated). */
  participants: number;
  /** Whether the participants count is an estimate. */
  participantsEstimated?: boolean;
  /** Maximum number of attendees (0 = unlimited). */
  capacity: number;
  /** Ids of speakers (from the speaker directory) assigned to this event. */
  speakerIds: string[];
  /** Ids of people assigned as officers for this event. */
  officerIds?: string[];
  /** Roles of the assigned officers mapped by their person ID. */
  officerRoles?: Record<string, string>;
  /**
   * Staff list: assigned officers who may approve stamps / check people in at
   * this event. Only an admin can change these (server-checked). Admins can
   * always do both.
   */
  stampOfficerIds?: string[];
  checkinOfficerIds?: string[];
  /** Optional custom image URL for the event cover. */
  imageUrl?: string;
  /** Link to external event page (e.g. registration form). */
  externalUrl?: string;
  /** Club / organization hosting the event. */
  club?: string;
  /** Partner orgs co-organizing the event with AWS SBG-APC (shown on the event page). */
  coOrganizers?: string[];
  /** 'officers': an internal officers-only meeting - everyone can see it, only officers (and admins) can register. */
  audience?: 'everyone' | 'officers';
  /** Program flow (run of show), shown as a table on the event page. */
  programFlow?: ProgramRow[];
  /** false: the certificate doesn't need every stamp (default: events with stamp sessions need all of them). */
  stampsRequired?: boolean;
  /** Evaluation form (missing: the standard questions). Opens 30 minutes before the event ends. */
  evaluation?: EventEvaluation;
  /** Version of the club's official event info applied (see src/data/clubEventInfo.ts). */
  infoVersion?: number;
  /** Automatically assigned timestamp. */
  createdAt?: string;
}

export type NewEventInput = Omit<AppEvent, 'id'>;
export type UpdateEventInput = Partial<Omit<AppEvent, 'id'>>;
