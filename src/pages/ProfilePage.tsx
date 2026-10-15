import { useRef, useState } from 'react';
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
import { uploadImageToS3 } from '../services/storageService';
import AvatarImageAdjuster from '../components/AvatarImageAdjuster';

export default function ProfilePage() {
  const { user } = useAuth();

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
      setAvatarUrl(s3Url);
      setAdjustSource(null);
    } catch (err: any) {
      alert(err.message || 'Failed to upload profile photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

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

      <Card variant="outlined" sx={{ borderRadius: 4, mb: 3, overflow: 'hidden' }}>
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

          <Stack spacing={2.5}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: alpha(brand.primary, 0.1), color: brand.primary, width: 40, height: 40 }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>
                  Full Name
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {user?.name}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: alpha(brand.primary, 0.1), color: brand.primary, width: 40, height: 40 }}>
                <EmailIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>
                  Email Address / Username
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {user?.username}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: alpha(brand.primary, 0.1), color: brand.primary, width: 40, height: 40 }}>
                {user?.studentId ? <SchoolIcon /> : <BadgeIcon />}
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>
                  {user?.studentId ? 'Student ID' : 'Account ID'}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {user?.studentId || user?.personId}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
