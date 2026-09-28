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
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import EventNoteIcon from '@mui/icons-material/EventNote';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { brand } from '../theme/theme';
import BottomNav from './BottomNav';

const DRAWER_WIDTH = 260;

interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/home', icon: <DashboardRoundedIcon /> },
  { label: 'Flow', to: '/flow', icon: <BoltRoundedIcon /> },
  { label: 'Events', to: '/events', icon: <CalendarMonthIcon /> },
  { label: 'Connect', to: '/profile', icon: <PeopleAltIcon /> },
  { label: 'Notifications', to: '/notifications', icon: <NotificationsNoneRoundedIcon /> },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { selectedEvent } = useEvent();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
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
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: brand.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BoltRoundedIcon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: brand.primary, lineHeight: 1.2 }}>
              AWS SBG-APC
            </Typography>
            <Typography variant="caption" sx={{ color: brand.textSecondary, fontSize: '0.65rem' }}>
              Event Tracker
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Selected event indicator */}
      {selectedEvent && (
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
        {NAV_ITEMS.map((item) => (
          <ListItemButton
            key={item.to}
            component={RouterLink}
            to={item.to}
            selected={isActive(item.to)}
            onClick={() => setMobileOpen(false)}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{ fontWeight: isActive(item.to) ? 600 : 400, fontSize: '0.9rem' }}
            />
          </ListItemButton>
        ))}
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
            onClick={() => { navigate('/profile'); setMobileOpen(false); }}
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
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar — mobile only */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          display: { md: 'none' },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen((o) => !o)}
            sx={{ mr: 1 }}
            aria-label="open navigation"
          >
            <MenuIcon />
          </IconButton>

          <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', mr: 1.5 }}>
            {initials}
          </Avatar>

          <Typography variant="body1" component="div" sx={{ flexGrow: 1, fontWeight: 600 }} noWrap>
            {selectedEvent ? selectedEvent.title : 'AWS SBG-APC'}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Mobile temporary drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        {drawerContent}
      </Drawer>

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
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        {/* Toolbar spacer for mobile */}
        <Toolbar sx={{ display: { md: 'none' } }} />

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
