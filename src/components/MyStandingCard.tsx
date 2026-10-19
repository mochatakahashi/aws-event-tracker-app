import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { useBoardData } from '../hooks/useBoardData';
import { BADGES } from '../utils/badges';
import { attendeeBoard, officerBoard } from '../utils/leaderboard';
import OfficerBadgeGrid from './OfficerBadgeGrid';
import { AUTO_OFFICER_BADGES, AWARD_BADGES } from '../utils/officerBadges';

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <Box sx={{ flex: 1, minWidth: 100, p: 1.5, borderRadius: '14px', bgcolor: alpha(brand.primary, 0.05), textAlign: 'center' }}>
      <Typography variant="h3" sx={{ fontWeight: 800, color: brand.primary }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

/** Your own achievement stats (as attendee and officer) and badges - no rankings. */
export default function MyStandingCard() {
  const { user } = useAuth();
  const { data, loading } = useBoardData();

  const attendees = useMemo(() => (data ? attendeeBoard(data) : []), [data]);
  const officers = useMemo(() => (data && user?.role === 'officer' ? officerBoard(data) : []), [data, user?.role]);
  if (!user || user.role === 'admin') return null;

  const meA = attendees.find((r) => r.personId === user.personId);
  const meO = officers.find((r) => r.personId === user.personId);
  const myBadges = meA?.badges ?? [];

  return (
    <Paper sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: '20px', mb: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5 }}>
        My progress
      </Typography>

      {loading ? (
        <Skeleton variant="rounded" height={84} sx={{ borderRadius: '14px' }} />
      ) : (
        <>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Stat value={meA?.stamps ?? 0} label="stamps" />
            <Stat value={meA?.workshops ?? 0} label="workshops" />
            <Stat value={meA?.checkIns ?? 0} label="events attended" />
          </Stack>
          {meO && (
            <>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mt: 2 }}>
                As an officer
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Stat value={meO.stampsApproved} label="stamps approved" />
                <Stat value={meO.checkInsDone} label="check-ins done" />
                <Stat value={meO.tasksDone} label={`of ${meO.tasksAssigned} tasks done`} />
                <Stat value={meO.eventsVolunteered} label="events volunteered" />
              </Stack>
            </>
          )}
        </>
      )}

      {meO && (
        <>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mt: 2.5 }}>
            My officer badges · {meO.badges.filter((b) => !b.badge.awarded).length}/{AUTO_OFFICER_BADGES.length} earned
            {meO.badges.some((b) => b.badge.awarded) ? ` · ${meO.badges.filter((b) => b.badge.awarded).length}/${AWARD_BADGES.length} awarded` : ''}
          </Typography>
          <OfficerBadgeGrid earned={meO.badges} />
        </>
      )}

      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mt: 2.5 }}>
        {meO ? 'My attendee badges' : 'My badges'} · {myBadges.length}/{BADGES.length}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 1, mt: 1 }}>
        {BADGES.map((b) => {
          const earned = myBadges.includes(b.id);
          return (
            <Stack
              key={b.id}
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{
                p: 1.25,
                borderRadius: '12px',
                bgcolor: earned ? alpha(brand.success, 0.08) : alpha('#000', 0.03),
                opacity: earned ? 1 : 0.55,
              }}
            >
              <Box sx={{ fontSize: 24, filter: earned ? 'none' : 'grayscale(1)' }} aria-hidden>
                {b.emoji}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {b.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {b.description}
                </Typography>
              </Box>
              {earned && <Chip size="small" color="success" label="Earned" />}
            </Stack>
          );
        })}
      </Box>
    </Paper>
  );
}
