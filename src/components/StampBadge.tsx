import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import StarsIcon from '@mui/icons-material/Stars';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';

interface StampBadgeProps {
  earned: boolean;
  status?: 'pending' | 'approved';
  size?: 'small' | 'medium';
}

export default function StampBadge({ earned, status, size = 'medium' }: StampBadgeProps) {
  const sz = size === 'small' ? 28 : 36;
  const iconSz = size === 'small' ? 18 : 24;

  if (!earned) {
    return (
      <Tooltip title="Stamp available — complete this activity!">
        <Box
          sx={{
            width: sz,
            height: sz,
            borderRadius: '50%',
            backgroundColor: alpha(brand.primary, 0.1),
            border: `2px dashed ${alpha(brand.primary, 0.3)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.1)',
              backgroundColor: alpha(brand.primary, 0.15),
            },
          }}
        >
          <StarsIcon sx={{ fontSize: iconSz, color: alpha(brand.primary, 0.4) }} />
        </Box>
      </Tooltip>
    );
  }

  if (status === 'pending') {
    return (
      <Tooltip title="Stamp pending approval">
        <Box
          sx={{
            width: sz,
            height: sz,
            borderRadius: '50%',
            background: `linear-gradient(135deg, #FEF3C7, #FDE68A)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 2px 8px ${alpha('#F59E0B', 0.3)}`,
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%, 100%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.08)' },
            },
          }}
        >
          <HourglassTopIcon sx={{ fontSize: iconSz, color: '#D97706' }} />
        </Box>
      </Tooltip>
    );
  }

  return (
    <Tooltip title="Stamp earned! ✅">
      <Box
        sx={{
          width: sz,
          height: sz,
          borderRadius: '50%',
          background: `linear-gradient(135deg, #ECFDF5, #A7F3D0)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 2px 8px ${alpha('#10B981', 0.3)}`,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'scale(1.1)',
          },
        }}
      >
        <CheckCircleIcon sx={{ fontSize: iconSz, color: '#059669' }} />
      </Box>
    </Tooltip>
  );
}
