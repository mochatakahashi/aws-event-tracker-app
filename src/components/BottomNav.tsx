import { useLocation, useNavigate } from 'react-router-dom';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import EventIcon from '@mui/icons-material/CalendarMonth';
import ConnectIcon from '@mui/icons-material/PeopleAlt';
import FlowIcon from '@mui/icons-material/BoltRounded';
import NotificationsIcon from '@mui/icons-material/NotificationsNoneRounded';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { brand } from '../theme/theme';

const NAV_ITEMS = [
  { label: 'Events', icon: <EventIcon />, path: '/events' },
  { label: 'Connect', icon: <ConnectIcon />, path: '/profile' },
  { label: 'Flow', icon: <FlowIcon />, path: '/flow' },
  { label: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
  { label: 'More', icon: <MoreHorizIcon />, path: '/more' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentIndex = NAV_ITEMS.findIndex((item) =>
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
        value={currentIndex === -1 ? 2 : currentIndex}
        onChange={(_e, newValue) => {
          navigate(NAV_ITEMS[newValue].path);
        }}
        showLabels
      >
        {NAV_ITEMS.map((item, index) => (
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
