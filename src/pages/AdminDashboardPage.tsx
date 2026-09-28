import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import { getUsers, updateUserRole } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types/auth';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/home');
      return;
    }

    getUsers()
      .then(setUsers)
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

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h2" sx={{ mb: 3 }}>
        Admin Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage user roles. Grant officer access to attendees.
      </Typography>

      <Stack spacing={2}>
        {users.map(u => (
          <Card key={u.username} variant="outlined">
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6">{u.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {u.username}
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
