import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';
import StarsRoundedIcon from '@mui/icons-material/StarsRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { getSessions, getStampsByAttendee } from '../services/sessionService';
import { stampProgress } from '../utils/evaluation';
import { getEvents } from '../services/eventService';
import {
  certificateLink,
  certificateShareLink,
  certificateState,
  getRegistrationsByPerson,
} from '../services/registrationService';
import { brand } from '../theme/theme';
import type { Session, Stamp } from '../types/session';
import type { AppEvent } from '../types/event';
import type { Registration } from '../types/attendee';
import MyStandingCard from '../components/MyStandingCard';

const day = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' }) : '';

function Tile({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: '16px', textAlign: 'center', borderColor: alpha(color, 0.3), bgcolor: alpha(color, 0.05) }}>
      <Typography variant="h3" sx={{ fontWeight: 800, color, fontSize: { xs: '1.6rem', sm: '2rem' } }}>
        {value}
      </Typography>
      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </Typography>
    </Paper>
  );
}

function SectionTitle({ icon, children, count }: { icon: React.ReactNode; children: React.ReactNode; count?: number }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5, mt: 3 }}>
      <Box sx={{ color: brand.primary, display: 'flex' }}>{icon}</Box>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>
        {children}
      </Typography>
      {count !== undefined && <Chip size="small" label={count} />}
    </Stack>
  );
}

