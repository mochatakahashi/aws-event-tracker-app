/**
 * Someone opened an event's registration link but had to sign up first (new
 * accounts wait for approval). Remember the event so their first sign-in
 * takes them straight to it.
 */
const KEY = 'aws-event-tracker.register-intent';
const MAX_AGE = 30 * 24 * 3600 * 1000;

export function rememberRegisterIntent(eventId: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ eventId, at: Date.now() }));
  } catch {
    /* storage blocked */
  }
}

/** The remembered event id (and forgets it), or null. */
export function takeRegisterIntent(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    localStorage.removeItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { eventId?: string; at?: number };
    return v.eventId && Date.now() - (v.at || 0) < MAX_AGE ? v.eventId : null;
  } catch {
    return null;
  }
}
