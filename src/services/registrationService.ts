import type { Person, Registration, RsvpStatus } from '../types/attendee';
import type { User } from '../types/auth';
import { seedPeople, seedRegistrations } from './seedData';
import { getUsers } from './authService';
import { apiJson, delay, generateId, isRemoteAvailable, localCollection } from './apiClient';

/**
 * People directory + event registrations.
 *
 * People come from approved accounts (see authService). Registrations are
 * stored in DynamoDB through `/api/registrations` when deployed, and in
 * localStorage otherwise, so every login sees the same list.
 */

const API = '/api/registrations';

const local = localCollection<Registration>('aws-event-tracker.registrations.v1', () =>
  seedRegistrations.map((r) => ({ ...r })),
);

function toPerson(u: User): Person {
  const seed = seedPeople.find((p) => p.id === u.personId);
  return {
    ...(seed || {}),
    id: u.personId,
    name: u.name,
    email: u.email || seed?.email || u.username,
    studentId: u.studentId ?? seed?.studentId,
    avatarUrl: u.avatarUrl ?? seed?.avatarUrl,
    bio: u.bio ?? seed?.bio,
    socials: u.socials ?? seed?.socials,
    role: u.role,
    memberType: u.memberType,
    organization: u.organization,
    officerPosition: u.officerPosition,
    committee: u.committee,
    subcommittee: u.subcommittee,
    awards: u.awards,
  };
}

/** All people in the directory (approved accounts). */
export async function getPeople(): Promise<Person[]> {
  const users = await getUsers();
  return users.filter((u) => !u.status || u.status === 'approved').map(toPerson);
}

/** A single person by id, or null. */
export async function getPerson(id: string): Promise<Person | null> {
  return (await getPeople()).find((p) => p.id === id) ?? null;
}

/** Multiple people by id. */
export async function getPeopleByIds(ids: string[]): Promise<Person[]> {
  const set = new Set(ids);
  return (await getPeople()).filter((p) => set.has(p.id));
}

/** Every registration (admin monitoring). */
export async function getAllRegistrations(): Promise<Registration[]> {
  if (await isRemoteAvailable(API)) return apiJson<Registration[]>(API);
  return delay(local.load());
}

/** Registrations for a given event. */
export async function getRegistrationsByEvent(eventId: string): Promise<Registration[]> {
  if (await isRemoteAvailable(API)) {
    return apiJson<Registration[]>(`${API}?eventId=${encodeURIComponent(eventId)}`);
  }
  return delay(local.load().filter((r) => r.eventId === eventId));
}

/** Registrations for a given person (their "tickets"). */
export async function getRegistrationsByPerson(personId: string): Promise<Registration[]> {
  if (await isRemoteAvailable(API)) {
    return apiJson<Registration[]>(`${API}?personId=${encodeURIComponent(personId)}`);
  }
  return delay(local.load().filter((r) => r.personId === personId));
}

/** The registration linking a person to an event, if any. */
export async function findRegistration(eventId: string, personId: string): Promise<Registration | null> {
  const regs = await getRegistrationsByPerson(personId);
  return regs.find((r) => r.eventId === eventId) ?? null;
}

/**
 * Register a person for an event (or update their RSVP if already registered).
 */
export async function registerForEvent(
  eventId: string,
  personId: string,
  rsvp: RsvpStatus = 'going',
): Promise<Registration> {
  if (await isRemoteAvailable(API)) {
    return apiJson<Registration>(API, {
      method: 'POST',
      body: JSON.stringify({ eventId, personId, rsvp }),
    });
  }
  const regs = local.load();
  const existing = regs.find((r) => r.eventId === eventId && r.personId === personId);
  if (existing) {
    existing.rsvp = rsvp;
    local.save(regs);
    return delay({ ...existing });
  }
  const created: Registration = {
    id: generateId('reg'),
    eventId,
    personId,
    rsvp,
    checkedIn: false,
    registeredAt: new Date().toISOString(),
  };
  local.save([...regs, created]);
  return delay({ ...created });
}

/** Cancel a person's registration for an event. Returns true if removed. */
export async function cancelRegistration(eventId: string, personId: string): Promise<boolean> {
  if (await isRemoteAvailable(API)) {
    const res = await apiJson<{ removed: boolean }>(
      `${API}?eventId=${encodeURIComponent(eventId)}&personId=${encodeURIComponent(personId)}`,
      { method: 'DELETE' },
    );
    return res.removed;
  }
  const regs = local.load();
  const kept = regs.filter((r) => !(r.eventId === eventId && r.personId === personId));
  local.save(kept);
  return delay(kept.length < regs.length);
}

