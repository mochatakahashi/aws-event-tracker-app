export type UserRole = 'admin' | 'officer' | 'attendee';

/** Every new account starts as `pending` until an admin approves it. */
export type AccountStatus = 'pending' | 'approved' | 'rejected';

/** Whether the person is from Asia Pacific College or from outside. */
export type MemberType = 'apc' | 'outside';

/** What the person picked on the sign-up form. */
export type AccountType = 'apc-student' | 'outside' | 'officer';

/** Officer hierarchy, highest first. */
export type OfficerPosition =
  | 'president'
  | 'vp-internal'
  | 'vp-external'
  | 'director'
  | 'assistant-director'
  | 'associate';

export type Committee = 'secretariat' | 'operations' | 'marketing' | 'technicals' | 'relations';

/** Social links that a user can add to their profile. */
export interface SocialLinks {
  linkedIn?: string;
  github?: string;
  twitterX?: string;
  website?: string;
}

/** Authenticated user (no sensitive fields). */
export interface User {
  /** Login name. New accounts use their email; demo accounts keep a short username. */
  username: string;
  /** Display name, "First M. Last". */
  name: string;
  firstName?: string;
  middleInitial?: string;
  lastName?: string;
  /** Main email (APC email for APC students and officers). */
  email?: string;
  /** Optional personal email (officers). */
  personalEmail?: string;
  role: UserRole;
  /** Id of the matching person in the attendee directory. */
  personId: string;
  /** Profile avatar URL (optional). */
  avatarUrl?: string;
  /** Student ID for APC students and officers. */
  studentId?: string;
  memberType?: MemberType;
  /** School / company / organization for outside attendees. */
  organization?: string;
  officerPosition?: OfficerPosition;
  /** Committee for directors, assistant directors and associates. */
  committee?: Committee;
  /** Approval status of the account. Missing means approved (older records). */
  status?: AccountStatus;
  /** Role requested during sign up, granted when an admin approves the account. */
  requestedRole?: 'officer' | 'admin' | 'attendee' | null;
  bio?: string;
  socials?: SocialLinks;
  createdAt?: string;
  approvedAt?: string;
  approvedBy?: string;
}

/** Credentials submitted from the login form. `username` may be an email. */
export interface Credentials {
  username: string;
  password: string;
}

/** Data submitted from the signup form. */
export interface SignUpData {
  accountType: AccountType;
  firstName: string;
  middleInitial?: string;
  lastName: string;
  email: string;
  personalEmail?: string;
  password: string;
  studentId?: string;
  organization?: string;
  officerPosition?: OfficerPosition;
  committee?: Committee;
}

/** Fields a user (or an admin) can change on a profile. */
export type ProfileChanges = Partial<
  Pick<User, 'avatarUrl' | 'bio' | 'socials' | 'personalEmail' | 'officerPosition' | 'committee'>
>;

/** Fields only an admin can change. */
export type AdminUserChanges = ProfileChanges &
  Partial<Pick<User, 'role' | 'status' | 'requestedRole'>>;
