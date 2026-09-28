/** RSVP state for a registration. */
export type RsvpStatus = 'going' | 'interested' | 'declined';

export const RSVP_STATUSES: RsvpStatus[] = ['going', 'interested', 'declined'];

/**
 * A person in the shared directory. A person can register for any number of
 * events. The logged-in user maps to one of these.
 */
export interface Person {
  id: string;
  name: string;
  email: string;
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
  /** Whether the attendee has been checked in on-site (admin-facing). */
  checkedIn: boolean;
  /** ISO 8601 timestamp of when the registration was created. */
  registeredAt: string;
}

export type NewRegistrationInput = Omit<Registration, 'id' | 'registeredAt'> & {
  registeredAt?: string;
};
