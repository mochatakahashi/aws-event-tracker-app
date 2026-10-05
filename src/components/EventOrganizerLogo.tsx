import Box from '@mui/material/Box';
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
      {/* Visual Logo Emblem for AWS SBG-APC */}
      <Box
        sx={{
          width: isSmall ? 32 : 40,
          height: isSmall ? 32 : 40,
          borderRadius: isSmall ? 2 : 2.5,
          background: 'linear-gradient(135deg, #FF9900 0%, #FF6200 40%, #7B2D8E 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 14px ${alpha('#FF9900', 0.35)}`,
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* AWS Smile / Cloud shape emblem inside */}
        <svg
          width={isSmall ? 20 : 24}
          height={isSmall ? 20 : 24}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"
            fill="white"
            fillOpacity="0.95"
          />
          <path
            d="M7 14L10 17L17 10"
            stroke="#7B2D8E"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Box>

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
