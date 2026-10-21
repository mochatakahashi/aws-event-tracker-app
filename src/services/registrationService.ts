import { imageSrc } from '../utils/imageUrl';
import { normalizeRsvp, type Person, type Registration, type RsvpStatus } from '../types/attendee';
import type { User } from '../types/auth';
import { seedPeople, seedRegistrations } from './seedData';
import { getUsers } from './authService';
import { apiJson, delay, generateId, isRemoteAvailable, localCollection } from './apiClient';
import type { EvalAnswers, EvalQuestion, EvaluationResponse, EventEvaluation } from '../types/evaluation';
import { checkAnswers, evaluationOpen, evaluationOpensAt, evaluationQuestions, evaluationRequired, stampProgress } from '../utils/evaluation';

/**
 * People directory + event registrations.
 *
 * People come from approved accounts (see authService). Registrations are
 * stored in DynamoDB through `/api/registrations` when deployed, and in
 * localStorage otherwise, so every login sees the same list.
 */

const API = '/api/registrations';

const rawLocal = localCollection<Registration>('aws-event-tracker.registrations.v1', () =>
  seedRegistrations.map((r) => ({ ...r })),
);
/** Registrations with the current status names (older ones said going / interested). */
const norm = (r: Registration): Registration => ({ ...r, rsvp: normalizeRsvp(r.rsvp) });
const normAll = (list: Registration[]) => list.map(norm);
const local = { load: () => normAll(rawLocal.load()), save: rawLocal.save, reset: rawLocal.reset };

