import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { rememberRegisterIntent } from '../utils/registerIntent';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { getEvent } from '../services/eventService';
import { imageSrc } from '../utils/imageUrl';
import EventOrganizerLogo from '../components/EventOrganizerLogo';
import ShareEventButton from '../components/ShareEventButton';
import type { AppEvent } from '../types/event';

const MODALITY: Record<string, string> = { onsite: 'Onsite', hybrid: 'Hybrid', virtual: 'Online' };

function when(ev: AppEvent): string {
  const day = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { timeZone: 'Asia/Manila', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const time = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' });
  if (!ev.startAt) return '';
  const start = day(ev.startAt);
  const end = ev.endAt ? day(ev.endAt) : start;
  return start === end ? `${start}, ${time(ev.startAt)}${ev.endAt ? ` - ${time(ev.endAt)}` : ''}` : `${start} - ${end}`;
}

/**
 * What a shared event link opens. Signed-in people go straight to the event
 * page; everyone else sees the event and can sign in (and come back here) or sign up.
 */
export default function EventPreviewPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  // From the event's registration link: after signing in, open the one-tap Register
  const [params] = useSearchParams();
  const register = params.get('register') === '1';
  const target = `/events/${encodeURIComponent(id)}${register ? '?register=1' : ''}`;
  const [event, setEvent] = useState<AppEvent | null | undefined>(undefined);

  useEffect(() => {
    if (isAuthenticated) return;
    getEvent(id)
      .then(setEvent)
      .catch(() => setEvent(null));
  }, [id, isAuthenticated]);

  if (isAuthenticated) return <Navigate to={target} replace />;

  const signIn = () => navigate('/login', { state: { from: { pathname: `/events/${id}`, search: register ? '?register=1' : '' } } });
  const signUp = () => {
    // New accounts wait for approval; their first sign-in comes back to this event
    rememberRegisterIntent(id);
    navigate('/signup');
  };
  const picture = imageSrc(event?.imageUrl);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', px: 2, py: { xs: 3, sm: 6 } }}>
      <Box sx={{ maxWidth: 640, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" justifyContent="center" sx={{ mb: 3 }}>
          <EventOrganizerLogo />
        </Stack>
        {event === undefined ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : event === null ? (
          <Paper sx={{ p: 4, borderRadius: '18px', textAlign: 'center' }} data-testid="preview-missing">
            <Typography variant="h3" sx={{ mb: 1 }}>
              Event not found
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              This link may be old, or the event was removed.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/')}>
              See AWS SBG-APC
            </Button>
          </Paper>
        ) : (
          <Paper sx={{ borderRadius: '18px', overflow: 'hidden' }} data-testid="event-preview">
            {picture ? (
              <Box component="img" src={picture} alt="" sx={{ width: '100%', maxHeight: 300, objectFit: 'cover', display: 'block' }} />
            ) : (
              <Box sx={{ height: 120, background: brand.gradient }} />
            )}
            <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                {event.modality && <Chip size="small" label={MODALITY[event.modality] || event.modality} color="primary" />}
                {event.audience === 'officers' && <Chip size="small" label="Officers only" variant="outlined" />}
                {event.status === 'accomplished' && <Chip size="small" label="Done" variant="outlined" />}
                {event.status === 'cancelled' && <Chip size="small" label="Cancelled" color="error" variant="outlined" />}
              </Stack>
              <Stack direction="row" alignItems="flex-start" spacing={1}>
                <Typography variant="h2" sx={{ flex: 1, mb: 2, wordBreak: 'break-word' }}>
                  {event.title}
                </Typography>
                <ShareEventButton event={event} sx={{ color: 'primary.main' }} />
              </Stack>
              <Stack spacing={1.25} sx={{ mb: 2.5 }}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <CalendarMonthRoundedIcon sx={{ color: brand.primary }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {when(event)}
                  </Typography>
                </Stack>
                {event.venue && (
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <PlaceRoundedIcon sx={{ color: brand.primary }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {event.venue}
                    </Typography>
                  </Stack>
                )}
              </Stack>
              {(event.coOrganizers?.length ?? 0) > 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  With {event.coOrganizers!.join(', ')}
                </Typography>
              )}
              {event.description && (
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 3, wordBreak: 'break-word' }}>
                  {event.description}
                </Typography>
              )}
              <Box sx={{ p: 2, borderRadius: '14px', bgcolor: alpha(brand.primary, 0.06) }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
                  {event.audience === 'officers'
                    ? 'This is an internal meeting for AWS SBG-APC officers. Sign in with your officer account to join.'
                    : 'Sign in to register, get your event pass and collect stamps. New here? Create a free account.'}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button variant="contained" fullWidth onClick={signIn} sx={{ borderRadius: '12px', fontWeight: 700 }}>
                    Sign in to register
                  </Button>
                  {event.audience !== 'officers' && (
                    <Button variant="outlined" fullWidth onClick={signUp} sx={{ borderRadius: '12px', fontWeight: 700 }}>
                      Create an account
                    </Button>
                  )}
                </Stack>
              </Box>
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