async function updateRegistration(
  registrationId: string,
  change: (reg: Registration) => Partial<Registration>,
): Promise<Registration> {
  if (await isRemoteAvailable(API)) {
    const current = await apiJson<Registration>(`${API}?id=${encodeURIComponent(registrationId)}`);
    return apiJson<Registration>(`${API}?id=${encodeURIComponent(registrationId)}`, {
      method: 'PUT',
      body: JSON.stringify(change(current)),
    });
  }
  const regs = local.load();
  const reg = regs.find((r) => r.id === registrationId);
  if (!reg) throw new Error(`Registration not found: ${registrationId}`);
  Object.assign(reg, change(reg));
  local.save(regs);
  return delay({ ...reg });
}

/** Update the RSVP of an existing registration by id; rejects if unknown. */
export function setRsvp(registrationId: string, rsvp: RsvpStatus): Promise<Registration> {
  return updateRegistration(registrationId, () => ({ rsvp }));
}

/** Save which sessions the attendee plans to attend (their own registration only). */
export async function setSessionPicks(registrationId: string, personId: string, sessionIds: string[]): Promise<Registration> {
  if (await isRemoteAvailable(API)) {
    return apiJson<Registration>(`${API}?id=${encodeURIComponent(registrationId)}`, {
      method: 'PUT',
      body: JSON.stringify({ personId, sessionIds }),
    });
  }
  const regs = local.load();
  const reg = regs.find((r) => r.id === registrationId);
  if (!reg) throw new Error(`Registration not found: ${registrationId}`);
  if (reg.personId !== personId) throw new Error('You can only choose sessions on your own registration.');
  reg.sessionIds = [...new Set(sessionIds)];
  local.save(regs);
  return delay({ ...reg });
}

/** One registration by id, or null. */
export async function getRegistration(registrationId: string): Promise<Registration | null> {
  if (await isRemoteAvailable(API)) {
    try {
      return await apiJson<Registration>(`${API}?id=${encodeURIComponent(registrationId)}`);
    } catch {
      return null;
    }
  }
  return delay(local.load().find((r) => r.id === registrationId) ?? null);
}

export interface CheckInResult {
  registration: Registration;
  alreadyCheckedIn: boolean;
}

function localCertificateId(): string {
  return `CERT-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

/**
 * Check an attendee in (officers / admins). The server also issues the
 * certificate of participation and stores the PDF in S3.
 */
export async function checkIn(registrationId: string, actorId: string): Promise<CheckInResult> {
  if (await isRemoteAvailable(API)) {
    return apiJson<CheckInResult>(`${API}?action=checkin`, {
      method: 'POST',
      body: JSON.stringify({ id: registrationId, actorId }),
    });
  }
  const regs = local.load();
  const reg = regs.find((r) => r.id === registrationId);
  if (!reg) throw new Error('This pass was not found. The registration may have been cancelled.');
  if (reg.checkedIn) return delay({ registration: { ...reg }, alreadyCheckedIn: true });
  const now = new Date().toISOString();
  Object.assign(reg, {
    checkedIn: true,
    checkedInAt: now,
    checkedInBy: actorId,
    rsvp: reg.rsvp === 'declined' ? 'going' : reg.rsvp,
    certificateId: reg.certificateId || localCertificateId(),
    certificateIssuedAt: reg.certificateIssuedAt || now,
  });
  local.save(regs);
  return delay({ registration: { ...reg }, alreadyCheckedIn: false });
}

/** Undo a check-in (admins). */
export async function undoCheckIn(registrationId: string, actorId: string): Promise<Registration> {
  if (await isRemoteAvailable(API)) {
    const res = await apiJson<{ registration: Registration }>(`${API}?action=checkout`, {
      method: 'POST',
      body: JSON.stringify({ id: registrationId, actorId }),
    });
    return res.registration;
  }
  return updateRegistration(registrationId, () => ({ checkedIn: false, checkedInAt: undefined, checkedInBy: undefined }));
}

/** Toggle check-in for a registration (admin-facing); rejects if unknown. */
export async function toggleCheckIn(registrationId: string, actorId = 'per-1'): Promise<Registration> {
  const current = await getRegistration(registrationId);
  if (!current) throw new Error(`Registration not found: ${registrationId}`);
  return current.checkedIn
    ? undoCheckIn(registrationId, actorId)
    : (await checkIn(registrationId, actorId)).registration;
}

/**
 * Link that opens the certificate PDF — inline to view, or `download` to save
 * it (deployed app only; null when running without the API).
 */
export async function certificateLink(registrationId: string, personId: string, download = false): Promise<string | null> {
  if (!(await isRemoteAvailable(API))) return null;
  return `${API}?action=certificate&id=${encodeURIComponent(registrationId)}&personId=${encodeURIComponent(personId)}${download ? '&download=1' : ''}`;
}

/** Public PDF link for a certificate code — anyone with the link can view or download it. */
export function publicCertificatePdf(certificateId: string, download = false): string {
  return `${API}?action=certificate&certificateId=${encodeURIComponent(certificateId)}${download ? '&download=1' : ''}`;
}

/** The shareable certificate page (shows it's genuine, with View / Download). */
export function certificateShareLink(certificateId: string): string {
  const base = typeof window === 'undefined' ? '' : `${window.location.origin}${window.location.pathname}`;
  return `${base}#/verify/${encodeURIComponent(certificateId)}`;
}

