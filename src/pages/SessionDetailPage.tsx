import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTimeRounded';
import PlaceIcon from '@mui/icons-material/PlaceRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { alpha } from '@mui/material/styles';
import { getSessionById, getStampsByAttendee, createStamp } from '../services/sessionService';
import { getSpeakers } from '../services/speakerService';
import { useAuth } from '../context/AuthContext';
import { brand } from '../theme/theme';
import type { Session, Stamp } from '../types/session';
import type { Speaker } from '../types/speaker';
import StampBadge from '../components/StampBadge';
import Alert from '@mui/material/Alert';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { getEvent } from '../services/eventService';
import { useSessionPicks } from '../hooks/useSessionPicks';
import { canDo } from '../utils/eventStaff';
import type { AppEvent } from '../types/event';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [myStamp, setMyStamp] = useState<Stamp | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [event, setEvent] = useState<AppEvent | null>(null);
  const picks = useSessionPicks(session?.eventId);

  useEffect(() => {
    if (session?.eventId) void getEvent(session.eventId).then(setEvent).catch(() => setEvent(null));
  }, [session?.eventId]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getSessionById(id),
      getSpeakers(),
      user?.personId ? getStampsByAttendee(user.personId) : Promise.resolve([])
    ])
      .then(([sess, allSpeakers, stamps]) => {
        if (sess) {
          setSession(sess);
          setSpeakers(allSpeakers.filter((s) => sess.speakerIds.includes(s.id)));
          setMyStamp(stamps.find(s => s.sessionId === id) || null);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const canApprove = canDo(user, event, 'stamps');
  const going = session ? picks.counts.get(session.id) ?? 0 : 0;
  const attending = session ? picks.mine.has(session.id) : false;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography>Session not found.</Typography>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Back button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2, color: brand.textPrimary, fontWeight: 500, pl: 0 }}
      >
        Back
      </Button>

      {/* Session title */}
      <Typography
        variant="h1"
        sx={{
          fontWeight: 800,
          fontSize: { xs: '1.75rem', sm: '2.25rem' },
          mb: 2,
          lineHeight: 1.2,
        }}
      >
        {session.title}
      </Typography>

      {/* Time & Room chips */}
      <Stack direction="row" spacing={1} sx={{ mb: 3 }} flexWrap="wrap" useFlexGap>
        <Chip
          icon={<AccessTimeIcon sx={{ fontSize: 18 }} />}
          label={`${formatTime(session.startTime)} – ${formatTime(session.endTime)}`}
          variant="outlined"
          sx={{ borderRadius: 20, fontWeight: 500, fontSize: '0.85rem', py: 2.5 }}
        />
        <Chip
          icon={<PlaceIcon sx={{ fontSize: 18 }} />}
          label={session.room}
          variant="outlined"
          sx={{ borderRadius: 20, fontWeight: 500, fontSize: '0.85rem', py: 2.5 }}
        />
      </Stack>

      {/* Who's going + pick this session */}
      <Card variant="outlined" sx={{ mb: 3, borderRadius: '14px' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
              <GroupsRoundedIcon color="primary" />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }} data-testid="session-detail-going">
                  {going ? `${going} ${going === 1 ? 'person is' : 'people are'} going` : 'No one has picked this session yet'}
                </Typography>
                {event && event.participants > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {event.participantsEstimated ? 'Est. ' : ''}
                    {event.participants} expected for the whole event — everyone registered can join any session.
                  </Typography>
                )}
              </Box>
            </Stack>
            {picks.canPick ? (
              <Button
                variant={attending ? 'contained' : 'outlined'}
                color={attending ? 'success' : 'primary'}
                startIcon={attending ? <EventAvailableRoundedIcon /> : <AddRoundedIcon />}
                disabled={picks.busy === session.id}
                onClick={() => void picks.toggle(session.id)}
                sx={{ borderRadius: '12px', whiteSpace: 'nowrap', ...(attending ? { backgroundImage: 'none' } : {}) }}
              >
                {attending ? "I'm going ✓" : "I'll attend"}
              </Button>
            ) : (
              !picks.loading &&
              user?.role !== 'admin' && (
                <Button size="small" onClick={() => navigate(`/events/${session.eventId}`)}>
                  Register to pick sessions
                </Button>
              )
            )}
          </Stack>
          {picks.error && (
            <Alert severity="error" sx={{ mt: 1.5 }}>
              {picks.error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      {session.description && (
        <Typography
          variant="body1"
          sx={{
            mb: 3,
            color: brand.textPrimary,
            lineHeight: 1.7,
            whiteSpace: 'pre-line',
          }}
        >
          {session.description}
        </Typography>
      )}

      {/* Stamp section */}
      {session.requiresStamp && (
        <Card
          sx={{
            mb: 3,
            background: alpha(brand.warning, 0.05),
            border: `1px solid ${alpha(brand.warning, 0.2)}`,
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <StampBadge earned={false} size="medium" />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" sx={{ mb: 0.3 }}>
                  ⭐ Stamp Activity
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Complete this session's activity to earn your stamp.
                  {canApprove
                    ? ' You are on the stamp team for this event, so you can approve stamps.'
                    : ' Ask an officer on the stamp team to verify your completion.'}
                </Typography>
              </Box>
            </Stack>
            {myStamp ? (
              <Chip
                label={myStamp.status === 'approved' ? 'Stamp Approved' : 'Request Pending'}
                color={myStamp.status === 'approved' ? 'success' : 'warning'}
                sx={{ mt: 1.5 }}
              />
            ) : (
              <Button
                variant="contained"
                size="small"
                disabled={requesting}
                onClick={() => {
                  if (!user?.personId) return;
                  setRequesting(true);
                  createStamp({ sessionId: session.id, attendeeId: user.personId, status: 'pending' })
                    .then(setMyStamp)
                    .finally(() => setRequesting(false));
                }}
                sx={{ mt: 1.5, background: brand.gradient }}
              >
                {requesting ? 'Requesting...' : 'Request Stamp'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Speakers */}
      {speakers.length > 0 && (
        <>
          <Typography
            variant="h6"
            sx={{ color: brand.primary, mb: 1.5, fontSize: '0.75rem' }}
          >
            SPEAKERS
          </Typography>

          <Stack spacing={1.5}>
            {speakers.map((speaker) => {
              const initials = speaker.name
                .split(' ')
                .map((w) => w[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <Card key={speaker.id} variant="outlined">
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar
                        sx={{
                          width: 44,
                          height: 44,
                          fontSize: '0.9rem',
                          bgcolor: alpha(brand.primary, 0.15),
                          color: brand.primary,
                        }}
                      >
                        {initials}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h5" noWrap>
                          {speaker.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                          sx={{ fontStyle: 'italic' }}
                        >
                          {speaker.headline} · {speaker.company}
                        </Typography>
                      </Box>
                      <IconButton size="small" sx={{ color: brand.textSecondary }}>
                        <InfoOutlinedIcon />
                      </IconButton>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        </>
      )}

      <Divider sx={{ my: 3 }} />

      <Stack direction="row" spacing={1}>
        <Chip
          label={session.type.charAt(0).toUpperCase() + session.type.slice(1)}
          size="small"
          sx={{
            fontWeight: 600,
            backgroundColor: alpha(brand.primary, 0.08),
            color: brand.primary,
          }}
        />
        <Chip
          label={
            session.status === 'not-started'
              ? 'Not Started'
              : session.status === 'ongoing'
                ? 'In Progress'
                : 'Completed'
          }
          size="small"
          variant="outlined"
          sx={{ fontWeight: 500 }}
        />
      </Stack>
    </Box>
  );
}
