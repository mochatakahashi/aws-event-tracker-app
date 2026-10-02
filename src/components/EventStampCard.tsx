import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import StarsRoundedIcon from '@mui/icons-material/StarsRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';
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
        borderRadius: 4,
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

        {/* Progress Bar inside banner */}
        <Box sx={{ mt: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.75rem' }}>
              {isComplete
                ? 'All required session stamps verified by officers!'
                : `${approvedCount} approved · ${pendingCount} pending officer review`}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#fff' }}>
              {Math.round(progressPercent)}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(255,255,255,0.2)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: isComplete ? '#FBBF24' : '#C084FC',
              },
            }}
          />
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

              return (
                <Box
                  key={session.id}
                  onClick={() => navigate(`/achievements/session/${session.id}`)}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    border: '1.5px solid',
                    borderColor: isApproved
                      ? '#10B981'
                      : isPending
                      ? '#F59E0B'
                      : alpha(brand.primary, 0.15),
                    backgroundColor: isApproved
                      ? alpha('#10B981', 0.04)
                      : isPending
                      ? alpha('#F59E0B', 0.04)
                      : brand.surface,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease-in-out',
                    position: 'relative',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      borderColor: isApproved ? '#059669' : brand.primary,
                      boxShadow: `0 6px 20px ${alpha(
                        isApproved ? '#10B981' : brand.primary,
                        0.15
                      )}`,
                    },
                  }}
                >
                  {/* Slot Number Badge */}
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 12,
                      fontWeight: 700,
                      color: brand.textSecondary,
                      fontSize: '0.65rem',
                    }}
                  >
                    SLOT #{index + 1}
                  </Typography>

                  {/* AUTOMATIC CIRCLE STAMP EMBLEM */}
                  <Box sx={{ mt: 1, mb: 1.5, position: 'relative' }}>
                    {isApproved ? (
                      /* APPROVED CIRCLE */
                      <Tooltip title={`Approved Stamp #${index + 1}! Verified by Officer.`}>
                        <Box
                          sx={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            border: '3px solid #D1FAE5',
                            boxShadow: `0 4px 14px ${alpha('#10B981', 0.4)}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                          }}
                        >
                          <VerifiedRoundedIcon sx={{ fontSize: 34 }} />
                        </Box>
                      </Tooltip>
                    ) : isPending ? (
                      /* PENDING CIRCLE */
                      <Tooltip title="Stamp Request Pending Officer Review">
                        <Box
                          sx={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)',
                            border: '3px solid #FEF3C7',
                            boxShadow: `0 4px 14px ${alpha('#F59E0B', 0.35)}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            animation: 'pulse 1.8s infinite',
                            '@keyframes pulse': {
                              '0%, 100%': { transform: 'scale(1)' },
                              '50%': { transform: 'scale(1.06)' },
                            },
                          }}
                        >
                          <HourglassTopRoundedIcon sx={{ fontSize: 32 }} />
                        </Box>
                      </Tooltip>
                    ) : (
                      /* UNCLAIMED CIRCLE */
                      <Tooltip title="Unclaimed Stamp — Click to complete session activity & request stamp!">
                        <Box
                          sx={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            backgroundColor: alpha(brand.primary, 0.05),
                            border: `2px dashed ${alpha(brand.primary, 0.35)}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: alpha(brand.primary, 0.4),
                          }}
                        >
                          <StarsRoundedIcon sx={{ fontSize: 30 }} />
                        </Box>
                      </Tooltip>
                    )}
                  </Box>

                  {/* Session Title & Room */}
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      lineHeight: 1.3,
                      mb: 0.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {session.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: '0.7rem', mb: 1.5 }}
                  >
                    📍 {session.room}
                  </Typography>

                  {/* Circle Stamp Status Badge / Action Button */}
                  <Box sx={{ width: '100%', mt: 'auto' }}>
                    {isApproved ? (
                      <Chip
                        icon={<CheckCircleRoundedIcon sx={{ color: '#059669 !important', fontSize: 16 }} />}
                        label="STAMP APPROVED"
                        size="small"
                        sx={{
                          width: '100%',
                          backgroundColor: '#D1FAE5',
                          color: '#047857',
                          fontWeight: 700,
                          fontSize: '0.68rem',
                        }}
                      />
                    ) : isPending ? (
                      <Chip
                        icon={<HourglassTopRoundedIcon sx={{ color: '#D97706 !important', fontSize: 16 }} />}
                        label="PENDING OFFICER APPROVAL"
                        size="small"
                        sx={{
                          width: '100%',
                          backgroundColor: '#FEF3C7',
                          color: '#B45309',
                          fontWeight: 700,
                          fontSize: '0.65rem',
                        }}
                      />
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={requestingSessionId === session.id}
                        onClick={(e) => handleQuickRequestStamp(session.id, e)}
                        sx={{
                          width: '100%',
                          py: 0.5,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          borderColor: alpha(brand.primary, 0.4),
                          color: brand.primary,
                        }}
                      >
                        {requestingSessionId === session.id ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : (
                          'Request Stamp'
                        )}
                      </Button>
                    )}
                  </Box>
                </Box>
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
