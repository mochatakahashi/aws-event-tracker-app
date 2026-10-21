import { useState, type FormEvent, type ReactNode } from 'react';
import { LOGOS } from '../brandAssets';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import SiteFooter from '../components/SiteFooter';
import StudentIdField from '../components/StudentIdField';
import PasswordField from '../components/PasswordField';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CircularProgress from '@mui/material/CircularProgress';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { signUp } from '../services/authService';
import { notify } from '../services/notifyService';
import { notifyInApp } from '../services/notificationService';
import type { AccountType, Committee, OfficerPosition, Subcommittee } from '../types/auth';
import OfficerRoleFields from '../components/OfficerRoleFields';
import PasswordChecklist from '../components/PasswordChecklist';
import { positionNeedsCommittee, validateSignUp } from '../utils/people';

const TYPE_OPTIONS: { value: AccountType; label: string; hint: string; icon: ReactNode }[] = [
  { value: 'apc-student', label: 'APC Student', hint: 'Attendee from Asia Pacific College', icon: <SchoolRoundedIcon fontSize="small" /> },
  { value: 'outside', label: 'Outside Attendee', hint: 'From another school or organization', icon: <PublicRoundedIcon fontSize="small" /> },
  { value: 'officer', label: 'Officer', hint: 'AWS SBG-APC officer', icon: <VerifiedUserRoundedIcon fontSize="small" /> },
];

