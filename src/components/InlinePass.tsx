import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { passLink } from '../utils/pass';
import type { Registration } from '../types/attendee';

/** Small event pass QR shown on the event page once you're registered. */
export default function InlinePass({ registration, onOpen }: { registration: Registration; onOpen: () => void }) {
  const [qr, setQr] = useState('');
  useEffect(() => {
    let alive = true;
    import('qrcode')
      .then((QR) => QR.toDataURL(passLink(registration.id), { margin: 1, width: 360, color: { dark: '#1A0A2E', light: '#FFFFFF' } }))
      .then((url) => alive && setQr(url))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [registration.id]);

  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      sx={{ p: 1.25, borderRadius: '14px', border: `1px solid ${alpha(brand.primary, 0.2)}`, bgcolor: alpha(brand.primary, 0.03) }}
    >
      <Box sx={{ width: 96, height: 96, flexShrink: 0, display: 'grid', placeItems: 'center', bgcolor: '#fff', borderRadius: 2 }}>
        {qr ? (
          <Box component="img" src={qr} alt="Your event pass QR code" sx={{ width: 96, height: 96 }} />
        ) : (
          <CircularProgress size={20} />
        )}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          Your event pass
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          {registration.checkedIn ? 'Checked in ✓' : 'Show this at the registration booth to check in.'}
        </Typography>
        <Button size="small" onClick={onOpen} sx={{ px: 0 }}>
          Open full pass
        </Button>
      </Box>
    </Stack>
  );
}
