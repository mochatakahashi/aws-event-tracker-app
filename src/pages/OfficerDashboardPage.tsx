import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { getStamps, getSessions, approveStamp, declineStamp } from '../services/sessionService';
import { getPeople } from '../services/registrationService';
import { useAuth } from '../context/AuthContext';
import type { Stamp, Session } from '../types/session';
import type { Person } from '../types/attendee';

export default function OfficerDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [pendingStamps, setPendingStamps] = useState<Stamp[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'officer') {
      navigate('/home');
      return;
    }

    Promise.all([getStamps(), getSessions(), getPeople()])
      .then(([stmps, sess, ppl]) => {
        setPendingStamps(stmps.filter(s => s.status === 'pending'));
        setSessions(sess);
        setPeople(ppl);
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  async function handleApprove(stampId: string) {
    if (!user?.personId) return;
    try {
      await approveStamp(stampId, user.personId);
      setPendingStamps(prev => prev.filter(s => s.id !== stampId));
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDecline(stampId: string) {
    try {
      await declineStamp(stampId);
      setPendingStamps(prev => prev.filter(s => s.id !== stampId));
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h2" sx={{ mb: 3 }}>
        Officer Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Review and approve pending stamp requests from attendees.
      </Typography>

      {pendingStamps.length === 0 ? (
        <Typography color="text.secondary">No pending stamp requests.</Typography>
      ) : (
        <Stack spacing={2}>
          {pendingStamps.map(stamp => {
            const session = sessions.find(s => s.id === stamp.sessionId);
            const attendee = people.find(p => p.id === stamp.attendeeId);

            return (
              <Card key={stamp.id} variant="outlined">
                <CardContent>
                  <Typography variant="h6">{session?.title || 'Unknown Session'}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Requested by: <strong>{attendee?.name || stamp.attendeeId}</strong>
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button 
                      variant="contained" 
                      color="success" 
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleApprove(stamp.id)}
                    >
                      Approve
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => handleDecline(stamp.id)}
                    >
                      Decline
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
