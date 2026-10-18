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
import LockResetIcon from '@mui/icons-material/LockReset';
import EventNoteIcon from '@mui/icons-material/EventNote';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { brand } from '../theme/theme';
import BottomNav from './BottomNav';
import EventOrganizerLogo from './EventOrganizerLogo';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import LeaderboardRoundedIcon from '@mui/icons-material/LeaderboardRounded';
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded';
import { useDeskCounts } from '../hooks/useDeskCounts';
import { isPartnerStaff } from '../utils/eventStaff';
import ButtonBase from '@mui/material/ButtonBase';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import TutorialTour, { startTour } from './TutorialTour';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';

const DRAWER_WIDTH = 260;

interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/home', icon: <DashboardRoundedIcon /> },
  { label: 'Achievements', to: '/achievements', icon: <EmojiEventsRoundedIcon /> },
  { label: 'Leaderboard', to: '/leaderboard', icon: <LeaderboardRoundedIcon /> },
  { label: 'Events', to: '/events', icon: <CalendarMonthIcon /> },
  { label: 'Connect', to: '/connect', icon: <PeopleAltIcon /> },
  { label: 'Notifications', to: '/notifications', icon: <NotificationsNoneRoundedIcon /> },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { selectedEvent } = useEvent();
  const navigate = useNavigate();
  const location = useLocation();
  const unread = useUnreadNotifications(user?.personId);
  const desk = useDeskCounts(user);
  const unreadLabel = unread > 0 ? `${unread} unread notification${unread === 1 ? '' : 's'}` : 'notifications';

  // Profile menu anchor
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
  const profileMenuOpen = Boolean(profileAnchor);
  // The sidebar avatar (laptops) opens the same menu, upwards
  const [menuFromSidebar, setMenuFromSidebar] = useState(false);
  const roleName = user?.role === 'admin' ? 'Admin' : user?.role === 'officer' ? 'Officer' : isPartnerStaff(user) ? `Co-organizer staff · ${user?.partnerOrg}` : 'Attendee';

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
          (item) =>
            !(user?.role === 'admin' && (item.label === 'Achievements' || item.label === 'Connect' || item.label === 'Events')) &&
            // The leaderboard is for admins to monitor
            !(user?.role !== 'admin' && item.label === 'Leaderboard'),
        ).map(item => {
          if (user?.role === 'admin' && item.label === 'Dashboard') return { ...item, label: 'Admin Dashboard' };
          return item;
        }).map((item) => (
          <ListItemButton
            key={item.to}
            component={RouterLink}
            to={item.to}
            selected={isActive(item.to)}
            data-tour={item.to === '/home' ? 'nav-dashboard' : `nav-${item.label.toLowerCase()}`}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {item.to === '/notifications' ? (
                <Badge badgeContent={unread} color="error" max={99}>
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{ fontWeight: isActive(item.to) ? 600 : 400, fontSize: '0.9rem' }}
            />
          </ListItemButton>
        ))}
        {user?.role !== 'admin' && (
          <ListItemButton component={RouterLink} to="/pass" selected={isActive('/pass')} data-tour="nav-pass">
            <ListItemIcon sx={{ minWidth: 40 }}><QrCode2RoundedIcon /></ListItemIcon>
            <ListItemText
              primary="My Event Pass"
              primaryTypographyProps={{ fontWeight: isActive('/pass') ? 600 : 400, fontSize: '0.9rem' }}
            />
          </ListItemButton>
        )}
        {desk.hasDesk && (
          <ListItemButton
            component={RouterLink}
            to="/officer/scan"
            selected={location.pathname.startsWith('/officer/scan')}
            data-tour="nav-event-desk"
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Badge badgeContent={desk.pendingStamps} color="error" max={99}>
                <QrCodeScannerRoundedIcon />
              </Badge>
            </ListItemIcon>
            <ListItemText
              primary="Event Desk"
              primaryTypographyProps={{ fontWeight: location.pathname.startsWith('/officer/scan') ? 600 : 400, fontSize: '0.9rem' }}
            />
          </ListItemButton>
        )}
        {user?.role === 'officer' && (
          <ListItemButton
            component={RouterLink}
            to="/officer"
            selected={isActive('/officer') && !location.pathname.startsWith('/officer/scan')}
            data-tour="nav-officer-dashboard"
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
      <Box sx={{ p: 2 }} data-tour="profile">
        <ButtonBase
          onClick={(e) => {
            setMenuFromSidebar(true);
            setProfileAnchor(e.currentTarget);
          }}
          aria-label="account menu (sidebar)"
          data-testid="sidebar-account"
          sx={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left', borderRadius: 2, p: 0.5, mb: 1, '&:hover': { bgcolor: alpha(brand.primary, 0.06) } }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
            <Avatar src={user?.avatarUrl || undefined} sx={{ width: 36, height: 36, fontSize: '0.85rem' }}>{initials}</Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                {user?.name}
              </Typography>
              <Typography variant="caption" noWrap component="div" sx={{ color: brand.textSecondary }}>
                {roleName}
              </Typography>
            </Box>
            <ExpandMoreRoundedIcon fontSize="small" sx={{ color: brand.textSecondary, transform: 'rotate(180deg)' }} />
          </Stack>
        </ButtonBase>
        <Button
          size="small"
          fullWidth
          startIcon={<SchoolRoundedIcon />}
          onClick={startTour}
          sx={{ mb: 1, justifyContent: 'flex-start', fontSize: '0.75rem' }}
        >
          Take the app tour
        </Button>
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
            aria-label={unreadLabel}
            data-tour="nav-notifications"
          >
            <Badge badgeContent={unread} color="error" max={99}>
              <NotificationsNoneRoundedIcon />
            </Badge>
          </IconButton>

          {/* Profile avatar button → dropdown with name + profile + logout */}
          <IconButton
            onClick={(e) => {
              setMenuFromSidebar(false);
              setProfileAnchor(e.currentTarget);
            }}
            sx={{ p: 0.5 }}
            aria-label="account menu"
            data-tour="profile"
          >
            <Avatar src={user?.avatarUrl || undefined} sx={{ width: 32, height: 32, fontSize: '0.75rem' }}>
              {initials}
            </Avatar>
          </IconButton>

          {/* Profile dropdown menu */}
          <Menu
            anchorEl={profileAnchor}
            open={profileMenuOpen}
            onClose={() => setProfileAnchor(null)}
            anchorOrigin={menuFromSidebar ? { vertical: 'top', horizontal: 'left' } : { vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={menuFromSidebar ? { vertical: 'bottom', horizontal: 'left' } : { vertical: 'top', horizontal: 'right' }}
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
                {user?.role === 'admin' ? 'Administrator' : roleName}
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
            <MenuItem onClick={() => { setProfileAnchor(null); navigate('/change-password'); }} sx={{ py: 1.2 }}>
              <ListItemIcon><LockResetIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Change password" />
            </MenuItem>
            <MenuItem onClick={() => { setProfileAnchor(null); startTour(); }} sx={{ py: 1.2 }} data-testid="menu-replay-tour">
              <ListItemIcon><SchoolRoundedIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Replay the app tour" secondary="Forgot where things are?" secondaryTypographyProps={{ fontSize: '0.7rem' }} />
            </MenuItem>
            {user?.role !== 'admin' && (
              <MenuItem onClick={() => { setProfileAnchor(null); navigate('/pass'); }} sx={{ py: 1.2 }}>
                <ListItemIcon><QrCode2RoundedIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="My Event Pass" />
              </MenuItem>
            )}
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
        <Box sx={{ p: { xs: 2, md: 3, lg: 4 }, pb: { xs: 10, md: 4 }, maxWidth: 1280, mx: 'auto', width: '100%' }}>
          <Outlet />
          <TutorialTour />
        </Box>
      </Box>

      {/* Bottom navigation — mobile only */}
      <BottomNav />
    </Box>
  );
}
