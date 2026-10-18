import type {
  AccountType,
  Committee,
  MemberType,
  Subcommittee,
  OfficerPosition,
  SignUpData,
  User,
} from '../types/auth';

/** Officer positions, highest in the hierarchy first. */
export const OFFICER_POSITIONS: OfficerPosition[] = [
  'president',
  'vp-internal',
  'vp-external',
  'director',
  'assistant-director',
  'associate',
];

export const POSITION_LABELS: Record<OfficerPosition, string> = {
  president: 'President',
  'vp-internal': 'VP Internal',
  'vp-external': 'VP External',
  director: 'Director',
  'assistant-director': 'Assistant Director',
  associate: 'Associate',
};

export const COMMITTEES: Committee[] = [
  'secretariat',
  'operations',
  'marketing',
  'technicals',
  'relations',
];

export const COMMITTEE_LABELS: Record<Committee, string> = {
  secretariat: 'Secretariat',
  operations: 'Operations',
  marketing: 'Marketing',
  technicals: 'Technicals',
  relations: 'Relations',
};

/** Committees that have sub-committees. */
export const SUBCOMMITTEES: Partial<Record<Committee, Subcommittee[]>> = {
  marketing: ['creatives', 'media'],
  secretariat: ['finance', 'documents'],
};

export const SUBCOMMITTEE_LABELS: Record<Subcommittee, string> = {
  creatives: 'Creatives',
  media: 'Media',
  finance: 'Finance',
  documents: 'Documents',
};

export function subcommitteesOf(committee?: Committee | null): Subcommittee[] {
  return (committee && SUBCOMMITTEES[committee]) || [];
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  'apc-student': 'APC Student',
  outside: 'Outside Attendee',
  officer: 'Officer',
};

/** Directors, assistant directors and associates belong to a committee. */
export function positionNeedsCommittee(position?: OfficerPosition | null): boolean {
  return position === 'director' || position === 'assistant-director' || position === 'associate';
}

/** "Director — Marketing", "VP Internal", or "Officer" when no position is set. */
export function officerTitle(person: {
  officerPosition?: OfficerPosition | null;
  committee?: Committee | null;
  subcommittee?: Subcommittee | null;
}): string {
  if (!person.officerPosition) return 'Officer';
  const position = POSITION_LABELS[person.officerPosition];
  if (positionNeedsCommittee(person.officerPosition) && person.committee) {
    const sub = person.subcommittee && subcommitteesOf(person.committee).includes(person.subcommittee)
      ? ` (${SUBCOMMITTEE_LABELS[person.subcommittee]})`
      : '';
    return `${position} — ${COMMITTEE_LABELS[person.committee]}${sub}`;
  }
  return position;
}

/** Password rules for every account. */
export const PASSWORD_RULES: { id: string; label: string; test: (pw: string) => boolean }[] = [
  { id: 'length', label: 'At least 6 characters', test: (pw) => pw.length >= 6 },
  { id: 'upper', label: 'One capital letter (A–Z)', test: (pw) => /[A-Z]/.test(pw) },
  { id: 'lower', label: 'One small letter (a–z)', test: (pw) => /[a-z]/.test(pw) },
  { id: 'number', label: 'One number (0–9)', test: (pw) => /[0-9]/.test(pw) },
  { id: 'symbol', label: 'One special symbol (e.g. ! @ # $ %)', test: (pw) => /[^A-Za-z0-9\s]/.test(pw) },
];

/** Error message for a password that breaks the rules, or null when it's fine. */
export function passwordError(pw: string): string | null {
  const missing = PASSWORD_RULES.filter((r) => !r.test(pw)).map((r) => r.label.toLowerCase());
  return missing.length ? `Password needs: ${missing.join(', ')}.` : null;
}

/** A random temporary password that meets the rules (for admin-created accounts). */
export function generateTempPassword(): string {
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)];
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*?';
  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  const all = upper + lower + digits;
  while (chars.length < 10) chars.push(pick(all));
  return chars.sort(() => Math.random() - 0.5).join('');
}

