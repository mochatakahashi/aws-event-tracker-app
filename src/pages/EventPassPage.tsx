import { useCallback, useEffect, useMemo, useState } from 'react';
import FoodStubsCard from '../components/FoodStubsCard';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { getEvents } from '../services/eventService';
import { getRegistrationsByPerson } from '../services/registrationService';
import { formatDateRange } from '../utils/eventDisplay';
import { affiliation } from '../utils/people';
import { passLink } from '../utils/pass';
import AddToCalendarButton from '../components/AddToCalendarButton';
import CertificateButton from '../components/CertificateButton';
import type { AppEvent } from '../types/event';
import type { Registration } from '../types/attendee';
import { imageSrc } from '../utils/imageUrl';

/** Pick the most relevant pass: ?event=, then the selected event, then the next one coming up. */
function pickDefault(regs: Registration[], events: Map<string, AppEvent>, wanted?: string | null, selected?: string) {
  const ids = regs.map((r) => r.eventId);
  if (wanted && ids.includes(wanted)) return wanted;
  if (selected && ids.includes(selected)) return selected;
  const now = Date.now();
  const sorted = [...regs].sort((a, b) => {
    const ea = events.get(a.eventId);
    const eb = events.get(b.eventId);
    const pa = ea ? Math.abs(new Date(ea.startAt).getTime() - now) : Infinity;
    const pb = eb ? Math.abs(new Date(eb.startAt).getTime() - now) : Infinity;
    return pa - pb;
  });
  return sorted[0]?.eventId ?? '';
}

