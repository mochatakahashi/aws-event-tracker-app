import { useEffect, useState } from 'react';
import { getUnreadCount, NOTIFICATIONS_CHANGED } from '../services/notificationService';

const POLL_MS = 30_000;

/** Unread in-app notifications for a person; refreshes on changes, focus, and every 30 s. */
export function useUnreadNotifications(personId: string | undefined): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!personId) {
      setCount(0);
      return;
    }
    let alive = true;
    const refresh = () => {
      getUnreadCount(personId)
        .then((n) => alive && setCount(n))
        .catch(() => undefined);
    };
    refresh();
    const timer = window.setInterval(refresh, POLL_MS);
    window.addEventListener(NOTIFICATIONS_CHANGED, refresh);
    window.addEventListener('focus', refresh);
    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener(NOTIFICATIONS_CHANGED, refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [personId]);

  return count;
}