/**
 * Sort key for the officer hierarchy: President, VP Internal, VP External,
 * Directors, Assistant Directors, Associates (each by committee order), then
 * officers without a position.
 */
export function officerRank(person: { officerPosition?: OfficerPosition | null; committee?: Committee | null }): number {
  const pos = person.officerPosition ? OFFICER_POSITIONS.indexOf(person.officerPosition) : OFFICER_POSITIONS.length;
  const com = person.committee ? COMMITTEES.indexOf(person.committee) : COMMITTEES.length;
  return pos * 10 + com;
}

export function compareOfficers<T extends { officerPosition?: OfficerPosition | null; committee?: Committee | null; name: string }>(
  a: T,
  b: T,
): number {
  return officerRank(a) - officerRank(b) || a.name.localeCompare(b.name);
}

/** "2025–2026" for a school year that starts in June. */
export function currentSchoolYear(now = new Date()): string {
  const start = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}–${start + 1}`;
}

/** "Juan D. Dela Cruz" (middle initial optional). */
export function formatFullName(firstName: string, middleInitial: string | undefined, lastName: string): string {
  const mi = (middleInitial || '').replace(/\./g, '').trim().toUpperCase();
  return [firstName.trim(), mi ? `${mi}.` : '', lastName.trim()].filter(Boolean).join(' ');
}

/** APC emails: @apc.edu.ph and @student.apc.edu.ph */
export function isApcEmail(email: string): boolean {
  return /^[^\s@]+@(student\.)?apc\.edu\.ph$/i.test(email.trim());
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** "APC Student", "Outside Attendee", "Officer" / "Admin". */
export function memberLabel(person: { role?: User['role']; memberType?: MemberType; requestedRole?: User['requestedRole'] }): string {
  if (person.role === 'admin') return 'Admin';
  if (person.role === 'officer' || person.requestedRole === 'officer') return 'Officer';
  return person.memberType === 'outside' ? 'Outside Attendee' : 'APC Student';
}

/** Student ID for APC people, organization for outsiders. */
export function affiliation(person: { memberType?: MemberType; studentId?: string; organization?: string }): string {
  if (person.memberType === 'outside') return person.organization || '—';
  return person.studentId || '—';
}

/**
 * Validate the sign-up form. Returns an error message, or null when valid.
 * The same rules are checked again by the server.
 */
export function validateSignUp(data: SignUpData, confirmPassword?: string): string | null {
  if (!data.firstName.trim() || !data.lastName.trim()) return 'Please enter your first and last name.';
  if (data.middleInitial && !/^[A-Za-z]{1,2}\.?$/.test(data.middleInitial.trim())) {
    return 'Middle initial should be one or two letters, e.g. "D".';
  }
  if (!data.email.trim()) return 'Please enter your email address.';
  if (!isValidEmail(data.email)) return 'Please enter a valid email address.';
  if (data.accountType !== 'outside' && !isApcEmail(data.email)) {
    return 'Please use your APC email (@apc.edu.ph or @student.apc.edu.ph).';
  }
  if (data.personalEmail && !isValidEmail(data.personalEmail)) return 'Please enter a valid personal email.';
  if (data.accountType !== 'outside' && !data.studentId?.trim()) return 'Please enter your APC student ID.';
  if (data.accountType === 'outside' && !data.organization?.trim()) {
    return 'Please enter your school, company or organization.';
  }
  if (data.accountType === 'officer') {
    if (!data.officerPosition) return 'Please select your officer position.';
    if (positionNeedsCommittee(data.officerPosition) && !data.committee) return 'Please select your committee.';
  }
  if (data.committee && data.subcommittee && !subcommitteesOf(data.committee).includes(data.subcommittee)) {
    return 'Please pick a sub-committee that belongs to your committee.';
  }
  const pwError = passwordError(data.password);
  if (pwError) return pwError;
  if (confirmPassword !== undefined && data.password !== confirmPassword) return 'Passwords do not match.';
  return null;
}
