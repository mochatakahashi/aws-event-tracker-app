import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import AccessTimeIcon from '@mui/icons-material/AccessTimeRounded';
import PlaceIcon from '@mui/icons-material/PlaceRounded';
import type { Session } from '../types/session';
import type { Speaker } from '../types/speaker';
import Avatar from '@mui/material/Avatar';
import StampBadge from './StampBadge';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

const typeColors: Record<string, { bg: string; text: string }> = {
  keynote: { bg: '#EDE9FE', text: '#6D28D9' },
  talk: { bg: '#F3E8FF', text: '#7C3AED' },
  workshop: { bg: '#ECFDF5', text: '#059669' },
  break: { bg: '#FEF3C7', text: '#D97706' },
  networking: { bg: '#DBEAFE', text: '#2563EB' },
  panel: { bg: '#FDF2F8', text: '#DB2777' },
};

interface SessionCardProps {
  session: Session;
  hasStamp?: boolean;
  stampStatus?: 'pending' | 'approved';
  speakers?: Speaker[];
  onClick?: () => void;
}

export default function SessionCard({
  session,
  hasStamp = false,
  stampStatus,
  speakers,
  onClick,
}: SessionCardProps) {
  const colors = typeColors[session.type] ?? typeColors.talk;

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1.5,
        opacity: session.status === 'completed' ? 0.85 : 1,
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {/* Stamp indicator */}
      {session.requiresStamp && (
        <Box sx={{ position: 'absolute', top: -8, right: -8, zIndex: 1 }}>
          <StampBadge
            earned={hasStamp}
            status={stampStatus}
          />
        </Box>
      )}

      <CardActionArea onClick={onClick} sx={{ p: 0 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 600, pr: session.requiresStamp ? 3 : 0 }}>
            {session.title}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
            <Chip
              icon={<AccessTimeIcon sx={{ fontSize: 16 }} />}
              label={`${formatTime(session.startTime)} → ${formatTime(session.endTime)}`}
              size="small"
              variant="outlined"
              sx={{ borderRadius: 20, fontSize: '0.8rem' }}
            />
            <Chip
              icon={<PlaceIcon sx={{ fontSize: 16 }} />}
              label={session.room}
              size="small"
              variant="outlined"
              sx={{ borderRadius: 20, fontSize: '0.8rem' }}
            />
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={session.type.charAt(0).toUpperCase() + session.type.slice(1)}
              size="small"
              sx={{
                backgroundColor: colors.bg,
                color: colors.text,
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            />
            {session.status !== 'not-started' && (
              <Chip
                label={session.status === 'ongoing' ? 'In Progress' : 'Completed'}
                size="small"
                sx={{
                  backgroundColor: session.status === 'ongoing' ? '#FEF3C7' : '#ECFDF5',
                  color: session.status === 'ongoing' ? '#D97706' : '#059669',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                }}
              />
            )}
          </Stack>

          {speakers && speakers.length > 0 && (
            <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                {speakers.map((s) => (
                  <Stack key={s.id} direction="row" spacing={0.5} alignItems="center">
                    <Avatar sx={{ width: 20, height: 20, fontSize: '0.6rem' }} src={s.avatarUrl}>
                      {s.name.charAt(0)}
                    </Avatar>
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      {s.name}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
