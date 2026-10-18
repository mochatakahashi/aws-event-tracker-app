import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { OFFICER_BADGES, type EarnedOfficerBadge } from '../utils/officerBadges';

/** Officer badges: automatic ones first, then the ones an admin gives. */
export default function OfficerBadgeGrid({ earned, onlyEarned = false }: { earned: EarnedOfficerBadge[]; onlyEarned?: boolean }) {
  const byId = new Map(earned.map((e) => [e.badge.id, e]));
  const list = onlyEarned ? OFFICER_BADGES.filter((b) => byId.has(b.id)) : OFFICER_BADGES;
  if (list.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        No officer badges yet.
      </Typography>
    );
  }
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
        gap: 1,
        mt: 1,
      }}
      data-testid="officer-badges"
    >
      {list.map((b) => {
        const got = byId.get(b.id);
        return (
          <Stack
            key={b.id}
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{
              p: 1.25,
              borderRadius: '12px',
              bgcolor: got ? alpha(b.awarded ? brand.primary : brand.success, 0.08) : alpha('#000', 0.03),
              opacity: got ? 1 : 0.55,
            }}
          >
            <Box sx={{ fontSize: 24, filter: got ? 'none' : 'grayscale(1)' }} aria-hidden>
              {b.emoji}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {b.name}
                {got && got.count > 1 ? ` ×${got.count}` : ''}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {got && got.events.length ? got.events.join(', ') : b.description}
              </Typography>
            </Box>
            {got ? (
              <Chip size="small" color={b.awarded ? 'primary' : 'success'} label={b.awarded ? 'Awarded' : 'Earned'} />
            ) : (
              b.awarded && <Chip size="small" variant="outlined" label="By admin" />
            )}
          </Stack>
        );
      })}
    </Box>
  );
}
