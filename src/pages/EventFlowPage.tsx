import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CardActionArea from '@mui/material/CardActionArea';
import { alpha } from '@mui/material/styles';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { getSessionsByEvent, getStampsByAttendee } from '../services/sessionService';
import { getSpeakers } from '../services/speakerService';
import { brand } from '../theme/theme';
import type { Session } from '../types/session';
import type { Stamp } from '../types/session';
import type { Speaker } from '../types/speaker';
import SessionCard from '../components/SessionCard';

function formatTimeGroup(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function EventFlowPage() {
  const navigate = useNavigate();
  const { selectedEvent } = useEvent();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedEvent) {
      setLoading(false);
      return;
    }
    Promise.all([
      getSessionsByEvent(selectedEvent.id),
      user?.personId ? getStampsByAttendee(user.personId) : Promise.resolve([]),
      getSpeakers(),
    ])
      .then(([sess, stmps, spks]) => {
        setSessions(sess);
        setStamps(stmps);
        setSpeakers(spks);
      })
      .finally(() => setLoading(false));
  }, [selectedEvent, user?.personId]);

  // Group sessions by start time
  const grouped = useMemo(() => {
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

    const groups: { time: string; sessions: Session[] }[] = [];
    for (const session of sorted) {
      const timeKey = formatTimeGroup(session.startTime);
      const existing = groups.find((g) => g.time === timeKey);
      if (existing) {
        existing.sessions.push(session);
      } else {
        groups.push({ time: timeKey, sessions: [session] });
      }
    }
    return groups;
  }, [sessions]);

  const stampSessionCount = sessions.filter((s) => s.requiresStamp).length;
  const completedStamps = stamps.filter((s) => s.status === 'approved').length;

  if (!selectedEvent) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CalendarMonthIcon sx={{ fontSize: 64, color: alpha(brand.primary, 0.3), mb: 2 }} />
        <Typography variant="h2" gutterBottom>
          No event selected
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Choose an event to see the session flow.
        </Typography>
        <CardActionArea
          onClick={() => navigate('/select-event')}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            px: 3,
            py: 1.5,
            borderRadius: 3,
            background: brand.gradient,
            color: '#fff',
            fontWeight: 600,
          }}
        >
          Select Event <ArrowForwardRoundedIcon />
        </CardActionArea>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
        <Box>
          <Typography variant="h2" sx={{ fontWeight: 700 }}>
            SCHEDULE
          </Typography>
          {stampSessionCount > 0 && (
            <Typography variant="body2" color="text.secondary">
              {completedStamps} of {stampSessionCount} stamps done
            </Typography>
          )}
        </Box>

      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontSize: '0.8rem' }}>
        The full schedule for this event. Tap on any session for details.
      </Typography>

      {/* Session groups */}
      {grouped.map((group) => (
        <Box key={group.time} sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
            <Typography variant="h3" sx={{ fontWeight: 700 }}>
              {group.time}
            </Typography>
            <Chip
              label={`${group.sessions.length} Session${group.sessions.length > 1 ? 's' : ''}`}
              size="small"
              sx={{
                backgroundColor: alpha(brand.primary, 0.08),
                color: brand.primary,
                fontWeight: 600,
                fontSize: '0.7rem',
              }}
            />
          </Stack>

          {group.sessions.map((session) => {
            const stamp = stamps.find((s) => s.sessionId === session.id);
            const sessionSpeakers = speakers.filter((s) => session.speakerIds.includes(s.id));
            return (
              <SessionCard
                key={session.id}
                session={session}
                hasStamp={Boolean(stamp)}
                stampStatus={stamp?.status}
                speakers={sessionSpeakers}
                onClick={() => navigate(`/flow/session/${session.id}`)}
              />
            );
          })}
        </Box>
      ))}

      {/* Sessions available hint */}
      {sessions.length > 0 && (
        <Button
          fullWidth
          variant="outlined"
          onClick={() => navigate('/select-event')}
          sx={{
            py: 1.2,
            borderStyle: 'dashed',
            borderColor: alpha(brand.primary, 0.3),
            color: brand.primary,
            fontWeight: 600,
          }}
        >
          {sessions.length} sessions available — change event
        </Button>
      )}
    </Box>
  );
}
