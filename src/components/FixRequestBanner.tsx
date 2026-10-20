import { useLocation, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import { useAuth } from '../context/AuthContext';
import { FIX_FIELD_LABELS } from '../utils/people';

/**
 * Shown on every page while an admin's request to fix profile details is
 * open. Each item disappears once the person saves a new value for it.
 */
export default function FixRequestBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const fr = user?.fixRequest;
  if (!fr || !fr.fields?.length) return null;
  const onProfile = pathname === '/profile';
  return (
    <Alert
      severity="warning"
      data-testid="fix-request-banner"
      sx={{ mb: 2, borderRadius: 2 }}
      action={
        !onProfile ? (
          <Button color="inherit" size="small" onClick={() => navigate('/profile?edit=1')} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
            Update profile
          </Button>
        ) : undefined
      }
    >
      <AlertTitle sx={{ fontWeight: 800 }}>Please update your profile</AlertTitle>
      An admin asked you to fix: <b>{fr.fields.map((f) => FIX_FIELD_LABELS[f]).join(', ')}</b>.
      {fr.note ? ` Note: ${fr.note}` : ''}
      {onProfile ? ' Tap Edit profile, fix it and save.' : ''}
    </Alert>
  );
}
