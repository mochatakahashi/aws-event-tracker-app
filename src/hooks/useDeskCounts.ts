import { useEffect, useState } from 'react';
import { getEvents } from '../services/eventService';
import { getSessions, getStamps } from '../services/sessionService';
import { canDo, staffEvents } from '../utils/eventStaff';

const POLL_MS = 60_000;

/**
 * For the Event Desk link: whether the user works any event (admins always),
 * and how many stamp requests are waiting at events where they can approve.
 */
export function useDeskCounts(user: { role?: string; personId?: string } | null | undefined) {
  const [state, setState] = useState({ hasDesk: user?.role === 'admin', pendingStamps: 0 });
  const role = user?.role;
  const personId = user?.personId;

  useEffect(() => {
    if (role !== 'admin' && role !== 'officer') {
      setState({ hasDesk: false, pendingStamps: 0 });
      return;
    }
    let alive = true;
    const actor = { role, personId };
    const refresh = async () => {
      try {
        const [events, sessions, stamps] = await Promise.all([getEvents(), getSessions(), getStamps()]);
        const mine = staffEvents(actor, events);
        const stampEvents = new Set(events.filter((e) => canDo(actor, e, 'stamps')).map((e) => e.id));
        const sessionEvent = new Map(sessions.map((s) => [s.id, s.eventId]));
        const pending = stamps.filter((s) => s.status === 'pending' && stampEvents.has(sessionEvent.get(s.sessionId) ?? '')).length;
        if (alive) setState({ hasDesk: role === 'admin' || mine.length > 0, pendingStamps: pending });
      } catch {
        /* keep the last numbers */
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), POLL_MS);
    window.addEventListener('focus', refresh);
    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [role, personId]);

  return state;
}
