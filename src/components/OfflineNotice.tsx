import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { OFFLINE_EVENT, lastOfflineSavedAt } from '../services/apiClient';

/**
 * Shows a notice when the database cannot be reached and the app is showing
 * the last saved copy of the data instead.
 */
export default function OfflineNotice() {
  const [savedAt, setSavedAt] = useState<string | null>(() => lastOfflineSavedAt());
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onOffline = (e: Event) => {
      const at = (e as CustomEvent<{ at?: string }>).detail?.at || '';
      setSavedAt(at || 'earlier');
      setHidden(false);
    };
    window.addEventListener(OFFLINE_EVENT, onOffline);
    return () => window.removeEventListener(OFFLINE_EVENT, onOffline);
  }, []);

  if (!savedAt || hidden) return null;

  const when = (() => {
    const t = Date.parse(savedAt);
    if (!t) return 'earlier';
    return new Date(t).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' });
  })();

  return (
    <Alert
      severity="warning"
      data-testid="offline-notice"
      sx={{ mb: 2, borderRadius: 2 }}
      action={
        <>
          <Button color="inherit" size="small" onClick={() => window.location.reload()}>Retry</Button>
          <Button color="inherit" size="small" onClick={() => setHidden(true)}>Hide</Button>
        </>
      }
    >
      Can't reach the database right now. Showing saved info from {when}. Changes can't be saved until it's back.
    </Alert>
  );
}
