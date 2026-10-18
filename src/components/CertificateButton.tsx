import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router-dom';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { certificateLink, certificateShareLink, certificateState } from '../services/registrationService';
import type { Registration } from '../types/attendee';
import type { AppEvent } from '../types/event';

const when = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'the event ends';

/**
 * Certificate of participation: unlocks after the event ends, only for people
 * checked in at it. Then: View, Download, and a shareable link with the unique code.
 */
export default function CertificateButton({
  registration,
  personId,
  event,
}: {
  registration: Registration;
  personId: string;
  event: Pick<AppEvent, 'startAt' | 'endAt'> | null | undefined;
}) {
  const state = certificateState(registration, event);
  const [links, setLinks] = useState<{ view: string; download: string } | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const code = registration.certificateId;

  useEffect(() => {
    if (state !== 'ready') return;
    Promise.all([certificateLink(registration.id, personId), certificateLink(registration.id, personId, true)])
      .then(([view, download]) => setLinks(view && download ? { view, download } : null))
      .catch(() => setLinks(null));
  }, [registration.id, personId, state]);

  if (state !== 'ready') {
    const text =
      state === 'after-event'
        ? `You're checked in. Your certificate unlocks after the event ends (${when(event?.endAt)}).`
        : state === 'needs-check-in'
          ? 'Get checked in at the event to earn a certificate. It unlocks after the event ends.'
          : "No certificate for this event — you weren't checked in at the venue.";
    return (
      <Box
        data-testid="certificate-locked"
        sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, color: 'text.secondary', p: 1.5, borderRadius: '12px', bgcolor: alpha(brand.primary, 0.04) }}
      >
        <LockOutlinedIcon fontSize="small" sx={{ mt: 0.25 }} />
        <Typography variant="body2">{text}</Typography>
      </Box>
    );
  }

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(certificateShareLink(code));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the Verify link still works */
    }
  }

  return (
    <Box data-testid="certificate-ready">
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <WorkspacePremiumIcon sx={{ color: brand.primary }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Your certificate is ready
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<VisibilityRoundedIcon />}
          disabled={!links}
          component="a"
          href={links?.view}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ borderRadius: '12px', fontWeight: 700 }}
        >
          View
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<DownloadRoundedIcon />}
          disabled={!links}
          component="a"
          href={links?.download}
          download
          sx={{ borderRadius: '12px', fontWeight: 700 }}
        >
          Download
        </Button>
      </Stack>
      {code && (
        <Box sx={{ mt: 1.25, p: 1.25, borderRadius: '12px', bgcolor: alpha(brand.primary, 0.05) }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Certificate code
          </Typography>
          <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 0.5 }} data-testid="certificate-code">
            {code}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
            <Button size="small" startIcon={<LinkRoundedIcon />} onClick={() => void copy()}>
              {copied ? 'Link copied!' : 'Copy link'}
            </Button>
            <Link component={RouterLink} to={`/verify/${code}`} variant="body2">
              Open certificate page
            </Link>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Anyone with the link can check it's genuine and view or download it.
          </Typography>
        </Box>
      )}
      {links === null && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
          Certificates open from the deployed app.
        </Typography>
      )}
    </Box>
  );
}
