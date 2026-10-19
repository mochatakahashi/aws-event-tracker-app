import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { deleteSession, getSessionsByEvent } from '../services/sessionService';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { useAuth } from '../context/AuthContext';
import SessionEditor from './SessionEditor';
import { useSessionPicks } from '../hooks/useSessionPicks';
import type { AppEvent } from '../types/event';
import type { Session } from '../types/session';

const time = (iso: string) =>
  iso
    ? new Date(iso).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' })
    : '';
const day = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' }) : '';

/**
 * Sessions on the event page. The expected participants number is for the
 * whole event; each registered attendee picks the sessions they'll join, and
 * every session shows how many picked it. Events can have no sessions.
 */
export default function SessionsSection({
  event,
  /** Changes when the viewer registers / cancels, so their picks reload. */
  refreshKey,
  isAdmin,
  onSessionsChanged,
}: {
  event: AppEvent;
  refreshKey?: string;
  isAdmin?: boolean;
  /** Called after a session is added or edited (the page refreshes its speakers lineup). */
  onSessionsChanged?: () => void;
}) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const picks = useSessionPicks(event.id);
  const { reload } = picks;
  const { user } = useAuth();
  const [editing, setEditing] = useState<string | null>(null); // 'new' or a session id
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [adminError, setAdminError] = useState('');

  const loadSessions = useCallback(() => {
    getSessionsByEvent(event.id)
      .then((list) => setSessions([...list].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))))
      .catch(() => setSessions([]));
  }, [event.id]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  async function remove(id: string) {
    if (!user) return;
    setAdminError('');
    try {
      await deleteSession(id, user.personId);
      setConfirmDelete(null);
      loadSessions();
    } catch (e) {
      setAdminError(e instanceof Error ? e.message : 'Could not delete the session.');
    }
  }

  useEffect(() => {
    void reload();
  }, [refreshKey, reload]);

  const picked = sessions?.filter((s) => picks.mine.has(s.id)).length ?? 0;

  return (
    <Box data-testid="sessions-section">
      <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 0.5 }} flexWrap="wrap" useFlexGap>
        <Typography variant="h3" sx={{ fontWeight: 800 }}>
          Sessions
        </Typography>
        {sessions && sessions.length > 0 && <Chip size="small" label={sessions.length} />}
        {sessions && (
          <Chip
            size="small"
            data-testid="event-stamps-info"
            label={
              sessions.some((x) => x.requiresStamp)
                ? `⭐ Stamp passport · ${sessions.filter((x) => x.requiresStamp).length} stamp${sessions.filter((x) => x.requiresStamp).length === 1 ? '' : 's'}`
                : 'No stamps at this event'
            }
            sx={
              sessions.some((x) => x.requiresStamp)
                ? { backgroundColor: '#FEF3C7', color: '#92400E', fontWeight: 700 }
                : { fontWeight: 600 }
            }
          />
        )}
      </Stack>
      {event.participants > 0 && event.audience !== 'officers' && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {event.participantsEstimated ? 'Est. ' : ''}
          {event.participants} {event.status === 'accomplished' ? 'attended' : 'expected'} for the whole event
          {sessions && sessions.length > 0 ? ' - everyone registered can join any session and picks the ones they’ll go to.' : '.'}
        </Typography>
      )}

      {isAdmin && user && (
        <Box sx={{ mb: 1.5 }}>
          {adminError && (
            <Alert severity="error" sx={{ mb: 1 }} onClose={() => setAdminError('')}>
              {adminError}
            </Alert>
          )}
          {editing === 'new' ? (
            <SessionEditor
              event={event}
              actorId={user.personId}
              onCancel={() => setEditing(null)}
              onSaved={() => {
                setEditing(null);
                loadSessions();
                onSessionsChanged?.();
              }}
            />
          ) : (
            <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={() => setEditing('new')} sx={{ borderRadius: '10px' }}>
              Add session
            </Button>
          )}
        </Box>
      )}

      {sessions === null ? (
        <Skeleton variant="rounded" height={72} sx={{ borderRadius: '12px' }} />
      ) : sessions.length === 0 ? (
        <Typography color="text.secondary">
          {isAdmin
            ? 'No sessions yet. Add sessions if the event has several parts (talks, workshops); leave it empty for a single program.'
            : 'This event has no separate sessions - it’s one program. Your registration covers all of it.'}
        </Typography>
      ) : (
        <>
          {picks.canPick ? (
            <Alert severity={picked ? 'success' : 'info'} sx={{ mb: 1.5 }}>
              {picked
                ? `You picked ${picked} of ${sessions.length} session${sessions.length === 1 ? '' : 's'}.`
                : 'You’re registered - pick the sessions you’ll attend.'}
            </Alert>
          ) : (
            !isAdmin &&
            !picks.loading && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                Register for the event to pick your sessions.
              </Typography>
            )
          )}
          {picks.error && (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              {picks.error}
            </Alert>
          )}
          <Stack spacing={1}>
            {sessions.map((s) => {
              const going = picks.counts.get(s.id) ?? 0;
              const mine = picks.mine.has(s.id);
              if (editing === s.id && user) {
                return (
                  <SessionEditor
                    key={s.id}
                    event={event}
                    session={s}
                    actorId={user.personId}
                    onCancel={() => setEditing(null)}
                    onSaved={() => {
                      setEditing(null);
                      loadSessions();
                      onSessionsChanged?.();
                    }}
                  />
                );
              }
              return (
                <Stack
                  key={s.id}
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  alignItems={{ sm: 'center' }}
                  sx={{
                    p: 1.5,
                    borderRadius: '12px',
                    border: `1px solid ${mine ? alpha(brand.success, 0.5) : alpha(brand.primary, 0.12)}`,
                    bgcolor: mine ? alpha(brand.success, 0.05) : 'transparent',
                  }}
                  data-testid={`session-row-${s.id}`}
                >
                  <Box sx={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => navigate(`/achievements/session/${s.id}`)}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {s.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {[time(s.startTime) && `${day(s.startTime)}, ${time(s.startTime)}–${time(s.endTime)}`, s.room, s.type].filter(Boolean).join(' · ')}
                      {s.requiresStamp ? ' · ⭐ stamp' : ''}
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                      <GroupsRoundedIcon sx={{ fontSize: 15, color: going ? brand.primary : 'text.disabled' }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: going ? brand.primary : 'text.secondary' }}>
                        {going ? `${going} going` : 'No one yet'}
                      </Typography>
                    </Stack>
                  </Box>
                  {isAdmin && user && (
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                      {confirmDelete === s.id ? (
                        <>
                          <Typography variant="caption" color="error">
                            Delete this session?
                          </Typography>
                          <Button size="small" color="error" variant="contained" onClick={() => void remove(s.id)}>
                            Delete
                          </Button>
                          <Button size="small" onClick={() => setConfirmDelete(null)}>
                            Keep
                          </Button>
                        </>
                      ) : (
                        <>
                          <Tooltip title="Edit session">
                            <IconButton size="small" aria-label={`Edit ${s.title}`} onClick={() => setEditing(s.id)}>
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete session">
                            <IconButton size="small" color="error" aria-label={`Delete ${s.title}`} onClick={() => setConfirmDelete(s.id)}>
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Stack>
                  )}
                  {picks.canPick && (
                    <Button
                      size="small"
                      variant={mine ? 'contained' : 'outlined'}
                      color={mine ? 'success' : 'primary'}
                      startIcon={mine ? <EventAvailableRoundedIcon /> : <AddRoundedIcon />}
                      disabled={picks.busy === s.id}
                      onClick={() => void picks.toggle(s.id)}
                      sx={{ borderRadius: '10px', whiteSpace: 'nowrap', alignSelf: { xs: 'flex-start', sm: 'center' }, ...(mine ? { backgroundImage: 'none' } : {}) }}
                    >
                      {mine ? 'Going ✓' : "I'll attend"}
                    </Button>
                  )}
                </Stack>
              );
            })}
          </Stack>
        </>
      )}
    </Box>
  );
}
