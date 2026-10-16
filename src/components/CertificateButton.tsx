import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router-dom';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { certificateLink } from '../services/registrationService';
import type { Registration } from '../types/attendee';

/** Download button for the certificate of participation (unlocked at check-in). */
export default function CertificateButton({ registration, personId }: { registration: Registration; personId: string }) {
  const [href, setHref] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!registration.checkedIn) return;
    certificateLink(registration.id, personId).then(setHref).catch(() => setHref(null));
  }, [registration.id, registration.checkedIn, personId]);

  if (!registration.checkedIn) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
        <LockOutlinedIcon fontSize="small" />
        <Typography variant="body2">Your certificate unlocks once you're checked in at the venue.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Button
        fullWidth
        variant="contained"
        startIcon={<WorkspacePremiumIcon />}
        disabled={!href}
        component="a"
        href={href || undefined}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ borderRadius: '12px', fontWeight: 700 }}
      >
        Download Certificate
      </Button>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75, textAlign: 'center' }}>
        {href === null
          ? 'Certificates download from the deployed app.'
          : registration.certificateId
            ? <>
                Certificate ID: {registration.certificateId} ·{' '}
                <Link component={RouterLink} to={`/verify/${registration.certificateId}`}>
                  Verify
                </Link>
              </>
            : 'Certificate of participation (PDF)'}
      </Typography>
    </Box>
  );
}
