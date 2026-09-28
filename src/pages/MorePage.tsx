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
import EventNoteIcon from '@mui/icons-material/EventNote';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import LogoutIcon from '@mui/icons-material/Logout';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { brand } from '../theme/theme';

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
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 3,
          backgroundColor: alpha(brand.primary, 0.05),
        }}
      >
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

      <List>
        <ListItemButton onClick={() => navigate('/home')}>
          <ListItemIcon><DashboardRoundedIcon /></ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>
        <ListItemButton onClick={() => navigate('/profile')}>
          <ListItemIcon><PersonRoundedIcon /></ListItemIcon>
          <ListItemText primary="My Profile" />
        </ListItemButton>
        <ListItemButton onClick={() => navigate('/select-event')}>
          <ListItemIcon><EventNoteIcon /></ListItemIcon>
          <ListItemText primary="Switch Event" />
        </ListItemButton>

        {user?.role === 'admin' && (
          <ListItemButton onClick={() => navigate('/admin')}>
            <ListItemIcon><AdminPanelSettingsIcon /></ListItemIcon>
            <ListItemText primary="Admin Dashboard" secondary="Manage user roles" />
          </ListItemButton>
        )}

        {(user?.role === 'admin' || user?.role === 'officer') && (
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
    </Box>
  );
}
