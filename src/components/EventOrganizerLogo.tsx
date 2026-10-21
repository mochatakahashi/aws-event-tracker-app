import Box from '@mui/material/Box';
import { LOGOS } from '../brandAssets';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';

interface EventOrganizerLogoProps {
  size?: 'small' | 'medium' | 'large';
  showSubtitle?: boolean;
}

export default function EventOrganizerLogo({
  size = 'medium',
  showSubtitle = true,
}: EventOrganizerLogoProps) {
  const isSmall = size === 'small';

  return (
    <Stack direction="row" alignItems="center" spacing={1.25}>
      {/* Club mascot */}
      <Box
        component="img"
        src={LOGOS.icon}
        alt="AWS SBG-APC"
        sx={{
          width: isSmall ? 32 : 40,
          height: isSmall ? 32 : 40,
          borderRadius: '50%',
          flexShrink: 0,
          boxShadow: `0 4px 14px ${alpha('#7B2D8E', 0.3)}`,
        }}
      />

      {/* Text Branding & Host Info */}
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Typography
            variant={isSmall ? 'subtitle2' : 'h5'}
            sx={{
              fontWeight: 800,
              color: isSmall ? '#fff' : brand.primary,
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
            }}
          >
            AWS SBG-APC
          </Typography>
          {!isSmall && (
            <Chip
              label="HOST"
              size="small"
              sx={{
                height: 16,
                fontSize: '0.6rem',
                fontWeight: 800,
                bgcolor: alpha(brand.primary, 0.1),
                color: brand.primary,
                border: `1px solid ${alpha(brand.primary, 0.2)}`,
                px: 0.5,
              }}
            />
          )}
        </Stack>

        {showSubtitle && (
          <Typography
            variant="caption"
            sx={{
              color: isSmall ? 'rgba(255, 255, 255, 0.8)' : brand.textSecondary,
              fontSize: isSmall ? '0.65rem' : '0.7rem',
              display: 'block',
              fontWeight: 500,
              lineHeight: 1.1,
            }}
          >
            Asia Pacific College Event Passport
          </Typography>
        )}
      </Box>
    </Stack>
  );
}
