import { useLocation, useNavigate } from 'react-router-dom';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import DashboardIcon from '@mui/icons-material/DashboardRounded';
import EventIcon from '@mui/icons-material/CalendarMonth';
import ConnectIcon from '@mui/icons-material/PeopleAlt';
import AchievementsIcon from '@mui/icons-material/EmojiEventsRounded';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { brand } from '../theme/theme';

import { useAuth } from '../context/AuthContext';

const ALL_NAV_ITEMS = [
  { label: 'Home', icon: <DashboardIcon />, path: '/home' },
  { label: 'Events', icon: <EventIcon />, path: '/events' },
  { label: 'Achievements', icon: <AchievementsIcon />, path: '/achievements' },
  { label: 'Connect', icon: <ConnectIcon />, path: '/connect' },
  { label: 'More', icon: <MoreHorizIcon />, path: '/more' },
];

export default function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = ALL_NAV_ITEMS.filter((item) => {
    if (user?.role === 'admin' && (item.label === 'Achievements' || item.label === 'Connect' || item.label === 'Events')) return false;
    return true;
  }).map(item => {
    if (user?.role === 'admin' && item.label === 'Home') return { ...item, label: 'Dashboard' };
    return item;
  });

  const currentIndex = navItems.findIndex((item) =>
    location.pathname.startsWith(item.path),
  );

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        display: { xs: 'block', md: 'none' },
      }}
      elevation={8}
    >
      <BottomNavigation
        value={currentIndex === -1 ? 0 : currentIndex}
        onChange={(_e, newValue) => {
          navigate(navItems[newValue].path);
        }}
        showLabels
      >
        {navItems.map((item, index) => (
          <BottomNavigationAction
            key={item.label}
            label={item.label}
            icon={item.icon}
            sx={
              index === 2
                ? {
                    '& .MuiBottomNavigationAction-label': {
                      fontWeight: 700,
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: 28,
                    },
                    '&.Mui-selected': {
                      color: brand.primary,
                    },
                  }
                : {}
            }
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
