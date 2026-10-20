import type { Award } from './attendee';

export type UserRole = 'admin' | 'officer' | 'attendee' | 'adviser';

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

/** Sub-committees: Marketing → Creatives, Media; Secretariat → Finance, Documents. */
export type Subcommittee = 'creatives' | 'media' | 'finance' | 'documents';

/** One school-year term as an officer, kept when a batch is archived. */
export interface OfficerTerm {
  /** e.g. "2025–2026" */
  schoolYear: string;
  officerPosition?: OfficerPosition | null;
  committee?: Committee | null;
  archivedAt: string;
}

/** Social links that a user can add to their profile. */
export interface SocialLinks {
  linkedIn?: string;
  github?: string;
  twitterX?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  /** Any other links, with the name the person chose (e.g. "Portfolio", "Behance"). */
  custom?: { label: string; url: string }[];
}

/** Authenticated user (no sensitive fields). */
export interface User {
  /** Login name: the email for new accounts, `awsapc.admin` for the built-in admin. */
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
  /** Student ID for APC students and officers (format 2026-140242). */
  studentId?: string;
  /** An admin asked them to fix these profile details (cleared as they save them). */
  fixRequest?: FixRequest;
  memberType?: MemberType;
  /** School / company / organization for outside attendees. */
  organization?: string;
  officerPosition?: OfficerPosition | null;
  /** Committee for directors, assistant directors and associates. */
  committee?: Committee | null;
  /** Sub-committee within Marketing or Secretariat. */
  subcommittee?: Subcommittee | null;
  /** What the person picked when the account was created (kept for admins). */
  signupType?: AccountType;
  /** Person id of the admin who created the account (admin-created accounts only). */
  createdBy?: string;
  /** Admin-created accounts start with a temporary password that must be changed. */
  mustChangePassword?: boolean;
  /** Person ids this person added on the Connect page. */
  /** AWS SBG-APC connections (both people approved). */
  connections?: string[];
  /** People who asked to connect with you (waiting for your answer). */
  connectionRequests?: string[];
  /** People you asked to connect with (waiting for them). */
  sentConnectionRequests?: string[];
  /** Event ids saved with the bookmark icon. */
  savedEventIds?: string[];
  /** When they last signed in, and how many times (admins see this). */
  lastLoginAt?: string;
  loginCount?: number;
  /** Set on the sign-in response only: this is their very first sign-in (offer the app tour). */
  firstSignIn?: boolean;
  /** Finished or skipped the first-time app tour. */
  tutorialSeen?: boolean;
  /**
   * Co-organizer staff: the partner org (not AWS SBG-APC) this person works for at
   * co-organized events. Set by an admin; lets the account be put on an event's
   * staff list for check-in / stamps only - no officer features.
   */
  partnerOrg?: string | null;
  /** Badges an admin awarded (set through the admin-only award action). */
  awards?: Award[];
  /** Past officer terms (archived batches). */
  officerHistory?: OfficerTerm[];
  /** Optional reason given by the admin when declining a sign-up. */
  rejectionReason?: string | null;
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
  subcommittee?: Subcommittee;
}

/** Account an admin creates directly (approved, with a temporary password). */
export interface AdminCreateAccount extends SignUpData {
  role: UserRole;
  /** Co-organizer staff: the partner org they work for (attendee accounts only). */
  partnerOrg?: string;
}

/** Fields a user (or an admin) can change on a profile. */
export type ProfileChanges = Partial<
  Pick<
    User,
    | 'avatarUrl'
    | 'bio'
    | 'socials'
    | 'personalEmail'
    | 'officerPosition'
    | 'committee'
    | 'subcommittee'
    | 'savedEventIds'
    | 'tutorialSeen'
    | 'firstName'
    | 'middleInitial'
    | 'lastName'
    | 'organization'
    | 'studentId'
  >
>;

/** Fields only an admin can change. */
export type AdminUserChanges = ProfileChanges &
  Partial<Pick<User, 'role' | 'status' | 'requestedRole' | 'officerHistory' | 'rejectionReason' | 'partnerOrg' | 'email'>>;

/** Profile details an admin can ask someone to fix. */
export type FixField = 'name' | 'studentId' | 'organization' | 'personalEmail' | 'photo' | 'other';

export interface FixRequest {
  fields: FixField[];
  note?: string;
  /** When and which admin asked. */
  at: string;
  by: string;
}
