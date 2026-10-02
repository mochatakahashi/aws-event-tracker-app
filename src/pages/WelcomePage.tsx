import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PlaceIcon from '@mui/icons-material/Place';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

interface FeatureItemProps {
  icon: React.ReactNode;
  text: string;
}

function FeatureItem({ icon, text }: FeatureItemProps) {
  return (
    <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2.5 }}>
      <Box
        sx={{
          color: brand.primary,
          mt: 0.3,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Typography variant="body1" sx={{ color: brand.textSecondary, lineHeight: 1.5 }}>
        {text}
      </Typography>
    </Stack>
  );
}

export default function WelcomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: `linear-gradient(180deg, ${brand.background} 0%, ${alpha(brand.secondary, 0.5)} 100%)`,
        px: { xs: 3, sm: 4 },
        py: { xs: 6, sm: 8 },
        maxWidth: 480,
        mx: 'auto',
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: 3,
          background: brand.gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
          boxShadow: `0 8px 30px ${alpha(brand.primary, 0.3)}`,
        }}
      >
        <BoltRoundedIcon sx={{ color: '#fff', fontSize: 40 }} />
      </Box>

      {/* Title */}
      <Typography
        variant="h1"
        sx={{
          fontWeight: 800,
          fontSize: { xs: '2rem', sm: '2.5rem' },
          lineHeight: 1.1,
          mb: 0.5,
        }}
      >
        AWS SBG-APC
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: brand.textSecondary, mb: 3, fontSize: '0.9rem' }}
      >
        by AWS Student Builder Group – Asia Pacific College
      </Typography>

      {/* Description */}
      <Typography
        variant="body1"
        sx={{ mb: 4, color: brand.textPrimary, lineHeight: 1.6, fontSize: '1.05rem' }}
      >
        Your all-in-one event companion. Stay updated on session schedules, interact with speakers, and link up with other participants easily.
      </Typography>

      {/* Features */}
      <FeatureItem
        icon={<BoltRoundedIcon />}
        text="View the real-time event schedule, including upcoming talks and room locations."
      />
      <FeatureItem
        icon={<NotificationsActiveIcon />}
        text="Get instant alerts and notifications directly from the event organizers."
      />
      <FeatureItem
        icon={<PlaceIcon />}
        text="Access venue maps, speaker profiles, and activity details instantly."
      />
      <FeatureItem
        icon={<PeopleAltIcon />}
        text="Exchange contact information via QR code to grow your network."
      />

      {/* CTA */}
      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={() => navigate(isAuthenticated ? '/home' : '/login')}
        sx={{
          mt: 4,
          py: 1.8,
          fontSize: '1.1rem',
          fontWeight: 700,
          borderRadius: 3,
          background: brand.gradient,
          boxShadow: `0 4px 20px ${alpha(brand.primary, 0.4)}`,
          '&:hover': {
            background: brand.gradientDark,
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 30px ${alpha(brand.primary, 0.5)}`,
          },
          transition: 'all 0.3s ease',
        }}
      >
        Get Started
      </Button>
    </Box>
  );
}
