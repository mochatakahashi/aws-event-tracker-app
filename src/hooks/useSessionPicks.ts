import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRegistrationsByEvent, setSessionPicks } from '../services/registrationService';
import type { Registration } from '../types/attendee';

/**
 * Which sessions people plan to attend. The event has one expected
 * participant count; each registered attendee picks the sessions they'll go
 * to, so every session shows its own real "going" number.
 */
export function goingCounts(regs: Registration[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const r of regs) {
    if (r.rsvp === 'declined') continue;
    for (const sid of new Set(r.sessionIds ?? [])) counts.set(sid, (counts.get(sid) ?? 0) + 1);
  }
  return counts;
}

export function useSessionPicks(eventId: string | undefined) {
  const { user } = useAuth();
  const personId = user?.personId;
  const [regs, setRegs] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(Boolean(eventId));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!eventId) return;
    try {
      setRegs(await getRegistrationsByEvent(eventId));
    } catch {
      setRegs([]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    setLoading(Boolean(eventId));
    void reload();
  }, [reload, eventId]);

  const myReg = useMemo(() => regs.find((r) => r.personId === personId) ?? null, [regs, personId]);
  const counts = useMemo(() => goingCounts(regs), [regs]);
  const mine = useMemo(() => new Set(myReg?.sessionIds ?? []), [myReg]);
  /** Only people registered (and not "can't go") can pick sessions. */
  const canPick = Boolean(myReg && myReg.rsvp !== 'declined');

  const toggle = useCallback(
    async (sessionId: string) => {
      if (!myReg || !personId) return;
      setBusy(sessionId);
      setError('');
      const current = new Set(myReg.sessionIds ?? []);
      if (current.has(sessionId)) current.delete(sessionId);
      else current.add(sessionId);
      try {
        const updated = await setSessionPicks(myReg.id, personId, [...current]);
        setRegs((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save your session choice.');
      } finally {
        setBusy(null);
      }
    },
    [myReg, personId],
  );

  return { regs, myReg, counts, mine, canPick, toggle, busy, error, loading, reload, setRegs };
}
