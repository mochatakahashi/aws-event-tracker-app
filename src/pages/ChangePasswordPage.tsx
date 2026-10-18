import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockResetIcon from '@mui/icons-material/LockReset';
import { brand } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import EventOrganizerLogo from '../components/EventOrganizerLogo';
import ChangePasswordForm from '../components/ChangePasswordForm';

/**
 * Change password. Accounts an admin created (or reset) land here first and
 * can't use the app until they set their own password.
 */
export default function ChangePasswordPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const forced = Boolean(user?.mustChangePassword);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', px: 2, py: { xs: 3, sm: 6 } }}>
      <Box sx={{ maxWidth: 520, mx: 'auto' }}>
        <Box sx={{ mb: 3 }}>
          <EventOrganizerLogo size="medium" showSubtitle />
        </Box>
        {!forced && (
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 1 }}>
            Back
          </Button>
        )}
        <Paper sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: '20px' }}>
          <Typography variant="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <LockResetIcon sx={{ color: brand.primary }} /> {forced ? 'Set your own password' : 'Change password'}
          </Typography>
          {forced ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Welcome, {user?.firstName || user?.name}! Your account was set up with a temporary password. Choose your own
              password to continue.
            </Alert>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter your current password, then your new one.
            </Typography>
          )}
          <ChangePasswordForm
            currentLabel={forced ? 'Temporary password' : 'Current password'}
            onDone={() => navigate('/home', { replace: true })}
          />
        </Paper>
        {forced && (
          <Button
            sx={{ mt: 2 }}
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
          >
            Sign out
          </Button>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          Forgot your password? Ask an AWS SBG-APC admin to give you a temporary one.
        </Typography>
      </Box>
    </Box>
  );
}
