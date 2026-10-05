import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import EventNoteIcon from '@mui/icons-material/EventNote';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import LogoutIcon from '@mui/icons-material/Logout';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { brand } from '../theme/theme';

const socialLinks = [
  { icon: <InstagramIcon sx={{ fontSize: 20 }} />, href: 'https://www.instagram.com/awssbgapc', color: '#E1306C', label: 'Instagram' },
  { icon: <FacebookIcon sx={{ fontSize: 20 }} />, href: 'https://www.facebook.com/awssbgapc', color: '#1877F2', label: 'Facebook' },
  { icon: <LinkedInIcon sx={{ fontSize: 20 }} />, href: 'https://www.linkedin.com/company/awssbgapc/', color: '#0A66C2', label: 'LinkedIn' },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" />
      </svg>
    ),
    href: 'https://tiktok.com/@awssbgapc',
    color: '#010101',
    label: 'TikTok',
  },
  { icon: <EmailRoundedIcon sx={{ fontSize: 20 }} />, href: 'mailto:aws.apcofficial@gmail.com', color: '#EF4444', label: 'Email' },
];

export default function MorePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 3 }}>
        More
      </Typography>

      {/* User Info */}
      <Box
        onClick={() => navigate('/profile')}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 3,
          backgroundColor: alpha(brand.primary, 0.05),
          cursor: 'pointer',
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: alpha(brand.primary, 0.08),
          }
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ width: 50, height: 50, fontSize: '1.2rem' }}>
            {initials}
          </Avatar>
          <Box>
            <Typography variant="h4">{user?.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.role === 'admin' ? 'Administrator' : user?.role === 'officer' ? 'Officer' : 'Attendee'}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <List>
        <ListItemButton onClick={() => navigate('/home')}>
          <ListItemIcon><DashboardRoundedIcon /></ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>

        {user?.role !== 'admin' && (
          <>
            <ListItemButton onClick={() => navigate('/achievements')}>
              <ListItemIcon><EmojiEventsRoundedIcon /></ListItemIcon>
              <ListItemText primary="My Achievements" secondary="Stamps & milestones" />
            </ListItemButton>
            <ListItemButton onClick={() => navigate('/connect')}>
              <ListItemIcon><PeopleAltIcon /></ListItemIcon>
              <ListItemText primary="Connect" secondary="Networking & Bio" />
            </ListItemButton>
            <ListItemButton onClick={() => navigate('/select-event')}>
              <ListItemIcon><EventNoteIcon /></ListItemIcon>
              <ListItemText primary="Switch Event" />
            </ListItemButton>
          </>
        )}


        {user?.role === 'officer' && (
          <ListItemButton onClick={() => navigate('/officer')}>
            <ListItemIcon><VerifiedUserIcon /></ListItemIcon>
            <ListItemText primary="Officer Dashboard" secondary="Approve stamps" />
          </ListItemButton>
        )}

        <Divider sx={{ my: 1.5 }} />

        <ListItemButton>
          <ListItemIcon><InfoOutlinedIcon /></ListItemIcon>
          <ListItemText
            primary="About AWS SBG-APC"
            secondary="Event Tracker v0.1.0"
          />
        </ListItemButton>

        <Divider sx={{ my: 1.5 }} />

        <ListItemButton onClick={handleLogout} sx={{ color: brand.error }}>
          <ListItemIcon><LogoutIcon sx={{ color: brand.error }} /></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </List>

      {/* Social Media Links Section */}
      <Box
        sx={{
          mt: 3,
          p: 2.5,
          borderRadius: '15px',
          background: `linear-gradient(135deg, ${alpha(brand.primary, 0.06)} 0%, ${alpha('#EF4444', 0.04)} 100%)`,
          border: `1px solid ${alpha(brand.primary, 0.1)}`,
          textAlign: 'center',
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5, fontSize: '0.95rem' }}>
          Follow Us
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Stay connected with AWS SBG-APC
        </Typography>
        <Stack direction="row" spacing={1.5} justifyContent="center">
          {socialLinks.map((s) => (
            <IconButton
              key={s.label}
              component="a"
              href={s.href}
              target={s.href.startsWith('mailto') ? undefined : '_blank'}
              rel="noopener noreferrer"
              aria-label={s.label}
              sx={{
                color: s.color,
                bgcolor: alpha(s.color, 0.1),
                width: 42,
                height: 42,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha(s.color, 0.2),
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${alpha(s.color, 0.25)}`,
                },
              }}
            >
              {s.icon}
            </IconButton>
          ))}
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, fontSize: '0.72rem' }}>
          aws.apcofficial@gmail.com
        </Typography>
      </Box>
    </Box>
  );
}
