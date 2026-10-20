import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import PlaceIcon from '@mui/icons-material/PlaceRounded';
import AccessTimeIcon from '@mui/icons-material/AccessTimeRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined';
import type { Session } from '../types/session';
import type { Speaker } from '../types/speaker';
import { imageSrc } from '../utils/imageUrl';

function formatMonthDay(iso: string): { month: string; day: string } {
  const d = new Date(iso);
  const month = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'Asia/Manila' }).toUpperCase();
  const day = d.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'Asia/Manila' });
  return { month, day };
}

function formatTimeOnly(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' });
}

interface SessionCardProps {
  session: Session;
  hasStamp?: boolean;
  stampStatus?: 'pending' | 'approved';
  speakers?: Speaker[];
  onClick?: () => void;
  /** People who picked this session. */
  goingCount?: number;
  /** Whether the viewer picked this session. */
  attending?: boolean;
  /** Registered attendees can pick sessions; omitted = no button. */
  onToggleAttend?: () => void;
  attendBusy?: boolean;
}

export default function SessionCard({
  session,
  hasStamp = false,
  stampStatus,
  speakers,
  onClick,
  goingCount = 0,
  attending = false,
  onToggleAttend,
  attendBusy = false,
}: SessionCardProps) {
  const coverImage = session.imageUrl || '';
  const { month, day } = formatMonthDay(session.startTime);
  const sessionTime = formatTimeOnly(session.startTime);
  const isApproved = stampStatus === 'approved';
  const isPending = stampStatus === 'pending';

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        position: 'relative',
        borderRadius: '15px',
        overflow: 'hidden',
        transition: 'all 0.25s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 12px 28px rgba(123, 45, 142, 0.15)',
        },
      }}
    >
      <CardActionArea onClick={onClick} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
        {/* Cover Image Header with Badges */}
        <Box sx={{ position: 'relative', height: 140, width: '100%', overflow: 'hidden', bgcolor: 'rgba(123, 45, 142, 0.05)' }}>
          {coverImage ? (
            <Box
              component="img"
              src={coverImage}
              alt={session.title}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                color: 'text.secondary',
              }}
            >
              <ImageNotSupportedOutlinedIcon sx={{ fontSize: 28, opacity: 0.4 }} />
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.65rem', opacity: 0.7 }}
              >
                No image
              </Typography>
            </Box>
          )}

          {/* Overlay Date Badge (Top Left) */}
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
              {day}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#1A0A2E', display: 'block', fontSize: '0.65rem', lineHeight: 1.1 }}>
              {month}
            </Typography>
          </Box>

        </Box>

        {/* Card Body */}
        <CardContent sx={{ p: 2, pb: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '1rem', mb: 1, lineHeight: 1.3 }}>
            {session.title}
          </Typography>

          {/* Speakers + how many picked this session */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.2 }}>
            {speakers && speakers.length > 0 && (
              <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 22, height: 22, fontSize: '0.65rem' } }}>
                {speakers.map((s) => (
                  <Avatar key={s.id} src={imageSrc(s.avatarUrl)} alt={s.name}>
                    {s.name.charAt(0)}
                  </Avatar>
                ))}
              </AvatarGroup>
            )}
            <GroupsRoundedIcon sx={{ fontSize: 16, color: goingCount ? '#EF4444' : '#9CA3AF' }} />
            <Typography
              variant="caption"
              sx={{ color: goingCount ? '#EF4444' : '#6B7280', fontWeight: 700, fontSize: '0.75rem' }}
              data-testid="session-going"
            >
              {goingCount ? `${goingCount} going` : 'No one has picked this yet'}
            </Typography>
          </Stack>

          {/* Venue & Time Row */}
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 2 }}>
            <AccessTimeIcon sx={{ fontSize: 16, color: '#9CA3AF' }} />
            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500, fontSize: '0.75rem', mr: 1.5 }}>
              {sessionTime}
            </Typography>
            <PlaceIcon sx={{ fontSize: 16, color: '#9CA3AF' }} />
            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500, fontSize: '0.75rem' }}>
              {session.room}
            </Typography>
          </Stack>

          {/* Full-Width Action Button / Status Pill */}
          {session.requiresStamp && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.75,
                textAlign: 'center',
                borderRadius: '24px',
                py: 1,
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                background: isApproved
                  ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                  : isPending
                  ? 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)'
                  : 'linear-gradient(135deg, #7B2D8E 0%, #A855C8 100%)',
                color: '#fff',
              }}
            >
              {isApproved ? (
                <CheckCircleRoundedIcon fontSize="small" />
              ) : isPending ? (
                <HourglassTopRoundedIcon fontSize="small" />
              ) : null}
              {isApproved
                ? 'STAMP VERIFIED ✓'
                : isPending
                ? 'PENDING OFFICER APPROVAL'
                : hasStamp
                ? 'STAMP CLAIMED'
                : 'CLAIM SESSION STAMP'}
            </Box>
          )}
        </CardContent>
      </CardActionArea>

      {/* Pick / unpick this session (outside the clickable card) */}
      {onToggleAttend && (
        <Tooltip title={attending ? "You're going - tap to remove it from your plan" : 'Add to my sessions'}>
          <IconButton
            size="small"
            aria-label={attending ? `Remove ${session.title} from my sessions` : `I'll attend ${session.title}`}
            aria-pressed={attending}
            disabled={attendBusy}
            onClick={onToggleAttend}
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              bgcolor: attending ? '#10B981' : 'rgba(255, 255, 255, 0.92)',
              color: attending ? '#fff' : '#7B2D8E',
              width: 32,
              height: 32,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              '&:hover': { bgcolor: attending ? '#059669' : '#fff' },
            }}
          >
            {attending ? <EventAvailableRoundedIcon sx={{ fontSize: 18 }} /> : <AddRoundedIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </Tooltip>
      )}
    </Card>
  );
}
