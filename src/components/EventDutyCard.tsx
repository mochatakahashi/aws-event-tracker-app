import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Badge from '@mui/material/Badge';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded';
import StarsRoundedIcon from '@mui/icons-material/StarsRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { canDo, isPartnerStaff, type StaffActor } from '../utils/eventStaff';
import { getSessionsByEvent, getStamps } from '../services/sessionService';
import { getRegistrationsByEvent } from '../services/registrationService';
import type { AppEvent } from '../types/event';

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * "Your access at this event" — shown on the event page to an officer (or
 * co-organizer staff) an admin put on the staff list: their role, what they
 * may do (check-in, stamps) and shortcuts with the waiting counts.
 */
export default function EventDutyCard({ event, user }: { event: AppEvent; user: StaffActor | null | undefined }) {
  const navigate = useNavigate();
  const [pendingStamps, setPendingStamps] = useState(0);
  const [pendingRegs, setPendingRegs] = useState(0);
  const onTeam = Boolean(user?.personId && (event.officerIds ?? []).includes(user.personId));
  const stamps = canDo(user, event, 'stamps');
  const checkin = canDo(user, event, 'checkin');
  const show = user?.role !== 'admin' && (user?.role === 'officer' || isPartnerStaff(user)) && (onTeam || stamps || checkin);

  useEffect(() => {
    if (!show) return;
    if (stamps) {
      Promise.all([getSessionsByEvent(event.id), getStamps()])
        .then(([sess, all]) => {
          const ids = new Set(sess.map((s) => s.id));
          setPendingStamps(all.filter((s) => s.status === 'pending' && ids.has(s.sessionId)).length);
        })
        .catch(() => undefined);
    }
    if (checkin) {
      getRegistrationsByEvent(event.id)
        .then((regs) => setPendingRegs(regs.filter((r) => r.rsvp === 'pending').length))
        .catch(() => undefined);
    }
  }, [show, stamps, checkin, event.id]);

  if (!show || !user?.personId) return null;
  const role = event.officerRoles?.[user.personId];
  const over = event.status === 'accomplished' || event.status === 'cancelled';

  return (
    <Card
      variant="outlined"
      sx={{ mb: 3, borderRadius: '16px', borderColor: alpha(brand.primary, 0.35), bgcolor: alpha(brand.primary, 0.03) }}
      data-testid="event-duty-card"
    >
      <CardContent sx={{ '&:last-child': { pb: 2 } }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
          <BadgeRoundedIcon sx={{ color: brand.primary }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 800, flex: 1 }}>
            Your access at this event
          </Typography>
          {role && <Chip size="small" label={titleCase(role)} color="primary" variant="outlined" />}
        </Stack>
        {!stamps && !checkin ? (
          <Typography variant="body2" color="text.secondary">
            You’re on the event team{role ? ` as ${titleCase(role)}` : ''}. You don’t have check-in or stamp access here — an admin can
            add it on this page.
          </Typography>
        ) : (
          <>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }} data-testid="event-duties">
              {checkin && <Chip size="small" color="success" icon={<HowToRegRoundedIcon />} label="Check people in & approve registrations" />}
              {stamps && <Chip size="small" color="primary" icon={<StarsRoundedIcon />} label="Approve stamps" />}
            </Stack>
            {over ? (
              <Typography variant="body2" color="text.secondary">
                This event is over.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {checkin && (
                  <Button variant="contained" startIcon={<QrCodeScannerRoundedIcon />} onClick={() => navigate(`/officer/scan?event=${event.id}&tab=scan`)}>
                    Check people in
                  </Button>
                )}
                {checkin && (
                  <Badge color="error" badgeContent={pendingRegs}>
                    <Button variant="outlined" startIcon={<HowToRegRoundedIcon />} onClick={() => navigate(`/officer/scan?event=${event.id}&tab=attendees`)}>
                      Registrations
                    </Button>
                  </Badge>
                )}
                {stamps && (
                  <Badge color="error" badgeContent={pendingStamps}>
                    <Button variant="outlined" startIcon={<StarsRoundedIcon />} onClick={() => navigate(`/officer/scan?event=${event.id}&tab=stamps`)}>
                      Stamp requests
                    </Button>
                  </Badge>
                )}
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
