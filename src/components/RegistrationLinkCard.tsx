import { useEffect, useState } from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import { alpha } from '@mui/material/styles';
import QRCode from 'qrcode';
import { brand } from '../theme/theme';
import { eventRegisterLink } from './ShareEventButton';
import type { AppEvent } from '../types/event';

/**
 * Admin: the event's registration link, made automatically for every event.
 * Copy it for posts and pubmats, or download a QR code for posters.
 */
export default function RegistrationLinkCard({ event, compact = false }: { event: Pick<AppEvent, 'id' | 'title'>; compact?: boolean }) {
  const [link, setLink] = useState('');
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    eventRegisterLink(event.id)
      .then(async (url) => {
        if (!alive) return;
        setLink(url);
        const png = await QRCode.toDataURL(url, { width: 1024, margin: 2, color: { dark: '#2b1840', light: '#ffffff' } });
        if (alive) setQr(png);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [event.id]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* the link is selectable in the box */
    }
  }

  const fileName = `${event.title.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'event'}-registration-qr.png`;

  return (
    <Paper
      variant="outlined"
      data-testid="registration-link"
      sx={{ p: 2, mb: compact ? 0 : 3, borderRadius: '14px', borderColor: alpha(brand.primary, 0.3), bgcolor: alpha(brand.primary, 0.03) }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
        {qr && (
          <Box
            component="img"
            src={qr}
            alt={`QR code to register for ${event.title}`}
            sx={{ width: 112, height: 112, borderRadius: '10px', border: `1px solid ${alpha(brand.primary, 0.15)}`, bgcolor: '#fff', alignSelf: { xs: 'center', sm: 'auto' } }}
          />
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <HowToRegRoundedIcon sx={{ color: brand.primary }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Registration link
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
            Made automatically for this event. People who open it sign in (or sign up) and register with one tap. Put it in posts, or the QR code on posters.
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={link}
            inputProps={{ readOnly: true, 'aria-label': 'Registration link' }}
            onFocus={(e) => e.target.select()}
            sx={{ mb: 1.25, '& input': { fontSize: '0.85rem' } }}
          />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button size="small" variant="contained" startIcon={<ContentCopyRoundedIcon />} onClick={() => void copy()} disabled={!link}>
              {copied ? 'Copied' : 'Copy link'}
            </Button>
            <Button size="small" variant="outlined" startIcon={<QrCode2RoundedIcon />} component="a" href={qr || undefined} download={fileName} disabled={!qr}>
              Download QR
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}
