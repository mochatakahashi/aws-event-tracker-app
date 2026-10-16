import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import HighlightOffRoundedIcon from '@mui/icons-material/HighlightOffRounded';
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import EventOrganizerLogo from '../components/EventOrganizerLogo';
import { normalizeCertificateId, verifyCertificate, type CertificateCheck } from '../services/registrationService';

const STATUS = {
  valid: {
    icon: <VerifiedRoundedIcon sx={{ fontSize: 40 }} />,
    color: brand.success,
    title: 'Verified certificate',
    text: 'This certificate was issued by AWS Student Builder Group – Asia Pacific College.',
  },
  revoked: {
    icon: <ReportProblemRoundedIcon sx={{ fontSize: 40 }} />,
    color: brand.warning,
    title: 'Certificate no longer valid',
    text: 'This certificate was issued but later withdrawn (the check-in was undone).',
  },
  'not-found': {
    icon: <HighlightOffRoundedIcon sx={{ fontSize: 40 }} />,
    color: brand.error,
    title: 'Certificate not found',
    text: 'No certificate with this ID was issued by AWS SBG-APC. Check the ID for typos.',
  },
  invalid: {
    icon: <HighlightOffRoundedIcon sx={{ fontSize: 40 }} />,
    color: brand.error,
    title: 'Not a certificate ID',
    text: 'Certificate IDs look like CERT-2026-ABCD2345.',
  },
} as const;

/** Public page: anyone can confirm a certificate of participation is real. */
export default function VerifyCertificatePage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [input, setInput] = useState(id ? decodeURIComponent(id) : '');
  const [result, setResult] = useState<CertificateCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setResult(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setError('');
    setInput(decodeURIComponent(id));
    verifyCertificate(id)
      .then((r) => alive && setResult(r))
      .catch((e) => alive && setError(e instanceof Error ? e.message : 'Could not check the certificate.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const clean = normalizeCertificateId(input) || input.trim();
    if (clean) navigate(`/verify/${encodeURIComponent(clean)}`);
  }

  const s = result ? STATUS[result.status] : null;
  const issued = result?.issuedAt
    ? new Date(result.issuedAt).toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', px: 2, py: { xs: 3, sm: 6 } }}>
      <Box sx={{ maxWidth: 620, mx: 'auto' }}>
        <Box sx={{ mb: 3 }}>
          <EventOrganizerLogo size="medium" showSubtitle />
        </Box>
        <Typography variant="h1" sx={{ mb: 0.5 }}>
          Verify a certificate
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Enter the Certificate ID printed on an AWS SBG-APC certificate of participation, or scan the QR code on it.
        </Typography>

        <Paper component="form" onSubmit={submit} sx={{ p: 2, borderRadius: '16px', mb: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              fullWidth
              size="small"
              label="Certificate ID"
              placeholder="CERT-2026-ABCD2345"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              inputProps={{ style: { textTransform: 'uppercase', fontFamily: 'monospace' }, 'aria-label': 'Certificate ID' }}
            />
            <Button type="submit" variant="contained" disabled={!input.trim() || loading} sx={{ px: 4, flexShrink: 0 }}>
              Verify
            </Button>
          </Stack>
        </Paper>

        {loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {error && !loading && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {result && s && !loading && (
          <Paper
            sx={{
              borderRadius: '20px',
              overflow: 'hidden',
              border: `2px solid ${alpha(s.color, 0.5)}`,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 2.5, bgcolor: alpha(s.color, 0.08), color: s.color }}>
              {s.icon}
              <Box>
                <Typography variant="h3" sx={{ color: s.color, fontWeight: 800 }}>
                  {s.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {s.text}
                </Typography>
              </Box>
            </Stack>
            {(result.status === 'valid' || result.status === 'revoked') && (
              <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <WorkspacePremiumRoundedIcon sx={{ color: brand.primary }} />
                  <Typography variant="overline" sx={{ fontWeight: 700, color: brand.primary }}>
                    Certificate of Participation
                  </Typography>
                </Stack>
                <Typography variant="h2" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {result.name}
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  attended and actively participated in
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {result.eventTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {[result.eventDate, result.venue].filter(Boolean).join(' · ')}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 3 }}>
                  <Typography variant="body2">
                    <strong>Certificate ID:</strong> <Box component="span" sx={{ fontFamily: 'monospace' }}>{result.certificateId}</Box>
                  </Typography>
                  {issued && (
                    <Typography variant="body2">
                      <strong>Issued:</strong> {issued}
                    </Typography>
                  )}
                </Stack>
              </Box>
            )}
          </Paper>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 4, textAlign: 'center' }}>
          AWS Student Builder Group – Asia Pacific College ·{' '}
          <Link component={RouterLink} to="/">
            Event Tracker
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