function toPerson(u: User): Person {
  const seed = seedPeople.find((p) => p.id === u.personId);
  return {
    ...(seed || {}),
    id: u.personId,
    name: u.name,
    email: u.email || seed?.email || u.username,
    studentId: u.studentId ?? seed?.studentId,
    avatarUrl: imageSrc(u.avatarUrl ?? seed?.avatarUrl),
    bio: u.bio ?? seed?.bio,
    socials: u.socials ?? seed?.socials,
    role: u.role,
    memberType: u.memberType,
    organization: u.organization,
    officerPosition: u.officerPosition,
    committee: u.committee,
    subcommittee: u.subcommittee,
    awards: u.awards,
    connectionCount: u.connections?.length ?? 0,
    partnerOrg: u.partnerOrg ?? null,
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
  if (await isRemoteAvailable(API)) return normAll(await apiJson<Registration[]>(API));
  return delay(local.load());
}

/** Registrations for a given event. */
export async function getRegistrationsByEvent(eventId: string): Promise<Registration[]> {
  if (await isRemoteAvailable(API)) {
    return normAll(await apiJson<Registration[]>(`${API}?eventId=${encodeURIComponent(eventId)}`));
  }
  return delay(local.load().filter((r) => r.eventId === eventId));
}

/** Registrations for a given person (their "tickets"). */
export async function getRegistrationsByPerson(personId: string): Promise<Registration[]> {
  if (await isRemoteAvailable(API)) {
    return normAll(await apiJson<Registration[]>(`${API}?personId=${encodeURIComponent(personId)}`));
  }
  return delay(local.load().filter((r) => r.personId === personId));
}

/** The registration linking a person to an event, if any. */
export async function findRegistration(eventId: string, personId: string): Promise<Registration | null> {
  const regs = await getRegistrationsByPerson(personId);
  return regs.find((r) => r.eventId === eventId) ?? null;
}

/**
 * Register a person for an event. New registrations are *pending* until an
 * admin or the event's check-in team approves them.
 */
export async function registerForEvent(eventId: string, personId: string): Promise<Registration> {
  if (await isRemoteAvailable(API)) {
    return norm(
      await apiJson<Registration>(API, {
        method: 'POST',
        body: JSON.stringify({ eventId, personId }),
      }),
    );
  }
  const regs = local.load();
  const existing = regs.find((r) => r.eventId === eventId && r.personId === personId);
  if (existing) {
    if (existing.rsvp === 'declined') existing.rsvp = 'pending';
    local.save(regs);
    return delay({ ...existing });
  }
  const created: Registration = {
    id: generateId('reg'),
    eventId,
    personId,
    rsvp: 'pending',
    checkedIn: false,
    registeredAt: new Date().toISOString(),
  };
  local.save([...regs, created]);
  return delay({ ...created });
}

/** Admins / check-in team: approve, decline or reset registrations. */
export async function reviewRegistrations(ids: string[], rsvp: RsvpStatus, actorId: string): Promise<Registration[]> {
  if (await isRemoteAvailable(API)) {
    const res = await apiJson<{ updated: Registration[] }>(`${API}?action=review`, {
      method: 'POST',
      body: JSON.stringify({ actorId, ids, rsvp }),
    });
    return normAll(res.updated);
  }
  const regs = local.load();
  const out: Registration[] = [];
  for (const r of regs) {
    if (!ids.includes(r.id) || (r.checkedIn && rsvp !== 'approved')) continue;
    r.rsvp = rsvp;
    out.push({ ...r });
  }
  local.save(regs);
  return delay(out);
}

/** Cancel a person's registration for an event. Returns true if removed. */
export async function cancelRegistration(eventId: string, personId: string, actorId: string = personId): Promise<boolean> {
  if (await isRemoteAvailable(API)) {
    const res = await apiJson<{ removed: boolean }>(
      `${API}?eventId=${encodeURIComponent(eventId)}&personId=${encodeURIComponent(personId)}&actorId=${encodeURIComponent(actorId)}`,
      { method: 'DELETE' },
    );
    return res.removed;
  }
  const regs = local.load();
  if (regs.some((r) => r.eventId === eventId && r.personId === personId && r.checkedIn)) {
    throw new Error('You are already checked in, so this registration can no longer be cancelled.');
  }
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
    } catch (e) {
      // Only "not found" means the pass is gone; a bad connection is shown as an error, not as "cancelled"
      if (e instanceof Error && /not found/i.test(e.message)) return null;
      throw e;
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
export async function checkIn(registrationId: string, actorId: string, confirmDeclined = false): Promise<CheckInResult> {
  if (await isRemoteAvailable(API)) {
    return apiJson<CheckInResult>(`${API}?action=checkin`, {
      method: 'POST',
      body: JSON.stringify({ id: registrationId, actorId, confirmDeclined }),
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
    rsvp: 'approved',
    certificateId: reg.certificateId || localCertificateId(),
    certificateIssuedAt: reg.certificateIssuedAt || now,
  });
  local.save(regs);
  return delay({ registration: { ...reg }, alreadyCheckedIn: false });
}

/** Undo a check-in (admins). */
/** Undo a check-in. Stamps given at that event go back to "asked" (stamps need check-in); see `stampsTakenBack`. */
export async function undoCheckIn(registrationId: string, actorId: string): Promise<Registration & { stampsTakenBack?: number }> {
  if (await isRemoteAvailable(API)) {
    const res = await apiJson<{ registration: Registration; stampsTakenBack?: number }>(`${API}?action=checkout`, {
      method: 'POST',
      body: JSON.stringify({ id: registrationId, actorId }),
    });
    return { ...res.registration, stampsTakenBack: res.stampsTakenBack };
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
 * Link that opens the certificate PDF - inline to view, or `download` to save
 * it (deployed app only; null when running without the API).
 */
export async function certificateLink(registrationId: string, personId: string, download = false): Promise<string | null> {
  if (!(await isRemoteAvailable(API))) return null;
  return `${API}?action=certificate&id=${encodeURIComponent(registrationId)}&personId=${encodeURIComponent(personId)}${download ? '&download=1' : ''}`;
}

/** Public PDF link for a certificate code - anyone with the link can view or download it. */
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
  registration: Pick<Registration, 'checkedIn' | 'evaluatedAt'> | null | undefined,
  event: { startAt?: string; endAt?: string; speakerIds?: string[]; evaluation?: EventEvaluation } | null | undefined,
  now = Date.now(),
  /** The event's stamps for this person (events with stamp sessions need all of them). */
  stamps?: { required: number; done: number } | null,
): 'ready' | 'after-event' | 'needs-stamps' | 'needs-evaluation' | 'needs-check-in' | 'none' {
  const end = event?.endAt || event?.startAt;
  const ended = Boolean(end) && now > new Date(end!).getTime();
  if (registration?.checkedIn) {
    if (!ended) return 'after-event';
    if (stamps && stamps.done < stamps.required) return 'needs-stamps';
    return evaluationRequired(event) && !registration.evaluatedAt ? 'needs-evaluation' : 'ready';
  }
  return ended ? 'none' : 'needs-check-in';
}

// ─── Evaluation ───────────────────────────────────────────────────────────────

export interface EvaluationStatus {
  questions: EvalQuestion[];
  /** Whether the certificate needs it (false for older events or when the admin turned it off). */
  required: boolean;
  opensAt?: string;
  open: boolean;
  checkedIn: boolean;
  response: EvaluationResponse | null;
  stamps?: { required: number; done: number; missing: string[] };
}

export interface EvaluationSummary {
  questions: EvalQuestion[];
  required: boolean;
  opensAt?: string;
  checkedIn: number;
  responses: EvaluationResponse[];
  pending: { personId: string; name: string }[];
}

const localEvals = localCollection<EvaluationResponse>('aws-event-tracker.evaluations.v1', () => []);

async function localEvent(eventId: string) {
  const { getEvent } = await import('./eventService');
  const ev = await getEvent(eventId);
  if (!ev) throw new Error('Event not found');
  return ev;
}

/** The evaluation form for this person at this event, and whether they answered it. */
export async function getEvaluation(eventId: string, personId: string): Promise<EvaluationStatus> {
  if (await isRemoteAvailable(API)) {
    return apiJson<EvaluationStatus>(`${API}?action=evaluation&eventId=${encodeURIComponent(eventId)}&personId=${encodeURIComponent(personId)}`);
  }
  const ev = await localEvent(eventId);
  const reg = local.load().find((r) => r.eventId === eventId && r.personId === personId);
  const opens = evaluationOpensAt(ev);
  return delay({
    questions: evaluationQuestions(ev),
    required: evaluationRequired(ev),
    opensAt: opens ? new Date(opens).toISOString() : undefined,
    open: evaluationOpen(ev),
    checkedIn: Boolean(reg?.checkedIn),
    response: (reg && localEvals.load().find((x) => x.registrationId === reg.id)) || null,
  });
}

/** Send the answers; unlocks the certificate. Returns the updated registration. */
export async function submitEvaluation(eventId: string, personId: string, answers: EvalAnswers): Promise<Registration> {
  if (await isRemoteAvailable(API)) {
    const res = await apiJson<{ registration: Registration }>(`${API}?action=evaluate`, {
      method: 'POST',
      body: JSON.stringify({ eventId, personId, answers }),
    });
    return res.registration;
  }
  const ev = await localEvent(eventId);
  const regs = local.load();
  const reg = regs.find((r) => r.eventId === eventId && r.personId === personId);
  if (!reg) throw new Error("You're not registered for this event.");
  if (!reg.checkedIn) throw new Error('Only people checked in at the event can answer its evaluation.');
  if (!evaluationOpen(ev)) throw new Error('The evaluation opens 30 minutes before the event ends.');
  if (reg.evaluatedAt) throw new Error('You already answered this evaluation.');
  const problem = checkAnswers(evaluationQuestions(ev), answers);
  if (problem) throw new Error(problem);
  const now = new Date().toISOString();
  localEvals.save([
    ...localEvals.load(),
    { id: `evl-${reg.id}`, eventId, personId, registrationId: reg.id, answers, submittedAt: now },
  ]);
  reg.evaluatedAt = now;
  local.save(regs);
  return delay({ ...reg });
}

/** Everyone's answers for an event (admins, the adviser, the event's officers). */
export async function getEvaluationSummary(eventId: string, actorId: string): Promise<EvaluationSummary> {
  if (await isRemoteAvailable(API)) {
    return apiJson<EvaluationSummary>(`${API}?action=evaluations&eventId=${encodeURIComponent(eventId)}&actorId=${encodeURIComponent(actorId)}`);
  }
  const ev = await localEvent(eventId);
  const regs = local.load().filter((r) => r.eventId === eventId);
  const users = await getUsers();
  const name = (id: string) => users.find((u) => u.personId === id)?.name || '';
  const opens = evaluationOpensAt(ev);
  return delay({
    questions: evaluationQuestions(ev),
    required: evaluationRequired(ev),
    opensAt: opens ? new Date(opens).toISOString() : undefined,
    checkedIn: regs.filter((r) => r.checkedIn).length,
    responses: localEvals
      .load()
      .filter((x) => x.eventId === eventId)
      .map((x) => ({ ...x, personName: name(x.personId) })),
    pending: regs.filter((r) => r.checkedIn && !r.evaluatedAt).map((r) => ({ personId: r.personId, name: name(r.personId) })),
  });
}

const SWEEP_KEY = 'aws-event-tracker.after-event-sweep';
/**
 * Ask the server to send the after-event notices now (evaluation reminders /
 * certificate ready) instead of waiting for the daily job. At most every 10 minutes per tab.
 */
export async function nudgeAfterEventNotices(): Promise<void> {
  try {
    const last = Number(sessionStorage.getItem(SWEEP_KEY) || 0);
    if (Date.now() - last < 10 * 60 * 1000) return;
    sessionStorage.setItem(SWEEP_KEY, String(Date.now()));
  } catch {
    /* storage blocked: still try once */
  }
  if (!(await isRemoteAvailable(API))) return;
  await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'after-event' }) }).catch(
    () => undefined,
  );
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
  const { getSessionsByEvent, getStampsByAttendee } = await import('./sessionService');
  const progress = event
    ? stampProgress(event, await getSessionsByEvent(event.id).catch(() => []), await getStampsByAttendee(reg.personId).catch(() => []))
    : null;
  const state = certificateState(reg, event, Date.now(), progress);
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

/**
 * The "you're checked in" notification. When the event has stamp sessions it
 * lists them: the certificate needs all of them (and the evaluation).
 */
export async function notifyCheckedIn(
  personId: string,
  event: { id: string; title: string; startAt?: string; endAt?: string; speakerIds?: string[]; evaluation?: EventEvaluation } | null | undefined,
  eventId: string,
): Promise<void> {
  const [{ getSessionsByEvent }, { notifyInApp }] = await Promise.all([import('./sessionService'), import('./notificationService')]);
  const sessions = event ? await getSessionsByEvent(event.id).catch(() => []) : [];
  const stamps = stampProgress(event, sessions, []);
  const evalNote = evaluationRequired(event) ? ' and answer the evaluation (it opens 30 minutes before the end)' : '';
  const message = stamps.required
    ? `Welcome! To get your certificate, collect all ${stamps.required} stamp${stamps.required === 1 ? '' : 's'}: ${stamps.missing.join(', ')}${evalNote}.`
    : `Welcome! Your certificate unlocks on your event pass after the event ends${evalNote ? `, once you${evalNote}` : ''}.`;
  await notifyInApp({
    personIds: [personId],
    kind: 'checked-in',
    title: `You're checked in to ${event?.title ?? 'the event'}`,
    message: message.slice(0, 600),
    link: `/pass?event=${eventId}`,
  });
}
