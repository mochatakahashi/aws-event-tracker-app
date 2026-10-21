import { useNavigate } from 'react-router-dom';
import { LOGOS } from '../brandAssets';
import FooterBand from '../components/FooterBand';
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

  const features = (
    <>
      <FeatureItem
        icon={<BoltRoundedIcon />}
        text="View the real-time event schedule, including upcoming talks and room locations."
      />
      <FeatureItem
        icon={<NotificationsActiveIcon />}
        text="Get instant alerts and notifications directly from the event organizers."
      />
      <FeatureItem icon={<PlaceIcon />} text="Access venue maps, speaker profiles, and activity details instantly." />
      <FeatureItem icon={<PeopleAltIcon />} text="Exchange contact information via QR code to grow your network." />
    </>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(180deg, ${brand.background} 0%, ${alpha(brand.secondary, 0.5)} 100%)`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Page content, centered above the footer */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 3, sm: 4, md: 6 },
          py: { xs: 6, sm: 8 },
        }}
      >
      <Box
        sx={{
          width: '100%',
          maxWidth: { xs: 480, md: 1100 },
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '1.1fr 0.9fr' },
          gap: { xs: 0, md: 8 },
          alignItems: 'center',
        }}
      >
        {/* Left: intro + call to action */}
        <Box>
          {/* Logo */}
          <Box
            component="img"
            src={LOGOS.club}
            alt="AWS Student Builder Group - Asia Pacific College logo"
            sx={{
              display: 'block',
              width: { xs: 240, md: 300 },
              height: 'auto',
              px: 2.5,
              py: 1.5,
              mb: 3,
              borderRadius: '18px',
              bgcolor: '#fff',
              boxShadow: `0 8px 30px ${alpha(brand.primary, 0.18)}`,
            }}
          />

          <Typography
            variant="h1"
            sx={{ fontWeight: 800, fontSize: { xs: '2rem', sm: '2.5rem', md: '3.25rem' }, lineHeight: 1.1, mb: 0.5 }}
          >
            AWS SBG-APC
          </Typography>
          <Typography variant="body2" sx={{ color: brand.textSecondary, mb: 3, fontSize: { xs: '0.9rem', md: '1rem' } }}>
            by AWS Student Builder Group – Asia Pacific College
          </Typography>

          <Typography
            variant="body1"
            sx={{ mb: { xs: 4, md: 5 }, color: brand.textPrimary, lineHeight: 1.6, fontSize: { xs: '1.05rem', md: '1.2rem' }, maxWidth: 560 }}
          >
            Your all-in-one event companion. Stay updated on session schedules, interact with speakers, and link up with other participants easily.
          </Typography>

          {/* On phones the features sit here, above the button */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>{features}</Box>

          <Button
            variant="contained"
            size="large"
            onClick={() => navigate(isAuthenticated ? '/home' : '/login')}
            sx={{
              mt: { xs: 4, md: 0 },
              width: { xs: '100%', md: 'auto' },
              px: { md: 6 },
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
          {!isAuthenticated && (
            <Button
              variant="text"
              onClick={() => navigate('/signup')}
              sx={{ mt: { xs: 1.5, md: 0 }, ml: { md: 2 }, width: { xs: '100%', md: 'auto' }, fontWeight: 600 }}
            >
              Create an account
            </Button>
          )}
        </Box>

        {/* Right (laptop): features in a card */}
        <Box
          sx={{
            display: { xs: 'none', md: 'block' },
            p: 4,
            borderRadius: 4,
            bgcolor: 'background.paper',
            border: `1px solid ${alpha(brand.primary, 0.12)}`,
            boxShadow: `0 20px 60px ${alpha(brand.primary, 0.12)}`,
          }}
        >
          <Typography variant="h6" sx={{ color: brand.primary, fontWeight: 700, mb: 2.5 }}>
            What you can do
          </Typography>
          {features}
        </Box>
      </Box>
      </Box>
      <FooterBand />
    </Box>
  );
}
