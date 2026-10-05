import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import DownloadIcon from '@mui/icons-material/Download';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { getUsers, updateUserRole } from '../services/authService';
import { getStamps, getSessions } from '../services/sessionService';
import { useAuth } from '../context/AuthContext';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import type { User } from '../types/auth';
import type { Stamp, Session } from '../types/session';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [users, setUsers] = useState<User[]>([]);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/home');
      return;
    }

    Promise.all([getUsers(), getStamps(), getSessions()])
      .then(([usersData, stampsData, sessionsData]) => {
        setUsers(usersData);
        setStamps(stampsData);
        setSessions(sessionsData);
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  async function handleRoleChange(username: string, newRole: 'admin' | 'officer' | 'attendee') {
    try {
      const updated = await updateUserRole(username, newRole);
      setUsers(prev => prev.map(u => u.username === username ? updated : u));
    } catch (e) {
      console.error(e);
    }
  }

  const pendingRequests = users.filter(u => u.requestedRole != null);
  const activeUsers = users.filter(u => u.requestedRole == null);
  
  const approvedStamps = stamps.filter(s => s.status === 'approved');

  function exportToCsv() {
    const headers = ['Student Name', 'Student ID', 'Session Title', 'Approved By', 'Approved At'];
    const rows = approvedStamps.map(stamp => {
      const attendee = users.find(u => u.personId === stamp.attendeeId);
      const session = sessions.find(s => s.id === stamp.sessionId);
      const officer = users.find(u => u.personId === stamp.approvedBy);
      return [
        `"${attendee?.name || 'Unknown'}"`,
        `"${attendee?.studentId || 'N/A'}"`,
        `"${session?.title || 'Unknown Session'}"`,
        `"${officer?.name || 'Unknown'}"`,
        `"${stamp.approvedAt || ''}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `aws-sbg-apc-attendance-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="h2">
          Manage Accounts
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<DownloadIcon />} 
          onClick={exportToCsv}
          sx={{ background: brand.gradient, borderRadius: 2 }}
        >
          Export Attendance (CSV)
        </Button>
      </Stack>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Organization control panel. Manage users and approve role requests.
      </Typography>

      {/* Analytics */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AnalyticsIcon /> Analytics Overview
        </Typography>
        <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
          <Card variant="outlined" sx={{ minWidth: 160, flex: 1, borderColor: alpha(brand.primary, 0.2), bgcolor: alpha(brand.primary, 0.02) }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Total Users</Typography>
              <Typography variant="h4" sx={{ color: brand.primary, mt: 1 }}>{users.length}</Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ minWidth: 160, flex: 1, borderColor: alpha(brand.success, 0.2), bgcolor: alpha(brand.success, 0.02) }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Total Approved Stamps</Typography>
              <Typography variant="h4" sx={{ color: brand.success, mt: 1 }}>{approvedStamps.length}</Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ minWidth: 160, flex: 1, borderColor: alpha(brand.warning, 0.2), bgcolor: alpha(brand.warning, 0.02) }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Pending Role Requests</Typography>
              <Typography variant="h4" sx={{ color: brand.warning, mt: 1 }}>{pendingRequests.length}</Typography>
            </CardContent>
          </Card>
        </Stack>
      </Box>

      {pendingRequests.length > 0 && (
        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            Pending Role Requests
            <Chip label={pendingRequests.length} color="error" size="small" />
          </Typography>
          <Stack spacing={2}>
            {pendingRequests.map(u => (
              <Card key={u.username} variant="outlined" sx={{ borderColor: 'error.main' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6">{u.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {u.username}
                    </Typography>
                    <Chip label={`Requested: ${u.requestedRole?.toUpperCase()}`} size="small" color="primary" variant="outlined" />
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button 
                      variant="outlined" 
                      color="error"
                      onClick={() => handleRoleChange(u.username, 'attendee')}
                    >
                      Deny
                    </Button>
                    <Button 
                      variant="contained" 
                      onClick={() => handleRoleChange(u.username, u.requestedRole as 'officer' | 'admin')}
                    >
                      Approve
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
      )}

      <Typography variant="h3" sx={{ mb: 2 }}>
        All Users
      </Typography>
      <Stack spacing={2}>
        {activeUsers.map(u => (
          <Card key={u.username} variant="outlined">
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6">{u.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {u.username} • {stamps.filter(s => s.attendeeId === u.personId && s.status === 'approved').length} Stamps Earned
                </Typography>
              </Box>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.username, e.target.value as any)}
                  disabled={u.username === user?.username} // prevent self-demotion in UI easily
                >
                  <MenuItem value="attendee">Attendee</MenuItem>
                  <MenuItem value="officer">Officer</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
