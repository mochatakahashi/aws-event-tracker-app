import type { Session, Stamp, NewStampInput } from '../types/session';
import { seedSessions, seedStamps } from './seedData';

const SESSIONS_KEY = 'aws-event-tracker.sessions.v4';
const STAMPS_KEY = 'aws-event-tracker.stamps.v4';

/** Simulated network latency (ms). */
const LATENCY = 100;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY));
}

function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? (JSON.parse(raw) as Session[]) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: Session[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

function loadStamps(): Stamp[] {
  try {
    const raw = localStorage.getItem(STAMPS_KEY);
    return raw ? (JSON.parse(raw) as Stamp[]) : [];
  } catch {
    return [];
  }
}

function saveStamps(stamps: Stamp[]) {
  localStorage.setItem(STAMPS_KEY, JSON.stringify(stamps));
}

function ensureSeeded() {
  if (loadSessions().length === 0) {
    saveSessions(seedSessions);
  }
  if (loadStamps().length === 0) {
    saveStamps(seedStamps);
  }
}

// ─── Session CRUD ─────────────────────────────────────────────────────────────

export async function getSessions(): Promise<Session[]> {
  ensureSeeded();
  return delay(loadSessions());
}

export async function getSessionsByEvent(eventId: string): Promise<Session[]> {
  ensureSeeded();
  const all = loadSessions();
  return delay(all.filter((s) => s.eventId === eventId));
}

export async function getSessionById(id: string): Promise<Session | undefined> {
  ensureSeeded();
  const all = loadSessions();
  return delay(all.find((s) => s.id === id));
}

// ─── Stamp CRUD ───────────────────────────────────────────────────────────────

export async function getStamps(): Promise<Stamp[]> {
  ensureSeeded();
  return delay(loadStamps());
}

export async function getStampsByAttendee(attendeeId: string): Promise<Stamp[]> {
  ensureSeeded();
  const all = loadStamps();
  return delay(all.filter((s) => s.attendeeId === attendeeId));
}

export async function getStampsBySession(sessionId: string): Promise<Stamp[]> {
  ensureSeeded();
  const all = loadStamps();
  return delay(all.filter((s) => s.sessionId === sessionId));
}

export async function createStamp(input: NewStampInput): Promise<Stamp> {
  ensureSeeded();
  const stamps = loadStamps();
  const stamp: Stamp = {
    ...input,
    id: `stp-${Date.now()}`,
  };
  stamps.push(stamp);
  saveStamps(stamps);
  return delay(stamp);
}

export async function approveStamp(stampId: string, officerId: string): Promise<Stamp> {
  ensureSeeded();
  const stamps = loadStamps();
  const idx = stamps.findIndex((s) => s.id === stampId);
  if (idx === -1) throw new Error('Stamp not found');
  stamps[idx] = {
    ...stamps[idx],
    status: 'approved',
    approvedBy: officerId,
    approvedAt: new Date().toISOString(),
  };
  saveStamps(stamps);
  return delay(stamps[idx]);
}

export async function declineStamp(stampId: string): Promise<boolean> {
  ensureSeeded();
  let stamps = loadStamps();
  const before = stamps.length;
  stamps = stamps.filter((s) => s.id !== stampId);
  saveStamps(stamps);
  return delay(stamps.length < before);
}
