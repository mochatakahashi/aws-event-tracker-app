import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { getUsers } from '../services/authService';
import { getTasks } from '../services/taskService';

interface Item {
  title: string;
  description: string;
  to: string;
  icon: ReactNode;
  badge?: number;
  badgeLabel?: string;
}

/** The admin's home: one card per admin area. */
export default function AdminHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pending, setPending] = useState(0);
  const [openTasks, setOpenTasks] = useState(0);

  useEffect(() => {
    getUsers()
      .then((users) => setPending(users.filter((u) => u.status === 'pending').length))
      .catch(() => undefined);
    getTasks()
      .then((tasks) => setOpenTasks(tasks.filter((t) => t.status !== 'done').length))
      .catch(() => undefined);
  }, []);

  const items: Item[] = [
    {
      title: 'Manage Accounts',
      description: 'Approve sign-ups and change roles',
      to: '/admin',
      icon: <AdminPanelSettingsIcon sx={{ fontSize: 28 }} />,
      badge: pending,
      badgeLabel: 'waiting',
    },
    {
      title: 'Edit Events',
      description: 'Create, update, or delete events',
      to: '/events',
      icon: <CalendarMonthIcon sx={{ fontSize: 28 }} />,
    },
    {
      title: 'Attendees & Achievements',
      description: 'Attendee list, check-ins, stamp finishers, Excel for profs',
      to: '/admin/attendees',
      icon: <HowToRegIcon sx={{ fontSize: 28 }} />,
    },
    {
      title: 'Officers',
      description: 'Officer achievements and the events they volunteered for',
      to: '/admin/officers',
      icon: <MilitaryTechIcon sx={{ fontSize: 28 }} />,
    },
    {
      title: 'Officer Tasks',
      description: 'Assign tasks that officers see on their dashboard',
      to: '/admin/tasks',
      icon: <AssignmentIcon sx={{ fontSize: 28 }} />,
      badge: openTasks,
      badgeLabel: 'open',
    },
  ];

  return (
    <Box>
      <Typography variant="h2" sx={{ mb: 0.5 }}>
        👋 Hey, {user?.firstName || user?.name?.split(' ')[0]}!
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Admin dashboard
      </Typography>
      <Grid container spacing={2}>
        {items.map((item) => (
          <Grid key={item.to} size={{ xs: 12, sm: 6 }}>
            <Card
              variant="outlined"
              sx={{ height: '100%', borderColor: alpha(brand.primary, 0.3), bgcolor: alpha(brand.primary, 0.02) }}
            >
              <CardActionArea onClick={() => navigate(item.to)} sx={{ p: 2, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha(brand.primary, 0.1),
                      color: brand.primary,
                      display: 'flex',
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="h6" color="primary" sx={{ mb: 0.2 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.description}
                    </Typography>
                  </Box>
                  {!!item.badge && (
                    <Chip size="small" color="warning" label={`${item.badge} ${item.badgeLabel}`} sx={{ flexShrink: 0 }} />
                  )}
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