/** Certificates unlock after the event ends, only for people checked in at it. */
export function certificateState(
  registration: Pick<Registration, 'checkedIn'> | null | undefined,
  event: { startAt?: string; endAt?: string } | null | undefined,
  now = Date.now(),
): 'ready' | 'after-event' | 'needs-check-in' | 'none' {
  const end = event?.endAt || event?.startAt;
  const ended = Boolean(end) && now > new Date(end!).getTime();
  if (registration?.checkedIn) return ended ? 'ready' : 'after-event';
  return ended ? 'none' : 'needs-check-in';
}

/** Count of registrations for an event. */
export async function countRegistrations(eventId: string): Promise<number> {
  return (await getRegistrationsByEvent(eventId)).length;
}

/** Reset registrations to seed data (tests / dev only). */
export function __resetRegistrations(): void {
  local.reset();
}

export interface CertificateCheck {
  valid: boolean;
  status: 'valid' | 'not-yet' | 'revoked' | 'not-found' | 'invalid';
  certificateId: string;
  /** For not-yet: when the event ends and the certificate unlocks. */
  availableFrom?: string;
  name?: string;
  eventTitle?: string;
  eventDate?: string;
  venue?: string;
  issuedAt?: string;
}

/** Normalize what someone typed or scanned into a certificate ID (or ''). */
export function normalizeCertificateId(input: string): string {
  const raw = decodeURIComponent(String(input || '')).trim();
  const m = raw.toUpperCase().match(/CERT-\d{4}-[A-Z0-9]{4,16}/);
  return m ? m[0] : '';
}

/** Public check that a certificate ID is real (no sign-in needed). */
export async function verifyCertificate(input: string): Promise<CertificateCheck> {
  const certificateId = normalizeCertificateId(input);
  if (!certificateId) return { valid: false, status: 'invalid', certificateId: String(input || '').trim() };
  if (await isRemoteAvailable(API)) {
    const res = await fetch(`${API}?action=verify&certificateId=${encodeURIComponent(certificateId)}`);
    const data = (await res.json().catch(() => ({}))) as Partial<CertificateCheck>;
    if (res.status === 404 || res.status === 400) {
      return { valid: false, status: res.status === 404 ? 'not-found' : 'invalid', certificateId };
    }
    if (!res.ok) throw new Error('Could not check the certificate right now. Try again in a moment.');
    return data as CertificateCheck;
  }
  const reg = local.load().find((r) => r.certificateId?.toUpperCase() === certificateId);
  if (!reg) return delay({ valid: false, status: 'not-found', certificateId });
  const [users, { getEvents }] = await Promise.all([getUsers(), import('./eventService')]);
  const person = users.find((u) => u.personId === reg.personId);
  const event = (await getEvents()).find((e) => e.id === reg.eventId);
  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'long', day: 'numeric', year: 'numeric' }) : '';
  const start = fmt(event?.startAt);
  const end = fmt(event?.endAt);
  const state = certificateState(reg, event);
  const status = !reg.checkedIn ? 'revoked' : state === 'ready' ? 'valid' : 'not-yet';
  return {
    valid: status === 'valid',
    status,
    availableFrom: status === 'not-yet' ? event?.endAt : undefined,
    certificateId,
    name: person?.name ?? 'Participant',
    eventTitle: event?.title ?? 'AWS SBG-APC Event',
    eventDate: start === end || !end ? start : `${start} – ${end}`,
    venue: event?.venue ?? '',
    issuedAt: reg.certificateIssuedAt,
  };
}
