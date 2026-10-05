/** Authenticated user (no sensitive fields). */
export interface User {
  username: string;
  name: string;
  role: 'admin' | 'officer' | 'attendee';
  /** Id of the matching person in the attendee directory. */
  personId: string;
  /** Profile avatar URL (optional). */
  avatarUrl?: string;
  /** Student ID for APC students. */
  studentId?: string;
  /** Role requested during sign up, pending admin approval. */
  requestedRole?: 'officer' | 'admin' | null;
}

/** Social links that a user can add to their profile. */
export interface SocialLinks {
  linkedIn?: string;
  github?: string;
  twitterX?: string;
  website?: string;
}

/** Credentials submitted from the login form. */
export interface Credentials {
  username: string;
  password: string;
}

/** Data submitted from the signup form. */
export interface SignUpData {
  name: string;
  email: string;
  password: string;
  studentId?: string;
  requestedRole?: 'officer' | 'admin';
}
