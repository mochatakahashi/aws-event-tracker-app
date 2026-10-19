import { useRef, useState, type ReactNode } from 'react';
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
import { brand, PARTNER } from '../theme/theme';
import Collapse from '@mui/material/Collapse';
import LockResetIcon from '@mui/icons-material/LockReset';
import GroupsIcon from '@mui/icons-material/Groups';
import BusinessIcon from '@mui/icons-material/Business';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import { uploadImageToS3 } from '../services/storageService';
import { fileToDataUrl } from '../services/uploadStorageService';
import { updateProfile } from '../services/authService';
import ChangePasswordForm from '../components/ChangePasswordForm';
import { startTour } from '../components/TutorialTour';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import { memberLabel, officerTitle } from '../utils/people';
import AvatarImageAdjuster from '../components/AvatarImageAdjuster';
import SocialLinksEditor from '../components/SocialLinksEditor';
import SocialLinksRow from '../components/SocialLinksRow';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import { isPartnerStaff } from '../utils/eventStaff';
import type { SocialLinks } from '../types/auth';
import { imageSrc } from '../utils/imageUrl';

export default function ProfilePage() {
  const { user, setCurrentUser } = useAuth();

  // Change password
  const [showPassword, setShowPassword] = useState(false);

  // Edit profile (name, school details, bio, links)
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    middleInitial: '',
    lastName: '',
    studentId: '',
    organization: '',
    personalEmail: '',
    bio: '',
  });
  const [socials, setSocials] = useState<SocialLinks>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);
  const outside = user?.memberType === 'outside';

  function startEditing() {
    if (!user) return;
    const parts = (user.name || '').split(' ');
    setForm({
      firstName: user.firstName ?? parts[0] ?? '',
      middleInitial: user.middleInitial ?? '',
      lastName: user.lastName ?? parts.slice(1).join(' '),
      studentId: user.studentId ?? '',
      organization: user.organization ?? '',
      personalEmail: user.personalEmail ?? '',
      bio: user.bio ?? '',
    });
    setSocials({ ...(user.socials || {}) });
    setSaveError('');
    setSaved(false);
    setEditing(true);
  }

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    setSaveError('');
    try {
      const changes: Parameters<typeof updateProfile>[1] = {
        firstName: form.firstName.trim(),
        middleInitial: form.middleInitial.trim(),
        lastName: form.lastName.trim(),
        bio: form.bio.trim(),
        socials,
      };
      if (outside) changes.organization = form.organization.trim();
      else changes.studentId = form.studentId.trim();
      if (user.role === 'officer' || user.personalEmail) changes.personalEmail = form.personalEmail.trim();
      setCurrentUser(await updateProfile(user.personId, changes));
      setEditing(false);
      setSaved(true);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save your profile.');
    } finally {
      setSaving(false);
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
    user?.role === 'adviser' ? 'Adviser' :
    user?.role === 'officer' ? 'Officer' :
    'Attendee';
  const partner = isPartnerStaff(user);

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
      let photoUrl: string;
      try {
        photoUrl = await uploadImageToS3(croppedFile, (pct) => setUploadProgress(pct));
      } catch {
        // Cloud storage not set up or failing: keep a small copy on the account instead
        photoUrl = await fileToDataUrl(croppedFile, 120_000, 480);
        setUploadProgress(100);
      }
      // Save it on the account so every login and device sees the new photo
      if (user) setCurrentUser(await updateProfile(user.personId, { avatarUrl: photoUrl }));
      setAvatarUrl(photoUrl);
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
    infoRows.push({ label: 'School / Organization', value: user.organization || '-', icon: <BusinessIcon /> });
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

      {/* Avatar adjuster - shown when a file is selected or re-adjusting */}
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
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 2fr) minmax(0, 1fr)' },
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
              src={imageSrc(avatarUrl)}
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
              onClick={() => setAdjustSource(imageSrc(avatarUrl) || avatarUrl)}
              sx={{ mb: 2, textTransform: 'none', fontSize: '0.75rem' }}
            >
              Re-adjust Photo
            </Button>
          )}

          <Typography variant="h2" sx={{ mb: 0.5 }}>
            {user?.name}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: user?.bio ? 1.5 : 3 }}>
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
            {partner && (
              <Chip
                icon={<HandshakeOutlinedIcon style={{ color: PARTNER }} />}
                label={`Co-organizer staff · ${user?.partnerOrg}`}
                size="small"
                variant="outlined"
                sx={{ color: PARTNER, borderColor: PARTNER, fontWeight: 600 }}
              />
            )}
          </Stack>
          {user?.bio && !editing && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, whiteSpace: 'pre-line' }}>
              {user.bio}
            </Typography>
          )}

          <Divider sx={{ mb: 3 }} />

          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ color: brand.primary, fontSize: '0.75rem' }}>
              ACCOUNT INFORMATION
            </Typography>
            {!editing && (
              <Button size="small" variant="outlined" startIcon={<EditRoundedIcon />} onClick={startEditing} data-testid="edit-profile">
                Edit profile
              </Button>
            )}
          </Stack>
          {saved && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaved(false)}>
              Profile saved.
            </Alert>
          )}

          {editing ? (
            <Box data-testid="profile-form">
              {saveError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError('')}>
                  {saveError}
                </Alert>
              )}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'minmax(0, 2fr) 80px minmax(0, 2fr)' }, gap: 1.5, mb: 1.5 }}>
                <TextField size="small" label="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required inputProps={{ maxLength: 50 }} />
                <TextField size="small" label="M.I." value={form.middleInitial} onChange={(e) => setForm({ ...form, middleInitial: e.target.value })} inputProps={{ maxLength: 2 }} />
                <TextField size="small" label="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required inputProps={{ maxLength: 50 }} />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5, mb: 1.5 }}>
                {outside ? (
                  <TextField size="small" label="School / organization" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} required inputProps={{ maxLength: 100 }} />
                ) : (
                  <TextField size="small" label="Student ID" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required inputProps={{ maxLength: 20 }} />
                )}
                {(user?.role === 'officer' || user?.personalEmail) && (
                  <TextField size="small" label="Personal email (optional)" type="email" value={form.personalEmail} onChange={(e) => setForm({ ...form, personalEmail: e.target.value })} />
                )}
                <TextField
                  size="small"
                  label="Email (sign-in)"
                  value={user?.email || user?.username || ''}
                  disabled
                  helperText="Ask an admin if this needs to change."
                />
              </Box>
              <TextField
                size="small"
                fullWidth
                multiline
                minRows={2}
                label="Bio"
                placeholder="Tell others about yourself…"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                inputProps={{ maxLength: 500 }}
                sx={{ mb: 2 }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Social links
              </Typography>
              <SocialLinksEditor value={socials} onChange={setSocials} />
              {user?.role === 'officer' && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                  Your officer position and committee are set by an admin.
                </Typography>
              )}
              <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
                <Button onClick={() => setEditing(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={() => void saveProfile()}
                  disabled={saving || !form.firstName.trim() || !form.lastName.trim()}
                >
                  {saving ? 'Saving…' : 'Save profile'}
                </Button>
              </Stack>
            </Box>
          ) : (
          <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2.5 }}>
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
          <Box sx={{ mt: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Social links
            </Typography>
            <SocialLinksRow socials={user?.socials} align="flex-start" empty="No links yet - tap Edit profile to add Facebook, Instagram, LinkedIn and more." />
          </Box>
          </>
          )}
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
              }}
              sx={{ textTransform: 'none' }}
            >
              {showPassword ? 'Cancel' : 'Change password'}
            </Button>
          </Stack>
          <Collapse in={showPassword}>
            <Box sx={{ mt: 1 }}>
              <ChangePasswordForm onDone={() => setShowPassword(false)} />
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Replay the first-time tour */}
      <Card variant="outlined" sx={{ borderRadius: 4, mt: 2 }}>
        <CardContent sx={{ px: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                App tour
              </Typography>
              <Typography variant="caption" color="text.secondary">
                A one-minute walkthrough of where everything is.
              </Typography>
            </Box>
            <Button size="small" startIcon={<SchoolRoundedIcon />} onClick={startTour} sx={{ textTransform: 'none', flexShrink: 0 }}>
              Take the tour
            </Button>
          </Stack>
        </CardContent>
      </Card>
      </Box>
    </Box>
  );
}
