import Box from '@mui/material/Box';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import { keyframes } from '@mui/material/styles';
import { brand } from '../theme/theme';

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(233, 213, 255, 0.45); }
  50% { box-shadow: 0 0 0 10px rgba(233, 213, 255, 0); }
`;

/**
 * The Event Tracker app's own mark (a lightning bolt on the brand gradient),
 * separate from the club's logo. `pulse` adds the soft glowing ring.
 */
export default function AppMark({ size = 40, pulse: glow = false }: { size?: number; pulse?: boolean }) {
  return (
    <Box
      aria-hidden
      data-testid="app-mark"
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        background: brand.gradient,
        border: '2px solid rgba(255,255,255,0.85)',
        display: 'grid',
        placeItems: 'center',
        animation: glow ? `${pulse} 3s ease-in-out infinite` : undefined,
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
      }}
    >
      <BoltRoundedIcon sx={{ color: '#fff', fontSize: size * 0.6 }} />
    </Box>
  );
}
