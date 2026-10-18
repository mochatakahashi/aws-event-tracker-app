import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import LeaderboardRoundedIcon from '@mui/icons-material/LeaderboardRounded';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { useBoardData } from '../hooks/useBoardData';
import { BADGES } from '../utils/badges';
import { attendeeBoard, officerBoard } from '../utils/leaderboard';

function Standing({ label, rank, of, points, onOpen }: { label: string; rank: number; of: number; points: number; onOpen: () => void }) {
  return (
    <Box
      onClick={onOpen}
      role="button"
      sx={{
        flex: 1,
        minWidth: 150,
        p: 1.75,
        borderRadius: '14px',
        cursor: 'pointer',
        bgcolor: alpha(brand.primary, 0.05),
        border: `1px solid ${alpha(brand.primary, 0.12)}`,
        '&:hover': { bgcolor: alpha(brand.primary, 0.09) },
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={2} alignItems="baseline">
        <Typography variant="h2" sx={{ fontWeight: 800, color: brand.primary }}>
          #{rank}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          of {of} · <strong>{points}</strong> pts
        </Typography>
      </Stack>
    </Box>
  );
}

/** "Your standing" on the leaderboard(s) and the badge collection, shown on Achievements. */
export default function MyStandingCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading } = useBoardData();

  const attendees = useMemo(() => (data ? attendeeBoard(data) : []), [data]);
  const officers = useMemo(() => (data && user?.role === 'officer' ? officerBoard(data) : []), [data, user?.role]);
  if (!user || user.role === 'admin') return null;

  const meA = attendees.find((r) => r.personId === user.personId);
  const meO = officers.find((r) => r.personId === user.personId);
  const myBadges = meA?.badges ?? [];

  return (
    <Paper sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: '20px', mb: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Your standing
        </Typography>
        <Button size="small" startIcon={<LeaderboardRoundedIcon />} onClick={() => navigate('/leaderboard')}>
          Leaderboard
        </Button>
      </Stack>

      {loading ? (
        <Skeleton variant="rounded" height={84} sx={{ borderRadius: '14px' }} />
      ) : (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          {meA && <Standing label="AS AN ATTENDEE" rank={meA.rank} of={attendees.length} points={meA.points} onOpen={() => navigate('/leaderboard')} />}
          {meO && (
            <Standing
              label="AS AN OFFICER"
              rank={meO.rank}
              of={officers.length}
              points={meO.points}
              onOpen={() => navigate('/leaderboard?board=officers')}
            />
          )}
        </Stack>
      )}

      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mt: 2.5 }}>
        My badges · {myBadges.length}/{BADGES.length}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 1, mt: 1 }}>
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
