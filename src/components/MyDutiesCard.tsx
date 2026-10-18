import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Badge from '@mui/material/Badge';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded';
import { alpha } from '@mui/material/styles';
import { PARTNER } from '../theme/theme';
import { getEvents } from '../services/eventService';
import { canDo, staffEvents, type StaffActor } from '../utils/eventStaff';
import { useDeskCounts } from '../hooks/useDeskCounts';
import type { AppEvent } from '../types/event';

/**
 * Co-organizer staff: the events they work and what they may do there
 * (check-in and/or stamps), with a shortcut to the Event Desk.
 */
export default function MyDutiesCard({ user }: { user: StaffActor & { partnerOrg?: string | null } }) {
  const navigate = useNavigate();
  const desk = useDeskCounts(user);
  const [events, setEvents] = useState<AppEvent[]>([]);

  useEffect(() => {
    getEvents()
      .then((all) => setEvents(staffEvents(user, all).filter((e) => e.status !== 'cancelled' && e.status !== 'accomplished')))
      .catch(() => setEvents([]));
  }, [user]);

  return (
    <Card
      variant="outlined"
      sx={{ mb: 3, borderRadius: '16px', borderColor: alpha(PARTNER, 0.35), bgcolor: alpha(PARTNER, 0.04) }}
      data-testid="my-duties-card"
    >
      <CardContent sx={{ '&:last-child': { pb: 2 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
          <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: alpha(PARTNER, 0.12), color: PARTNER, display: 'flex', alignSelf: 'flex-start' }}>
            <HandshakeOutlinedIcon />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Co-organizer staff · {user.partnerOrg}
            </Typography>
            {events.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                You’re not on any event’s staff list yet. An admin adds you for check-in or stamps on a co-organized event.
              </Typography>
            ) : (
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                {events.map((e) => (
                  <Chip
                    key={e.id}
                    size="small"
                    variant="outlined"
                    onClick={() => navigate(`/officer/scan?event=${e.id}`)}
                    label={`${e.title}: ${[canDo(user, e, 'checkin') && 'check-in', canDo(user, e, 'stamps') && 'stamps'].filter(Boolean).join(' + ')}`}
                  />
                ))}
              </Stack>
            )}
          </Box>
          {events.length > 0 && (
            <Badge color="error" badgeContent={desk.pendingStamps} max={99}>
              <Button variant="contained" startIcon={<QrCodeScannerRoundedIcon />} onClick={() => navigate('/officer/scan')}>
                Open Event Desk
              </Button>
            </Badge>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
