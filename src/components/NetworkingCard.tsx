import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import type { SocialLinks } from '../types/auth';
import { profileLink } from '../utils/pass';
import SocialLinksRow from './SocialLinksRow';

interface NetworkingCardProps {
  open?: boolean;
  onClose?: () => void;
  personId: string;
  name: string;
  subtitle?: string;
  bio?: string;
  socials?: SocialLinks;
}

/**
 * "My networking card": a QR code that opens your profile summary in the app
 * (name, bio, every social link and achievements), not just one link.
 */
export default function NetworkingCard({ open = true, onClose, personId, name, subtitle, bio, socials }: NetworkingCardProps) {
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  const link = profileLink(personId);

  useEffect(() => {
    let alive = true;
    import('qrcode')
      .then((QR) => QR.toDataURL(link, { margin: 1, width: 440, color: { dark: '#1A0A2E', light: '#FFFFFF' } }))
      .then((url) => alive && setQr(url))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [link]);

  if (!open) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <Card
      variant="outlined"
      sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: `0 4px 20px ${alpha(brand.primary, 0.08)}`, mb: 3 }}
    >
      <Box sx={{ background: brand.gradientDark, color: '#fff', p: 3, position: 'relative', textAlign: 'center' }}>
        {onClose && (
          <IconButton onClick={onClose} aria-label="Close" sx={{ position: 'absolute', top: 8, right: 8, color: 'rgba(255,255,255,0.7)' }}>
            <CloseIcon />
          </IconButton>
        )}
        <Typography variant="h6" sx={{ color: brand.accent, mb: 0.5, fontSize: '0.75rem', letterSpacing: '0.1em' }}>
          MY NETWORKING CARD
        </Typography>
        <Typography variant="h2" sx={{ color: '#fff', fontWeight: 700 }}>
          {name}
        </Typography>
        {subtitle && <Typography variant="body2" sx={{ color: alpha('#fff', 0.8) }}>{subtitle}</Typography>}
      </Box>

      <CardContent sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Let someone scan this from <strong>Connect → Scan QR</strong> (or any camera) to see your profile, links and
          achievements — and add you as a connection.
        </Typography>
        <Box sx={{ display: 'inline-flex', p: 1.5, borderRadius: 3, border: `1px solid ${alpha(brand.primary, 0.15)}`, mb: 2 }}>
          {qr ? (
            <Box component="img" src={qr} alt={`QR code for ${name}'s profile`} sx={{ width: 220, height: 220, display: 'block' }} />
          ) : (
            <Box sx={{ width: 220, height: 220, display: 'grid', placeItems: 'center' }}>
              <CircularProgress size={28} />
            </Box>
          )}
        </Box>
        {bio && (
          <Typography variant="body2" sx={{ mb: 1.5, whiteSpace: 'pre-line' }}>
            {bio}
          </Typography>
        )}
        <SocialLinksRow socials={socials} />
        <Stack direction="row" justifyContent="center" sx={{ mt: 1.5 }}>
          <Button size="small" startIcon={<ContentCopyIcon />} onClick={copy}>
            {copied ? 'Link copied!' : 'Copy profile link'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
