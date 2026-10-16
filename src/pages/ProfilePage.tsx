import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { brand } from '../theme/theme';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import LockResetIcon from '@mui/icons-material/LockReset';
import GroupsIcon from '@mui/icons-material/Groups';
import BusinessIcon from '@mui/icons-material/Business';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import { uploadImageToS3 } from '../services/storageService';
import { changePassword, updateProfile } from '../services/authService';
import { memberLabel, officerTitle } from '../utils/people';
import AvatarImageAdjuster from '../components/AvatarImageAdjuster';

export default function ProfilePage() {
  const { user, setCurrentUser } = useAuth();

  // Change password
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSavingPassword(true);
    setPasswordMsg(null);
    try {
      await changePassword(user.personId, currentPassword, newPassword);
      setPasswordMsg({ ok: true, text: 'Password changed.' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not change password.' });
    } finally {
      setSavingPassword(false);
    }
  }

  // Profile photo state
  const [adjustSource, setAdjustSource] = useState<File | string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatarUrl || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const roleIcon =
    user?.role === 'admin' ? <AdminPanelSettingsIcon sx={{ fontSize: 20 }} /> :
    user?.role === 'officer' ? <VerifiedUserIcon sx={{ fontSize: 20 }} /> :
    <PersonIcon sx={{ fontSize: 20 }} />;

  const roleLabel =
    user?.role === 'admin' ? 'Administrator' :
    user?.role === 'officer' ? 'Officer' :
    'Attendee';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setAdjustSource(file);
  };

  const handleCropAndUpload = async (croppedFile: File) => {
    setUploadingAvatar(true);
    setUploadProgress(0);
    try {
      const s3Url = await uploadImageToS3(croppedFile, (pct) => setUploadProgress(pct));
      // Save it on the account so every login and device sees the new photo
      if (user) setCurrentUser(await updateProfile(user.personId, { avatarUrl: s3Url }));
      setAvatarUrl(s3Url);
      setAdjustSource(null);
    } catch (err: any) {
      alert(err.message || 'Failed to upload profile photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const infoRows: { label: string; value: ReactNode; icon: ReactNode }[] = [
    { label: 'Full Name', value: user?.name, icon: <PersonIcon /> },
    { label: 'Email', value: user?.email || user?.username, icon: <EmailIcon /> },
  ];
  if (user?.personalEmail) {
    infoRows.push({ label: 'Personal Email', value: user.personalEmail, icon: <AlternateEmailIcon /> });
  }
  if (user) {
    infoRows.push({ label: 'Member Type', value: memberLabel(user), icon: <BadgeIcon /> });
  }
  if (user?.memberType === 'outside') {
    infoRows.push({ label: 'School / Organization', value: user.organization || '—', icon: <BusinessIcon /> });
  } else if (user?.studentId) {
    infoRows.push({ label: 'Student ID', value: user.studentId, icon: <SchoolIcon /> });
  }
  if (user?.role === 'officer') {
    infoRows.push({ label: 'Officer Position', value: officerTitle(user), icon: <GroupsIcon /> });
  }

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 3 }}>
        My Profile
      </Typography>

      {/* Avatar adjuster — shown when a file is selected or re-adjusting */}
      {adjustSource && (
        <Box sx={{ mb: 3, maxWidth: 420 }}>
          <AvatarImageAdjuster
            label="Profile Photo"
            source={adjustSource}
            onCropAndUpload={handleCropAndUpload}
            onCancel={() => setAdjustSource(null)}
            onFileReplace={(f) => setAdjustSource(f)}
            uploading={uploadingAvatar}
            uploadProgress={uploadProgress}
          />
        </Box>
      )}

      {/* Laptop: profile on the left, password on the right */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(0, 1fr)' },
          gap: 3,
          alignItems: 'start',
        }}
      >
      <Card variant="outlined" sx={{ borderRadius: 4, overflow: 'hidden' }}>
        {/* Banner */}
        <Box
          sx={{
            height: 100,
            background: `linear-gradient(135deg, ${alpha(brand.primary, 0.8)} 0%, ${alpha(brand.secondary, 0.8)} 100%)`,
            position: 'relative',
          }}
        />

        <CardContent sx={{ pt: 0, px: 3, pb: 3, position: 'relative' }}>
          {/* Avatar with upload overlay */}
          <Box sx={{ position: 'relative', width: 90, mt: -6, mb: 2 }}>
            <Avatar
              src={avatarUrl || undefined}
              sx={{
                width: 90,
                height: 90,
                fontSize: '2rem',
                border: '4px solid',
                borderColor: 'background.paper',
                bgcolor: brand.primary,
                boxShadow: `0 4px 14px ${alpha(brand.primary, 0.25)}`,
              }}
            >
              {!avatarUrl && initials}
            </Avatar>

            {/* Camera overlay button */}
            {!adjustSource && (
              <Tooltip title="Change profile photo">
                <IconButton
                  size="small"
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    bgcolor: 'background.paper',
                    border: '2px solid',
                    borderColor: 'divider',
                    width: 30,
                    height: 30,
                    '&:hover': { bgcolor: alpha(brand.primary, 0.08) },
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  }}
                >
                  <PhotoCameraIcon sx={{ fontSize: 16, color: brand.primary }} />
                </IconButton>
              </Tooltip>
            )}

            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileChange}
            />
          </Box>

          {/* Re-adjust button if avatar already set and adjuster not open */}
          {avatarUrl && !adjustSource && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<PhotoCameraIcon />}
              onClick={() => setAdjustSource(avatarUrl)}
              sx={{ mb: 2, textTransform: 'none', fontSize: '0.75rem' }}
            >
              Re-adjust Photo
            </Button>
          )}

          <Typography variant="h2" sx={{ mb: 0.5 }}>
            {user?.name}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
            <Chip
              icon={roleIcon}
              label={roleLabel}
              size="small"
              sx={{
                backgroundColor: alpha(brand.primary, 0.1),
                color: brand.primary,
                fontWeight: 600,
              }}
            />
          </Stack>

          <Divider sx={{ mb: 3 }} />

          <Typography variant="h6" sx={{ color: brand.primary, fontSize: '0.75rem', mb: 2 }}>
            ACCOUNT INFORMATION
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
            {infoRows.map((row) => (
              <Stack key={row.label} direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: alpha(brand.primary, 0.1), color: brand.primary, width: 40, height: 40 }}>
                  {row.icon}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>
                    {row.label}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
                    {row.value}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Change password (inline, no dialog) */}
      <Card variant="outlined" sx={{ borderRadius: 4 }}>
        <CardContent sx={{ px: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Password
            </Typography>
            <Button
              size="small"
              startIcon={<LockResetIcon />}
              onClick={() => {
                setShowPassword((v) => !v);
                setPasswordMsg(null);
              }}
              sx={{ textTransform: 'none' }}
            >
              {showPassword ? 'Cancel' : 'Change password'}
            </Button>
          </Stack>
          <Collapse in={showPassword}>
            <Box component="form" onSubmit={handleChangePassword} sx={{ mt: 1, maxWidth: 360 }}>
              {passwordMsg && (
                <Alert severity={passwordMsg.ok ? 'success' : 'error'} sx={{ mb: 1 }}>
                  {passwordMsg.text}
                </Alert>
              )}
              <TextField
                label="Current password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                fullWidth
                size="small"
                margin="dense"
                autoComplete="current-password"
              />
              <TextField
                label="New password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
                size="small"
                margin="dense"
                helperText="At least 6 characters"
                autoComplete="new-password"
              />
              <Button
                type="submit"
                variant="contained"
                size="small"
                disabled={savingPassword || !currentPassword || !newPassword}
                sx={{ mt: 1 }}
              >
                {savingPassword ? 'Saving…' : 'Save new password'}
              </Button>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
      </Box>
    </Box>
  );
}
