import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import StarsRoundedIcon from '@mui/icons-material/StarsRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import type { Session, Stamp } from '../types/session';

interface EngagementScoreCardProps {
  sessions: Session[];
  stamps: Stamp[];
}

export default function EngagementScoreCard({ sessions, stamps }: EngagementScoreCardProps) {
  const stampSessions = sessions.filter((s) => s.requiresStamp);
  const totalSlots = stampSessions.length;

  const approvedCount = stamps.filter(
    (st) => stampSessions.some((s) => s.id === st.sessionId) && st.status === 'approved'
  ).length;

  const pendingCount = stamps.filter(
    (st) => stampSessions.some((s) => s.id === st.sessionId) && st.status === 'pending'
  ).length;

  const unclaimedCount = Math.max(0, totalSlots - approvedCount - pendingCount);

  // Engagement Score calculation
  const totalSessionsCount = sessions.length;
  const completionPercentage = totalSlots > 0 ? Math.round((approvedCount / totalSlots) * 100) : 0;

  // Circular Ring parameters
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  return (
    <Card
      sx={{
        mb: 3,
        borderRadius: '15px',
        background: brand.surface,
        boxShadow: `0 10px 30px ${alpha(brand.primary, 0.08)}`,
        border: `1px solid ${alpha(brand.primary, 0.12)}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            fontSize: '1.25rem',
            color: brand.textPrimary,
            mb: 2.5,
            textAlign: { xs: 'center', sm: 'left' },
          }}
        >
          Engagement Score
        </Typography>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems="center"
          justifyContent="space-around"
          spacing={3}
        >
          {/* Left / Main Ring Meter */}
          <Box
            sx={{
              position: 'relative',
              width: size,
              height: size,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
              {/* Background Ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={alpha(brand.primary, 0.08)}
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Progress Ring Gradient */}
              <defs>
                <linearGradient id="engagementGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7B2D8E" />
                  <stop offset="50%" stopColor="#A855C8" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
              {/* Animated Stroke Circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="url(#engagementGradient)"
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 1s ease-in-out',
                }}
              />
            </svg>

            {/* Center Label */}
            <Box
              sx={{
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <Typography
                variant="h1"
                sx={{
                  fontWeight: 900,
                  fontSize: '2.5rem',
                  lineHeight: 1,
                  color: brand.textPrimary,
                }}
              >
                {totalSessionsCount}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  color: brand.textSecondary,
                  letterSpacing: '0.1em',
                  fontSize: '0.7rem',
                  mt: 0.5,
                }}
              >
                SESSIONS
              </Typography>
            </Box>
          </Box>

          {/* Right / Breakdown Pill Widgets */}
          <Box sx={{ width: '100%', flex: 1 }}>
            <Stack spacing={1.5}>
              {/* Stamp Status Chips */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap">
                <Chip
                  icon={<StarsRoundedIcon sx={{ color: '#10B981 !important' }} />}
                  label={`Stamp ${approvedCount}/${totalSlots}`}
                  sx={{
                    flex: 1,
                    py: 2.5,
                    px: 1,
                    borderRadius: 3,
                    bgcolor: alpha('#10B981', 0.1),
                    color: '#065F46',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    justifyContent: 'flex-start',
                    border: `1px solid ${alpha('#10B981', 0.2)}`,
                  }}
                />
                <Chip
                  icon={<AccessTimeRoundedIcon sx={{ color: '#F59E0B !important' }} />}
                  label={`${pendingCount} Pending Review`}
                  sx={{
                    flex: 1,
                    py: 2.5,
                    px: 1,
                    borderRadius: 3,
                    bgcolor: alpha('#F59E0B', 0.1),
                    color: '#92400E',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    justifyContent: 'flex-start',
                    border: `1px solid ${alpha('#F59E0B', 0.2)}`,
                  }}
                />
                <Chip
                  icon={<GroupOutlinedIcon sx={{ color: brand.textSecondary }} />}
                  label={`${unclaimedCount} Unclaimed Slot${unclaimedCount === 1 ? '' : 's'}`}
                  sx={{
                    flex: 1,
                    py: 2.5,
                    px: 1,
                    borderRadius: 3,
                    bgcolor: alpha(brand.textSecondary, 0.08),
                    color: brand.textPrimary,
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    justifyContent: 'flex-start',
                    border: `1px solid ${alpha(brand.textSecondary, 0.15)}`,
                  }}
                />
              </Stack>

              {/* Sub-Metrics Cards Grid (Fitness tracker style breakdown) */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 1.5,
                  mt: 1,
                }}
              >
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    bgcolor: alpha(brand.primary, 0.04),
                    border: `1px solid ${alpha(brand.primary, 0.08)}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <CheckCircleOutlineRoundedIcon sx={{ color: brand.primary, fontSize: 24 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>
                      {approvedCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: brand.textSecondary, fontSize: '0.7rem' }}>
                      Verified Stamps
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    bgcolor: alpha(brand.accent, 0.06),
                    border: `1px solid ${alpha(brand.accent, 0.15)}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <StarsRoundedIcon sx={{ color: brand.primaryLight, fontSize: 24 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>
                      {completionPercentage}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: brand.textSecondary, fontSize: '0.7rem' }}>
                      Passport Progress
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