/** One certificate: View, Download, Copy link. */
function CertificateRow({ reg, event, personId }: { reg: Registration; event: AppEvent; personId: string }) {
  const [links, setLinks] = useState<{ view: string; download: string } | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    Promise.all([certificateLink(reg.id, personId), certificateLink(reg.id, personId, true)])
      .then(([view, download]) => setLinks(view && download ? { view, download } : null))
      .catch(() => setLinks(null));
  }, [reg.id, personId]);
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: '14px' }} data-testid={`certificate-${event.id}`}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
        <WorkspacePremiumRoundedIcon sx={{ color: brand.primary, fontSize: 36, flexShrink: 0 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {event.title}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Certificate of Participation · {day(event.endAt || event.startAt)}
          </Typography>
          {reg.certificateId && (
            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
              {reg.certificateId}
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <Button size="small" variant="contained" startIcon={<VisibilityRoundedIcon />} disabled={!links} component="a" href={links?.view} target="_blank" rel="noopener noreferrer">
            View
          </Button>
          <Button size="small" variant="outlined" startIcon={<DownloadRoundedIcon />} disabled={!links} component="a" href={links?.download} download>
            Download
          </Button>
          {reg.certificateId && (
            <Button
              size="small"
              startIcon={<LinkRoundedIcon />}
              onClick={() =>
                void navigator.clipboard
                  ?.writeText(certificateShareLink(reg.certificateId!))
                  .then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  })
                  .catch(() => undefined)
              }
            >
              {copied ? 'Copied!' : 'Copy link'}
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

/**
 * My achievements: what you've completed - progress and badges, certificates,
 * stamps you've earned and events you attended. Stamp passports for events
 * that are still coming up live on the Dashboard and the event page.
 */
export default function AchievementsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [regs, setRegs] = useState<Registration[]>([]);

  useEffect(() => {
    if (!user?.personId) return;
    Promise.all([
      getEvents(),
      getSessions().catch(() => [] as Session[]),
      getStampsByAttendee(user.personId).catch(() => [] as Stamp[]),
      getRegistrationsByPerson(user.personId).catch(() => [] as Registration[]),
    ])
      .then(([e, s, st, r]) => {
        setEvents(e);
        setSessions(s);
        setStamps(st);
        setRegs(r);
      })
      .finally(() => setLoading(false));
  }, [user?.personId]);

  const eventById = useMemo(() => new Map(events.map((e) => [e.id, e])), [events]);
  const sessionById = useMemo(() => new Map(sessions.map((s) => [s.id, s])), [sessions]);

  const attended = useMemo(
    () =>
      regs
        .filter((r) => r.checkedIn && eventById.has(r.eventId))
        .map((r) => ({ reg: r, event: eventById.get(r.eventId)! }))
        .sort((a, b) => b.event.startAt.localeCompare(a.event.startAt)),
    [regs, eventById],
  );
  const certificates = attended.filter((x) => certificateState(x.reg, x.event, Date.now(), stampProgress(x.event, sessions, stamps)) === 'ready');
  const earned = useMemo(
    () =>
      stamps
        .filter((s) => s.status === 'approved' && sessionById.has(s.sessionId))
        .map((s) => ({ stamp: s, session: sessionById.get(s.sessionId)!, event: eventById.get(sessionById.get(s.sessionId)!.eventId) }))
        .sort((a, b) => (b.stamp.approvedAt || '').localeCompare(a.stamp.approvedAt || '')),
    [stamps, sessionById, eventById],
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
        <EmojiEventsRoundedIcon sx={{ color: brand.primary, fontSize: 28 }} />
        <Typography variant="h2" sx={{ fontWeight: 700 }}>
          My achievements
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Everything you’ve completed: stamps earned, events attended, certificates and badges. Stamp passports for events that
        are still coming up are on your Dashboard and the event page.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5, mb: 3 }}>
        <Tile value={earned.length} label="Stamps earned" color="#8B5CF6" />
        <Tile value={attended.length} label="Events attended" color="#10B981" />
        <Tile value={certificates.length} label="Certificates" color="#F59E0B" />
      </Box>

      <MyStandingCard />

      <SectionTitle icon={<WorkspacePremiumRoundedIcon />} count={certificates.length}>
        Certificates
      </SectionTitle>
      {certificates.length === 0 ? (
        <Typography variant="body2" color="text.secondary" data-testid="no-certificates">
          No certificates yet. You get one for every event you’re checked in at - it unlocks after the event ends.
        </Typography>
      ) : (
        <Stack spacing={1.25}>
          {certificates.map((x) => (
            <CertificateRow key={x.reg.id} reg={x.reg} event={x.event} personId={user!.personId} />
          ))}
        </Stack>
      )}

      <SectionTitle icon={<StarsRoundedIcon />} count={earned.length}>
        Stamps earned
      </SectionTitle>
      {earned.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No stamps yet. Finish a session’s activity at an event with ⭐ Stamps and an officer approves it.
        </Typography>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }} data-testid="stamps-earned">
          {earned.map(({ stamp, session, event }) => (
            <Stack
              key={stamp.id}
              direction="row"
              spacing={1.25}
              alignItems="center"
              sx={{ p: 1.25, borderRadius: '12px', border: `1px solid ${alpha(brand.success, 0.35)}`, bgcolor: alpha(brand.success, 0.04) }}
            >
              <CheckCircleRoundedIcon sx={{ color: brand.success }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                  {session.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                  {[event?.title, day(stamp.approvedAt)].filter(Boolean).join(' · ')}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Box>
      )}

      <SectionTitle icon={<CalendarMonthIcon />} count={attended.length}>
        Events attended
      </SectionTitle>
      {attended.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Events you’re checked in at show up here.
        </Typography>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }} data-testid="events-attended">
          {attended.map(({ reg, event }) => (
            <Stack
              key={reg.id}
              direction="row"
              spacing={1.25}
              alignItems="center"
              role="button"
              onClick={() => navigate(`/events/${event.id}`)}
              sx={{ p: 1.25, borderRadius: '12px', cursor: 'pointer', border: `1px solid ${alpha(brand.primary, 0.12)}`, '&:hover': { bgcolor: alpha(brand.primary, 0.04) } }}
            >
              <CheckCircleRoundedIcon sx={{ color: brand.success }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                  {event.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {day(event.startAt)} · {event.venue}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Box>
      )}
    </Box>
  );
}