export default function SignUpPage() {
  const [accountType, setAccountType] = useState<AccountType>('apc-student');
  const [agreed, setAgreed] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [organization, setOrganization] = useState('');
  const [officerPosition, setOfficerPosition] = useState<OfficerPosition | ''>('');
  const [committee, setCommittee] = useState<Committee | ''>('');
  const [subcommittee, setSubcommittee] = useState<Subcommittee | ''>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const isApc = accountType !== 'outside';
  const isOfficer = accountType === 'officer';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const data = {
      accountType,
      firstName,
      middleInitial: middleInitial || undefined,
      lastName,
      email,
      personalEmail: isOfficer ? personalEmail || undefined : undefined,
      password,
      studentId: isApc ? studentId : undefined,
      organization: isApc ? undefined : organization,
      officerPosition: isOfficer ? officerPosition || undefined : undefined,
      committee: isOfficer && positionNeedsCommittee(officerPosition || undefined) ? committee || undefined : undefined,
      subcommittee: isOfficer && committee && subcommittee ? subcommittee : undefined,
      acceptedTerms: agreed,
    };
    const invalid = validateSignUp(data, confirmPassword);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (!agreed) {
      setError('Please agree to the Terms of Use and the Privacy Notice.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await signUp(data);
      // Let the admin know someone is waiting (email; ignored if it fails)
      void notify({ type: 'signup-pending', personId: created.personId }).catch(() => undefined);
      void notifyInApp({
        toRole: 'admin',
        kind: 'signup-pending',
        title: `New sign-up: ${created.name}`,
        message: `${created.email || created.username} is waiting for approval.`,
        link: '/admin',
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(180deg, ${brand.background} 0%, ${alpha(brand.secondary, 0.4)} 100%)`,
        p: 2,
      }}
    >
      {/* Logo */}
      <Box
        component="img"
        src={LOGOS.icon}
        alt="AWS SBG-APC"
        sx={{ width: 72, height: 72, borderRadius: '50%', mb: 2, border: '3px solid #fff', boxShadow: `0 8px 30px ${alpha(brand.primary, 0.3)}` }}
      />

      <Typography variant="h2" sx={{ mb: 0.5, fontWeight: 700 }}>
        Create Account
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Join AWS SBG-APC Event Tracker
      </Typography>

      {done ? (
        <Paper elevation={3} sx={{ p: 3.5, width: '100%', maxWidth: 440, textAlign: 'center' }}>
          <HourglassTopRoundedIcon sx={{ fontSize: 44, color: brand.primary, mb: 1 }} />
          <Typography variant="h3" sx={{ mb: 1 }}>
            Waiting for approval
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Your account was created. An admin needs to approve it before you can sign in
            {isOfficer ? ' as an officer' : ''}. Try signing in again once it's approved.
          </Typography>
          <Button component={RouterLink} to="/login" variant="contained" fullWidth>
            Back to Sign In
          </Button>
        </Paper>
      ) : (
        <Paper
          elevation={3}
          sx={{ p: { xs: 2.5, sm: 3.5 }, width: '100%', maxWidth: 440 }}
          component="form"
          onSubmit={handleSubmit}
          noValidate
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            I'm signing up as
          </Typography>
          <ToggleButtonGroup
            exclusive
            fullWidth
            orientation="vertical"
            value={accountType}
            onChange={(_e, v: AccountType | null) => {
              if (!v) return;
              setAccountType(v);
              setError(null);
            }}
            sx={{ mb: 1 }}
          >
            {TYPE_OPTIONS.map((opt) => (
              <ToggleButton
                key={opt.value}
                value={opt.value}
                sx={{
                  justifyContent: 'flex-start',
                  gap: 1.5,
                  textTransform: 'none',
                  py: 1,
                  textAlign: 'left',
                  '&.Mui-selected, &.Mui-selected:hover': {
                    bgcolor: alpha(brand.primary, 0.08),
                    color: brand.primary,
                    borderColor: alpha(brand.primary, 0.5),
                  },
                }}
              >
                {opt.icon}
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                    {opt.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {opt.hint}
                  </Typography>
                </Box>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {error && (
            <Alert severity="error" sx={{ mt: 1.5 }} role="alert">
              {error}
            </Alert>
          )}

          {/* Full name: First name, M.I., Last name */}
          <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
            <TextField
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              fullWidth
              margin="normal"
              required
              autoComplete="given-name"
            />
            <TextField
              label="M.I."
              value={middleInitial}
              onChange={(e) => setMiddleInitial(e.target.value.slice(0, 3))}
              margin="normal"
              sx={{ width: 84, flexShrink: 0 }}
              inputProps={{ maxLength: 3 }}
              helperText="Optional"
            />
          </Stack>
          <TextField
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            fullWidth
            margin="dense"
            required
            autoComplete="family-name"
          />

          <TextField
            label={isApc ? 'APC Email' : 'Email Address'}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            required
            autoComplete="email"
            placeholder={isApc ? 'you@student.apc.edu.ph' : 'you@gmail.com'}
            helperText={isApc ? 'Use your @apc.edu.ph or @student.apc.edu.ph email' : 'Any personal or work email'}
          />

          {isOfficer && (
            <TextField
              label="Personal Email"
              type="email"
              value={personalEmail}
              onChange={(e) => setPersonalEmail(e.target.value)}
              fullWidth
              margin="normal"
              placeholder="you@gmail.com"
              helperText="Optional - e.g. your Gmail"
            />
          )}

          {isApc ? (
            <StudentIdField label="APC Student ID" value={studentId} onChange={setStudentId} fullWidth margin="normal" required />
          ) : (
            <TextField
              label="School / Organization"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              fullWidth
              margin="normal"
              required
              placeholder="e.g. Mapúa University, AWS Cloud Club PH"
            />
          )}

          {isOfficer && (
            <OfficerRoleFields
              value={{ officerPosition, committee, subcommittee }}
              onChange={(v) => {
                setOfficerPosition(v.officerPosition);
                setCommittee(v.committee);
                setSubcommittee(v.subcommittee);
              }}
            />
          )}

          <PasswordField
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
            autoComplete="new-password"
          />
          <PasswordChecklist password={password} />
          <PasswordField
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
            autoComplete="new-password"
          />

          <FormControlLabel
            sx={{ mt: 1.5, alignItems: 'flex-start', '& .MuiCheckbox-root': { pt: 0.25 } }}
            control={<Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} inputProps={{ 'aria-label': 'I agree to the Terms of Use and the Privacy Notice' }} />}
            label={
              <Typography variant="body2">
                I agree to the{' '}
                <Link component={RouterLink} to="/terms" target="_blank" sx={{ fontWeight: 600 }}>
                  Terms of Use
                </Link>{' '}
                and the{' '}
                <Link component={RouterLink} to="/privacy" target="_blank" sx={{ fontWeight: 600 }}>
                  Privacy Notice
                </Link>
                , and to AWS SBG-APC using my details for its events.
              </Typography>
            }
          />

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            New accounts are reviewed by an admin before you can sign in.
          </Typography>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{ mt: 2, py: 1.4, fontSize: '1rem' }}
          >
            {submitting ? 'Creating account…' : 'Create Account'}
          </Button>

          <Typography variant="body2" sx={{ mt: 2.5, textAlign: 'center', color: brand.textSecondary }}>
            Already have an account?{' '}
            <Link component={RouterLink} to="/login" sx={{ color: brand.primary, fontWeight: 600 }}>
              Sign In
            </Link>
          </Typography>
        </Paper>
      )}

      <Link component={RouterLink} to="/" variant="body2" sx={{ mt: 3, color: brand.textSecondary }}>
        ← Back to home
      </Link>
      <SiteFooter />
    </Box>
  );
}