export default function EventPassPage() {
  const { user } = useAuth();
  const { selectedEvent } = useEvent();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [regs, setRegs] = useState<Registration[]>([]);
  const [events, setEvents] = useState<Map<string, AppEvent>>(new Map());
  const [eventId, setEventId] = useState('');
  const [qr, setQr] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    const [mine, all] = await Promise.all([getRegistrationsByPerson(user.personId), getEvents()]);
    const map = new Map(all.map((e) => [e.id, e]));
    const active = mine.filter((r) => map.has(r.eventId) && map.get(r.eventId)!.status !== 'cancelled');
    setRegs(active);
    setEvents(map);
    return { active, map };
  }, [user]);

  useEffect(() => {
    load()
      .then((res) => {
        if (res) setEventId((cur) => cur || pickDefault(res.active, res.map, params.get('event'), selectedEvent?.id));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load your pass.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const reg = useMemo(() => regs.find((r) => r.eventId === eventId) ?? null, [regs, eventId]);
  const event = eventId ? events.get(eventId) : undefined;

  // Draw the QR code
  useEffect(() => {
    if (!reg) return;
    let alive = true;
    import('qrcode')
      .then((QR) =>
        QR.toDataURL(passLink(reg.id), {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 480,
          color: { dark: '#1A0A2E', light: '#FFFFFF' },
        }),
      )
      .then((url) => alive && setQr(url))
      .catch(() => alive && setError('Could not draw your QR code.'));
    return () => {
      alive = false;
    };
  }, [reg]);

  // While waiting at the door, refresh so the pass turns green after the scan
  useEffect(() => {
    if (!reg || reg.checkedIn) return;
    const timer = window.setInterval(() => void load().catch(() => undefined), 10_000);
    return () => window.clearInterval(timer);
  }, [reg, load]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return null;

  if (regs.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8, maxWidth: 460, mx: 'auto' }}>
        <QrCode2RoundedIcon sx={{ fontSize: 56, color: alpha(brand.primary, 0.4) }} />
        <Typography variant="h2" sx={{ mt: 1 }}>
          No event pass yet
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Register for an event and your digital pass with a QR code will appear here.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/events')}>
          Browse events
        </Button>
      </Box>
    );
  }

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto' }}>
      <Typography variant="h1" sx={{ mb: 0.5 }}>
        My Event Pass
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Show this QR code at the registration booth. An officer scans it to check you in.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {regs.length > 1 && (
        <TextField
          select
          size="small"
          label="Event"
          value={eventId}
          onChange={(e) => {
            setQr('');
            setEventId(e.target.value);
            setParams({ event: e.target.value }, { replace: true });
          }}
          sx={{ mb: 2.5, minWidth: { xs: '100%', sm: 360 } }}
        >
          {regs.map((r) => (
            <MenuItem key={r.id} value={r.eventId}>
              {events.get(r.eventId)?.title}
            </MenuItem>
          ))}
        </TextField>
      )}

      {reg && event && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 420px) 1fr' }, gap: 3, alignItems: 'start' }}>
          {/* The pass */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: '20px',
              overflow: 'hidden',
              border: `1px solid ${alpha(brand.primary, 0.2)}`,
              boxShadow: `0 12px 40px ${alpha(brand.primary, 0.15)}`,
            }}
          >
            <Box sx={{ background: brand.gradient, color: '#fff', p: 2.5 }}>
              <Typography variant="overline" sx={{ opacity: 0.85, letterSpacing: 1.5 }}>
                AWS SBG-APC · Event Pass
              </Typography>
              <Typography variant="h3" sx={{ color: '#fff', fontWeight: 800, lineHeight: 1.25 }}>
                {event.title}
              </Typography>
            </Box>
            <Box sx={{ p: 2.5, textAlign: 'center' }}>
              <Box
                sx={{
                  mx: 'auto',
                  width: '100%',
                  maxWidth: 280,
                  aspectRatio: '1 / 1',
                  borderRadius: '16px',
                  border: `2px solid ${reg.checkedIn ? brand.success : alpha(brand.primary, 0.15)}`,
                  p: 1.5,
                  bgcolor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {reg.rsvp !== 'approved' && !reg.checkedIn ? (
                  <Box sx={{ px: 2 }} data-testid="pass-not-approved">
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {reg.rsvp === 'declined' ? 'Registration declined' : 'Waiting for approval'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {reg.rsvp === 'declined'
                        ? 'Your registration for this event was declined, so there is no pass.'
                        : 'Your QR pass appears here once an officer approves your registration.'}
                    </Typography>
                  </Box>
                ) : qr ? (
                  <Box component="img" src={qr} alt={`QR code pass for ${user.name}`} sx={{ width: '100%', height: '100%' }} />
                ) : (
                  <CircularProgress size={28} />
                )}
              </Box>
              <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center" sx={{ mt: 2 }}>
                <Avatar src={imageSrc(user.avatarUrl)} sx={{ width: 40, height: 40 }}>
                  {initials}
                </Avatar>
                <Box sx={{ textAlign: 'left', minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }} noWrap>
                    {user.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                    {/* Name only - no member type beside it */}
                    {affiliation(user) !== '-' ? affiliation(user) : ''}
                  </Typography>
                </Box>
              </Stack>
              <Box sx={{ mt: 2 }}>
                {reg.checkedIn ? (
                  <Chip
                    icon={<CheckCircleRoundedIcon />}
                    color="success"
                    label={`Checked in${reg.checkedInAt ? ` · ${new Date(reg.checkedInAt).toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' })}` : ''}`}
                    sx={{ fontWeight: 700 }}
                  />
                ) : (
                  <Chip label="Not checked in yet" variant="outlined" sx={{ fontWeight: 600 }} />
                )}
              </Box>
              {event && <FoodStubsCard event={event} personId={user.personId} registered compact />}
              {!reg.checkedIn && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 1.5 }}>
                  <LightModeOutlinedIcon sx={{ fontSize: 14 }} /> Turn up your screen brightness for a quick scan
                </Typography>
              )}
            </Box>
          </Paper>

          {/* Details, calendar and certificate */}
          <Paper sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: '20px' }}>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <CalendarMonthRoundedIcon sx={{ color: brand.primary }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatDateRange(event.startAt, event.endAt)}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <PlaceRoundedIcon sx={{ color: brand.primary }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {event.venue}
                </Typography>
              </Stack>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2.5 }}>
              <AddToCalendarButton event={event} fullWidth />
              <Button fullWidth variant="text" onClick={() => navigate(`/events/${event.id}`)} sx={{ borderRadius: '12px' }}>
                Event details
              </Button>
            </Stack>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5 }}>
              Certificate of Participation
            </Typography>
            <CertificateButton registration={reg} personId={user.personId} event={event} />
          </Paper>
        </Box>
      )}
    </Box>
  );
}
