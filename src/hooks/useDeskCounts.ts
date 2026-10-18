import { useEffect, useState } from 'react';
import { getEvents } from '../services/eventService';
import { getSessions, getStamps } from '../services/sessionService';
import { canDo, mayWorkEvents, staffEvents, type StaffActor } from '../utils/eventStaff';

const POLL_MS = 60_000;

/** Fired after the Event Desk changes something, so the menu badge updates right away. */
export const DESK_CHANGED = 'aws-event-tracker:desk-changed';
export function deskChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(DESK_CHANGED));
}

interface DeskCounts {
  hasDesk: boolean;
  /** Stamp requests waiting at events the user can approve (same events the Event Desk lists). */
  pendingStamps: number;
  /** The same, per event id. */
  pendingByEvent: Record<string, number>;
}

/**
 * For the Event Desk link: whether the user works any event (admins always),
 * and how many stamp requests are waiting at events where they can approve.
 * Counts only what the Event Desk can show (not cancelled events, sessions
 * that still exist), so the badge never points at requests that aren't there.
 */
export function useDeskCounts(user: StaffActor | null | undefined): DeskCounts {
  const [state, setState] = useState<DeskCounts>({ hasDesk: user?.role === 'admin', pendingStamps: 0, pendingByEvent: {} });
  const role = user?.role;
  const personId = user?.personId;
  const partnerOrg = user?.partnerOrg;

  useEffect(() => {
    const actor: StaffActor = { role, personId, partnerOrg };
    if (!mayWorkEvents(actor)) {
      setState({ hasDesk: false, pendingStamps: 0, pendingByEvent: {} });
      return;
    }
    let alive = true;
    const refresh = async () => {
      try {
        const [events, sessions, stamps] = await Promise.all([getEvents(), getSessions(), getStamps()]);
        const open = events.filter((e) => e.status !== 'cancelled');
        const mine = staffEvents(actor, open);
        const stampEvents = new Set(open.filter((e) => canDo(actor, e, 'stamps')).map((e) => e.id));
        const sessionEvent = new Map(sessions.map((s) => [s.id, s.eventId]));
        const byEvent: Record<string, number> = {};
        for (const s of stamps) {
          if (s.status !== 'pending') continue;
          const ev = sessionEvent.get(s.sessionId);
          if (!ev || !stampEvents.has(ev)) continue;
          byEvent[ev] = (byEvent[ev] ?? 0) + 1;
        }
        const total = Object.values(byEvent).reduce((a, b) => a + b, 0);
        if (alive) setState({ hasDesk: role === 'admin' || mine.length > 0, pendingStamps: total, pendingByEvent: byEvent });
      } catch {
        /* keep the last numbers */
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), POLL_MS);
    window.addEventListener('focus', refresh);
    window.addEventListener(DESK_CHANGED, refresh);
    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      window.removeEventListener(DESK_CHANGED, refresh);
    };
  }, [role, personId, partnerOrg]);

  return state;
}
