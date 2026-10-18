import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/authService';

/** The bookmark icon: save events to your account (works on every device). */
export function useSavedEvents() {
  const { user, setCurrentUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const saved = user?.savedEventIds ?? [];

  const toggle = useCallback(
    async (eventId: string) => {
      if (!user || busy) return;
      const next = saved.includes(eventId) ? saved.filter((id) => id !== eventId) : [...saved, eventId];
      setBusy(true);
      // Show the change right away, then save
      setCurrentUser({ ...user, savedEventIds: next });
      try {
        setCurrentUser(await updateProfile(user.personId, { savedEventIds: next }));
      } catch {
        setCurrentUser({ ...user, savedEventIds: saved });
      } finally {
        setBusy(false);
      }
    },
    [user, saved, busy, setCurrentUser],
  );

  return { saved, isSaved: (id: string) => saved.includes(id), toggle };
}
