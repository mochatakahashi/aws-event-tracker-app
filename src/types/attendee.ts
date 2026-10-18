import type { Committee, MemberType, OfficerPosition, SocialLinks, Subcommittee, UserRole } from './auth';

/**
 * Registration status. Attendees register (pending); an admin or the event's
 * check-in team approves or declines. Checking in also approves.
 */
export type RsvpStatus = 'pending' | 'approved' | 'declined';

export const RSVP_STATUSES: RsvpStatus[] = ['pending', 'approved', 'declined'];

export const RSVP_LABELS: Record<RsvpStatus, string> = { pending: 'Pending', approved: 'Approved', declined: 'Declined' };

/** Older records used going / interested. */
export function normalizeRsvp(v: unknown): RsvpStatus {
  return v === 'going' ? 'approved' : v === 'interested' ? 'pending' : v === 'approved' || v === 'declined' ? v : 'pending';
}

/**
 * A person in the shared directory (built from approved accounts). A person
 * can register for any number of events. The logged-in user maps to one of these.
 */
export interface Person {
  id: string;
  name: string;
  email: string;
  /** Social links for networking. */
  socials?: SocialLinks;
  /** Short bio / tagline. */
  bio?: string;
  /** Student ID. */
  studentId?: string;
  /** Profile avatar URL. */
  avatarUrl?: string;
  role?: UserRole;
  memberType?: MemberType;
  /** School / company / organization for outside attendees. */
  organization?: string;
  officerPosition?: OfficerPosition | null;
  committee?: Committee | null;
  subcommittee?: Subcommittee | null;
  /** Badges an admin awarded (officers). */
  awards?: Award[];
}

/** A badge an admin gave someone, e.g. "Best in Pubmat" for one event. */
export interface Award {
  id: string;
  badge: string;
  eventId?: string;
  note?: string;
  awardedBy: string;
  awardedAt: string;
}

export type NewPersonInput = Omit<Person, 'id'>;

/**
 * Links a person to an event. This is the "ticket": one per person per event.
 */
export interface Registration {
  id: string;
  eventId: string;
  personId: string;
  rsvp: RsvpStatus;
  /** Sessions this person plans to attend (an event can have none). */
  sessionIds?: string[];
  /** Whether the attendee has been checked in on-site (admin-facing). */
  checkedIn: boolean;
  /** ISO 8601 timestamp of when the registration was created. */
  registeredAt: string;
  /** When and by whom (person id) the attendee was checked in. */
  checkedInAt?: string;
  checkedInBy?: string;
  /** Certificate code (reserved at check-in); the certificate unlocks after the event ends. */
  certificateId?: string;
  certificateIssuedAt?: string;
  /** S3 key of the stored PDF (missing until uploaded). */
  certificateKey?: string;
  /** Why the last upload failed; retried on the next check-in scan or download. */
  certificateError?: string;
}

export type NewRegistrationInput = Omit<Registration, 'id' | 'registeredAt'> & {
  registeredAt?: string;
};
