/** Authenticated user (no sensitive fields). */
export interface User {
  username: string;
  name: string;
  role: 'admin' | 'attendee';
  /** Id of the matching person in the attendee directory. */
  personId: string;
}

/** Credentials submitted from the login form. */
export interface Credentials {
  username: string;
  password: string;
}
