import { useState } from 'react';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import { useAuth } from '../context/AuthContext';
import { connectionAction, type ConnectAction } from '../services/authService';
import { notifyInApp } from '../services/notificationService';

/** Connect / Requested / Accept–Decline / Connected, for another person. */
export default function ConnectButton({
  personId,
  name,
  onChange,
  size = 'medium',
}: {
  personId: string;
  name: string;
  onChange?: (status: string) => void;
  size?: 'small' | 'medium';
}) {
  const { user, setCurrentUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!user || user.personId === personId) return null;

  const connected = Boolean(user.connections?.includes(personId));
  const incoming = Boolean(user.connectionRequests?.includes(personId));
  const outgoing = Boolean(user.sentConnectionRequests?.includes(personId));
  const first = name.split(' ')[0];

  async function run(action: ConnectAction, accept?: boolean) {
    if (!user) return;
    setBusy(true);
    setError('');
    try {
      const res = await connectionAction(action, personId, user.personId, accept);
      setCurrentUser(res.me);
      if (res.status === 'requested') {
        void notifyInApp({
          personIds: [personId],
          kind: 'connection-request',
          title: `${user.name} wants to connect`,
          message: 'Open their profile to approve or decline the AWS SBG-APC connection.',
          link: `/people/${user.personId}`,
        });
      } else if (res.status === 'connected' && (action === 'connect-respond' || action === 'connect')) {
        void notifyInApp({
          personIds: [personId],
          kind: 'connection-accepted',
          title: `${user.name} accepted your connection`,
          message: 'You are now connected on AWS SBG-APC. See their achievements on their profile.',
          link: `/people/${user.personId}`,
        });
      }
      onChange?.(res.status);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the connection.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack spacing={0.5} alignItems={{ xs: 'stretch', sm: 'flex-end' }} sx={{ flexShrink: 0 }} data-testid="connect-button">
      {connected ? (
        <Stack direction="row" spacing={1}>
          <Button size={size} variant="outlined" color="success" startIcon={<HowToRegRoundedIcon />} disabled>
            Connected
          </Button>
          <Button size={size} color="error" disabled={busy} onClick={() => void run('disconnect')}>
            Remove
          </Button>
        </Stack>
      ) : incoming ? (
        <>
          <Typography variant="caption" color="text.secondary">
            {first} wants to connect with you
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button size={size} variant="contained" color="success" disabled={busy} onClick={() => void run('connect-respond', true)} sx={{ backgroundImage: 'none' }}>
              Approve
            </Button>
            <Button size={size} variant="outlined" color="error" disabled={busy} onClick={() => void run('connect-respond', false)}>
              Decline
            </Button>
          </Stack>
        </>
      ) : outgoing ? (
        <Stack direction="row" spacing={1}>
          <Button size={size} variant="outlined" startIcon={<HourglassTopRoundedIcon />} disabled>
            Requested
          </Button>
          <Button size={size} disabled={busy} onClick={() => void run('connect-cancel')}>
            Cancel
          </Button>
        </Stack>
      ) : (
        <Button size={size} variant="contained" startIcon={<PersonAddAlt1RoundedIcon />} disabled={busy} onClick={() => void run('connect')}>
          Connect
        </Button>
      )}
      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}
    </Stack>
  );
}
