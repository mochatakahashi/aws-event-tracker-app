import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';
import PlaceIcon from '@mui/icons-material/PlaceRounded';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { getSessionsByEvent, getStampsByAttendee, createStamp } from '../services/sessionService';
import type { Session, Stamp } from '../types/session';

interface EventStampCardProps {
  /** Optional custom title header */
  title?: string;
  /** Whether to show sessions that don't require stamps as well, or only stamp sessions */
  filterStampSessionsOnly?: boolean;
}

export default function EventStampCard({
  title = 'OFFICIAL EVENT STAMP PASSPORT',
  filterStampSessionsOnly = true,
}: EventStampCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedEvent } = useEvent();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingSessionId, setRequestingSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedEvent) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      getSessionsByEvent(selectedEvent.id),
      user?.personId ? getStampsByAttendee(user.personId) : Promise.resolve([]),
    ])
      .then(([sess, stmps]) => {
        setSessions(sess);
        setStamps(stmps);
      })
      .finally(() => setLoading(false));
  }, [selectedEvent, user?.personId]);

  if (!selectedEvent) return null;

  if (loading) {
    return (
      <Card variant="outlined" sx={{ p: 3, textAlign: 'center', mb: 3 }}>
        <CircularProgress size={32} />
      </Card>
    );
  }

  // Filter stamp-eligible sessions
  const displaySessions = filterStampSessionsOnly
    ? sessions.filter((s) => s.requiresStamp)
    : sessions;

  // Compute approval stats
  const totalStampSlots = displaySessions.length;
  const approvedStamps = stamps.filter((st) =>
    displaySessions.some((s) => s.id === st.sessionId) && st.status === 'approved'
  );
  const pendingStamps = stamps.filter((st) =>
    displaySessions.some((s) => s.id === st.sessionId) && st.status === 'pending'
  );

  const approvedCount = approvedStamps.length;
  const pendingCount = pendingStamps.length;
  const progressPercent = totalStampSlots > 0 ? (approvedCount / totalStampSlots) * 100 : 0;
  const isComplete = totalStampSlots > 0 && approvedCount === totalStampSlots;

  async function handleQuickRequestStamp(sessionId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!user?.personId) return;
    setRequestingSessionId(sessionId);
    try {
      const newStamp = await createStamp({
        sessionId,
        attendeeId: user.personId,
        status: 'pending',
      });
      setStamps((prev) => [...prev, newStamp]);
    } catch (err) {
      console.error(err);
    } finally {
      setRequestingSessionId(null);
    }
  }

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 3,
        borderRadius: '15px',
        overflow: 'hidden',
        border: `1.5px solid ${isComplete ? '#10B981' : alpha(brand.primary, 0.2)}`,
        boxShadow: isComplete
          ? `0 8px 32px ${alpha('#10B981', 0.2)}`
          : `0 8px 24px ${alpha(brand.primary, 0.08)}`,
      }}
    >
      {/* Passport Header Banner */}
      <Box
        sx={{
          background: isComplete
            ? 'linear-gradient(135deg, #059669 0%, #10B981 50%, #34D399 100%)'
            : brand.gradientDark,
          color: '#fff',
          p: { xs: 2.5, sm: 3 },
          position: 'relative',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <WorkspacePremiumRoundedIcon sx={{ color: brand.accent, fontSize: 20 }} />
              <Typography
                variant="caption"
                sx={{
                  color: isComplete ? '#ECFDF5' : brand.accent,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  fontSize: '0.7rem',
                }}
              >
                {title}
              </Typography>
            </Stack>
            <Typography variant="h3" sx={{ color: '#fff', fontWeight: 800, lineHeight: 1.2 }}>
              {selectedEvent.title}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5, display: 'block' }}
            >
              Attendee: <strong>{user?.name}</strong> {user?.studentId ? `(${user.studentId})` : ''}
            </Typography>
          </Box>

          {isComplete ? (
            <Chip
              icon={<EmojiEventsRoundedIcon sx={{ color: '#fff !important' }} />}
              label="PASSPORT COMPLETED 🎉"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.75rem',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.4)',
              }}
            />
          ) : (
            <Chip
              label={`${approvedCount}/${totalStampSlots} STAMPS`}
              sx={{
                bgcolor: alpha('#fff', 0.15),
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.75rem',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            />
          )}
        </Stack>

        {/* Multi-Segment Status Progress Bar (Matches mockups in screenshot) */}
        <Box sx={{ mt: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.75rem', fontWeight: 600 }}>
              PASSPORT STATUS DISTRIBUTION
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#fff' }}>
              {Math.round(progressPercent)}% Approved
            </Typography>
          </Stack>

          {/* Segmented Stacked Bar */}
          <Box
            sx={{
              height: 10,
              borderRadius: 5,
              width: '100%',
              bgcolor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              overflow: 'hidden',
              mb: 1.5,
            }}
          >
            <Box
              sx={{
                width: `${progressPercent}%`,
                bgcolor: '#10B981',
                transition: 'width 0.5s ease',
              }}
            />
            <Box
              sx={{
                width: `${totalStampSlots > 0 ? (pendingCount / totalStampSlots) * 100 : 0}%`,
                bgcolor: '#F59E0B',
                transition: 'width 0.5s ease',
              }}
            />
          </Box>

          {/* Status Breakdown Pills Row */}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Box
              sx={{
                flex: 1,
                minWidth: 80,
                p: 0.8,
                px: 1.2,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="caption" sx={{ color: '#A7F3D0', fontWeight: 700, fontSize: '0.7rem' }}>
                Approved
              </Typography>
              <Typography variant="caption" sx={{ color: '#fff', fontWeight: 800, fontSize: '0.75rem' }}>
                {totalStampSlots > 0 ? Math.round((approvedCount / totalStampSlots) * 100) : 0}%
              </Typography>
            </Box>

            <Box
              sx={{
                flex: 1,
                minWidth: 80,
                p: 0.8,
                px: 1.2,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              <Typography variant="caption" sx={{ color: '#FDE68A', fontWeight: 700, fontSize: '0.7rem' }}>
                Pending
              </Typography>
              <Typography variant="caption" sx={{ color: '#fff', fontWeight: 800, fontSize: '0.75rem' }}>
                {totalStampSlots > 0 ? Math.round((pendingCount / totalStampSlots) * 100) : 0}%
              </Typography>
            </Box>

            <Box
              sx={{
                flex: 1,
                minWidth: 80,
                p: 0.8,
                px: 1.2,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: '0.7rem' }}>
                Unclaimed
              </Typography>
              <Typography variant="caption" sx={{ color: '#fff', fontWeight: 800, fontSize: '0.75rem' }}>
                {totalStampSlots > 0
                  ? Math.max(
                      0,
                      100 -
                        Math.round((approvedCount / totalStampSlots) * 100) -
                        Math.round((pendingCount / totalStampSlots) * 100)
                    )
                  : 0}
                %
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* Circle Stamp Slots Grid */}
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Typography
          variant="h6"
          sx={{ color: brand.primary, fontSize: '0.75rem', mb: 2, letterSpacing: '0.05em' }}
        >
          EVENT SESSION STAMP SLOTS ({displaySessions.length})
        </Typography>

        {totalStampSlots === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            No stamp-required sessions for this event yet.
          </Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 2,
            }}
          >
            {displaySessions.map((session, index) => {
              const stamp = stamps.find((s) => s.sessionId === session.id);
              const isApproved = stamp?.status === 'approved';
              const isPending = stamp?.status === 'pending';
              const coverImage =
                session.type === 'workshop'
                  ? 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80'
                  : session.type === 'keynote'
                  ? 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80'
                  : 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=600&q=80';

              return (
                <Card
                  key={session.id}
                  variant="outlined"
                  onClick={() => navigate(`/achievements/session/${session.id}`)}
                  sx={{
                    borderRadius: '15px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    borderColor: isApproved
                      ? '#10B981'
                      : isPending
                      ? '#6366F1'
                      : alpha(brand.primary, 0.15),
                    transition: 'all 0.25s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: `0 8px 25px ${alpha(brand.primary, 0.15)}`,
                    },
                  }}
                >
                  {/* Image Header with Badges */}
                  <Box sx={{ position: 'relative', height: 130, width: '100%' }}>
                    <Box
                      component="img"
                      src={coverImage}
                      alt={session.title}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />

                    {/* Date Badge Overlay */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        bgcolor: 'rgba(255, 255, 255, 0.92)',
                        backdropFilter: 'blur(6px)',
                        borderRadius: '10px',
                        px: 1.2,
                        py: 0.4,
                        textAlign: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#EF4444', display: 'block', fontSize: '0.65rem', lineHeight: 1.1 }}>
                        10
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#1A0A2E', display: 'block', fontSize: '0.65rem', lineHeight: 1.1 }}>
                        OCT
                      </Typography>
                    </Box>

                    {/* Slot Badge Overlay */}
                    <Chip
                      label={`SLOT #${index + 1}`}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        bgcolor: 'rgba(255, 255, 255, 0.92)',
                        backdropFilter: 'blur(6px)',
                        fontWeight: 800,
                        fontSize: '0.65rem',
                        color: brand.primary,
                        height: 24,
                      }}
                    />
                  </Box>

                  {/* Card Content Body */}
                  <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        lineHeight: 1.3,
                        mb: 1,
                        color: brand.textPrimary,
                      }}
                    >
                      {session.title}
                    </Typography>

                    {/* Attendees Stack */}
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 20, height: 20, fontSize: '0.6rem' } }}>
                        <Avatar src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" />
                        <Avatar src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" />
                      </AvatarGroup>
                      <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 700, fontSize: '0.72rem' }}>
                        +12 Going
                      </Typography>
                    </Stack>

                    {/* Venue Line */}
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 2 }}>
                      <PlaceIcon sx={{ fontSize: 15, color: '#9CA3AF' }} />
                      <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.75rem', fontWeight: 500 }}>
                        {session.room}
                      </Typography>
                    </Stack>

                    {/* Full-Width Action Pill Button */}
                    <Box sx={{ mt: 'auto' }}>
                      {isApproved ? (
                        <Button
                          fullWidth
                          size="small"
                          variant="contained"
                          startIcon={<CheckCircleRoundedIcon fontSize="small" />}
                          sx={{
                            borderRadius: '24px',
                            py: 0.8,
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            color: '#fff',
                          }}
                        >
                          STAMP APPROVED ✓
                        </Button>
                      ) : isPending ? (
                        <Button
                          fullWidth
                          size="small"
                          variant="contained"
                          startIcon={<HourglassTopRoundedIcon fontSize="small" />}
                          sx={{
                            borderRadius: '24px',
                            py: 0.8,
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                            color: '#fff',
                            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                          }}
                        >
                          PENDING OFFICER APPROVAL
                        </Button>
                      ) : (
                        <Button
                          fullWidth
                          size="small"
                          variant="contained"
                          disabled={requestingSessionId === session.id}
                          onClick={(e) => handleQuickRequestStamp(session.id, e)}
                          sx={{
                            borderRadius: '24px',
                            py: 0.8,
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            background: brand.gradient,
                            color: '#fff',
                          }}
                        >
                          {requestingSessionId === session.id ? 'REQUESTING...' : 'CLAIM STAMP'}
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}

        {/* Footer legend */}
        <Divider sx={{ my: 2.5 }} />
        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
        >
          <Stack direction="row" alignItems="center" spacing={0.8}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: '#10B981',
              }}
            />
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
              Approved Stamp
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.8}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: '#F59E0B',
              }}
            />
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
              Pending Review
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.8}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                border: `2px dashed ${brand.primary}`,
              }}
            />
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
              Unclaimed Slot
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
