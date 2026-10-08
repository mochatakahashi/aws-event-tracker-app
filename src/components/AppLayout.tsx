import { useState, type ReactNode } from 'react';
import { Outlet, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Badge from '@mui/material/Badge';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import LogoutIcon from '@mui/icons-material/Logout';
import EventNoteIcon from '@mui/icons-material/EventNote';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { brand } from '../theme/theme';
import BottomNav from './BottomNav';
import EventOrganizerLogo from './EventOrganizerLogo';

const DRAWER_WIDTH = 260;

interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/home', icon: <DashboardRoundedIcon /> },
  { label: 'Achievements', to: '/achievements', icon: <EmojiEventsRoundedIcon /> },
  { label: 'Events', to: '/events', icon: <CalendarMonthIcon /> },
  { label: 'Connect', to: '/connect', icon: <PeopleAltIcon /> },
  { label: 'Notifications', to: '/notifications', icon: <NotificationsNoneRoundedIcon /> },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { selectedEvent } = useEvent();
  const navigate = useNavigate();
  const location = useLocation();

  // Profile menu anchor
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
  const profileMenuOpen = Boolean(profileAnchor);

  function handleLogout() {
    setProfileAnchor(null);
    logout();
    navigate('/login', { replace: true });
  }

  function isActive(to: string) {
    if (to === '/home') return location.pathname === '/home';
    return location.pathname.startsWith(to);
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo / Brand */}
      <Box sx={{ p: 2.5, pb: 1 }}>
        <EventOrganizerLogo size="medium" showSubtitle={true} />
      </Box>

      {/* Selected event indicator */}
      {selectedEvent && user?.role !== 'admin' && (
        <Box sx={{ px: 2, py: 1 }}>
          <Box
            component={RouterLink}
            to="/select-event"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1.5,
              borderRadius: 2,
              backgroundColor: alpha(brand.primary, 0.06),
              textDecoration: 'none',
              color: 'inherit',
              transition: 'background-color 0.2s',
              '&:hover': { backgroundColor: alpha(brand.primary, 0.1) },
            }}
          >
            <EventNoteIcon sx={{ color: brand.primary, fontSize: 18 }} />
            <Typography variant="body2" noWrap sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
              {selectedEvent.title}
            </Typography>
          </Box>
        </Box>
      )}

      <Divider sx={{ mx: 2, my: 1 }} />

      {/* Nav items */}
      <List sx={{ flex: 1, px: 1 }}>
        {ALL_NAV_ITEMS.filter(
          (item) => !(user?.role === 'admin' && (item.label === 'Achievements' || item.label === 'Connect' || item.label === 'Events'))
        ).map(item => {
          if (user?.role === 'admin' && item.label === 'Dashboard') return { ...item, label: 'Admin Dashboard' };
          return item;
        }).map((item) => (
          <ListItemButton
            key={item.to}
            component={RouterLink}
            to={item.to}
            selected={isActive(item.to)}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{ fontWeight: isActive(item.to) ? 600 : 400, fontSize: '0.9rem' }}
            />
          </ListItemButton>
        ))}
        {(user?.role === 'officer' || (user?.personId && selectedEvent?.officerIds?.includes(user.personId))) && (
          <ListItemButton
            component={RouterLink}
            to="/officer"
            selected={isActive('/officer')}
          >
            <ListItemIcon sx={{ minWidth: 40 }}><VerifiedUserIcon /></ListItemIcon>
            <ListItemText
              primary="Officer Dashboard"
              primaryTypographyProps={{ fontWeight: isActive('/officer') ? 600 : 400, fontSize: '0.9rem' }}
            />
          </ListItemButton>
        )}
      </List>

      <Divider sx={{ mx: 2 }} />

      {/* User section */}
      <Box sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, fontSize: '0.85rem' }}>{initials}</Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {user?.name}
            </Typography>
            <Typography variant="caption" noWrap sx={{ color: brand.textSecondary }}>
              {user?.role === 'admin' ? 'Admin' : user?.role === 'officer' ? 'Officer' : 'Attendee'}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<PersonRoundedIcon />}
            onClick={() => navigate('/profile')}
            sx={{ flex: 1, fontSize: '0.75rem' }}
          >
            Profile
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ fontSize: '0.75rem' }}
          >
            Logout
          </Button>
        </Stack>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: '100vh' }}>
      {/* AppBar — mobile only */}
      <AppBar
        position="sticky"
        elevation={2}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          display: { md: 'none' },
          borderRadius: 0,
        }}
      >
        <Toolbar sx={{ minHeight: 56, px: 2 }}>
          {/* AWS SBG-APC branding logo */}
          <Box sx={{ flexGrow: 1 }}>
            <EventOrganizerLogo size="small" showSubtitle={false} />
          </Box>

          {/* Bell icon for notifications */}
          <IconButton
            color="inherit"
            onClick={() => navigate('/notifications')}
            sx={{ mr: 0.5 }}
            aria-label="notifications"
          >
            <Badge badgeContent={2} color="error" variant="dot">
              <NotificationsNoneRoundedIcon />
            </Badge>
          </IconButton>

          {/* Profile avatar button → dropdown with name + profile + logout */}
          <IconButton
            onClick={(e) => setProfileAnchor(e.currentTarget)}
            sx={{ p: 0.5 }}
            aria-label="account menu"
          >
            <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem' }}>
              {initials}
            </Avatar>
          </IconButton>

          {/* Profile dropdown menu */}
          <Menu
            anchorEl={profileAnchor}
            open={profileMenuOpen}
            onClose={() => setProfileAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  minWidth: 220,
                  borderRadius: 3,
                  boxShadow: `0 8px 32px ${alpha(brand.primary, 0.15)}`,
                },
              },
            }}
          >
            {/* User info header */}
            <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {user?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.role === 'admin' ? 'Administrator' : user?.role === 'officer' ? 'Officer' : 'Attendee'}
              </Typography>
            </Box>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem
              onClick={() => { setProfileAnchor(null); navigate('/profile'); }}
              sx={{ py: 1.2 }}
            >
              <ListItemIcon><PersonRoundedIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="My Profile" />
            </MenuItem>
            <MenuItem
              onClick={() => setProfileAnchor(null)}
              sx={{ py: 1.2 }}
            >
              <ListItemIcon><InfoOutlinedIcon fontSize="small" /></ListItemIcon>
              <ListItemText 
                primary="About AWS SBG-APC" 
                secondary="Event Tracker v0.1.0"
                secondaryTypographyProps={{ fontSize: '0.7rem' }}
              />
            </MenuItem>
            <MenuItem
              onClick={handleLogout}
              sx={{ py: 1.2, color: brand.error }}
            >
              <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: brand.error }} /></ListItemIcon>
              <ListItemText primary="Logout" />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Desktop permanent drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: `1px solid ${alpha(brand.primary, 0.08)}`,
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
          maxWidth: '100vw',
          bgcolor: 'background.default',
          minHeight: { xs: 'auto', md: '100vh' },
          overflowX: 'hidden',
        }}
      >
        {/* Page content */}
        <Box sx={{ p: { xs: 2, md: 3 }, pb: { xs: 10, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>

      {/* Bottom navigation — mobile only */}
      <BottomNav />
    </Box>
  );
}
