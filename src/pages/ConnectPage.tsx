import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import LanguageIcon from '@mui/icons-material/Language';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { brand } from '../theme/theme';
import type { SocialLinks } from '../types/auth';
import NetworkingCard from '../components/NetworkingCard';

export default function ConnectPage() {
  const { user } = useAuth();

  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('CS student & AWS Cloud Club member at APC. Building the future on AWS. ☁️');
  const [socials, setSocials] = useState<SocialLinks>({
    linkedIn: 'https://www.linkedin.com/in/example',
    github: 'https://github.com/example',
    twitterX: '',
    website: '',
  });
  const [showQR, setShowQR] = useState(false);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 3 }}>
        Connect
      </Typography>

      {/* Profile Card */}
      <Card sx={{ mb: 3, overflow: 'visible' }}>
        <Box
          sx={{
            height: 100,
            background: brand.gradient,
            borderRadius: '16px 16px 0 0',
            position: 'relative',
          }}
        />
        <CardContent sx={{ pt: 0, pb: 3, px: 3, position: 'relative' }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              fontSize: '1.8rem',
              border: '4px solid white',
              mt: -5,
              mb: 1.5,
              boxShadow: `0 4px 14px ${alpha(brand.primary, 0.25)}`,
            }}
          >
            {initials}
          </Avatar>

          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h2" sx={{ mb: 0.3 }}>
                {user?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {user?.studentId ?? user?.username}
              </Typography>
              <Chip
                label={user?.role === 'admin' ? 'Admin' : user?.role === 'officer' ? 'Officer' : 'Attendee'}
                size="small"
                sx={{
                  backgroundColor: alpha(brand.primary, 0.1),
                  color: brand.primary,
                  fontWeight: 600,
                  fontSize: '0.7rem',
                }}
              />
            </Box>
            <Button
              size="small"
              variant={showQR ? 'contained' : 'outlined'}
              startIcon={<QrCode2Icon />}
              onClick={() => setShowQR((v) => !v)}
              sx={{ mt: 1 }}
            >
              {showQR ? 'Hide QR Card' : 'QR Card'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Networking Card — Inline (No Overlays) */}
      {showQR && (
        <NetworkingCard
          open={showQR}
          onClose={() => setShowQR(false)}
          name={user?.name ?? ''}
          socials={socials}
        />
      )}

      {/* Bio */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="h6" sx={{ color: brand.primary, fontSize: '0.75rem' }}>
              ABOUT
            </Typography>
            <Button
              size="small"
              startIcon={editing ? <SaveIcon /> : <EditIcon />}
              onClick={() => setEditing(!editing)}
              sx={{ fontSize: '0.75rem' }}
            >
              {editing ? 'Save' : 'Edit'}
            </Button>
          </Stack>
          {editing ? (
            <TextField
              multiline
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              fullWidth
              placeholder="Tell others about yourself..."
            />
          ) : (
            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
              {bio || 'No bio yet. Click edit to add one!'}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ color: brand.primary, fontSize: '0.75rem' }}>
              SOCIAL LINKS
            </Typography>
            {!editing && (
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={() => setEditing(true)}
                sx={{ fontSize: '0.75rem' }}
              >
                Edit
              </Button>
            )}
          </Stack>

          <Stack spacing={2}>
            <TextField
              label="LinkedIn URL"
              value={socials.linkedIn ?? ''}
              onChange={(e) => setSocials({ ...socials, linkedIn: e.target.value })}
              fullWidth
              size="small"
              disabled={!editing}
              slotProps={{
                input: {
                  startAdornment: <LinkedInIcon sx={{ mr: 1, color: '#0A66C2', fontSize: 20 }} />,
                },
              }}
            />
            <TextField
              label="GitHub URL"
              value={socials.github ?? ''}
              onChange={(e) => setSocials({ ...socials, github: e.target.value })}
              fullWidth
              size="small"
              disabled={!editing}
              slotProps={{
                input: {
                  startAdornment: <GitHubIcon sx={{ mr: 1, color: '#333', fontSize: 20 }} />,
                },
              }}
            />
            <TextField
              label="Twitter / X"
              value={socials.twitterX ?? ''}
              onChange={(e) => setSocials({ ...socials, twitterX: e.target.value })}
              fullWidth
              size="small"
              disabled={!editing}
              placeholder="https://x.com/username"
            />
            <TextField
              label="Website"
              value={socials.website ?? ''}
              onChange={(e) => setSocials({ ...socials, website: e.target.value })}
              fullWidth
              size="small"
              disabled={!editing}
              slotProps={{
                input: {
                  startAdornment: <LanguageIcon sx={{ mr: 1, color: brand.textSecondary, fontSize: 20 }} />,
                },
              }}
            />
          </Stack>

          {editing && (
            <Button
              variant="contained"
              fullWidth
              startIcon={<SaveIcon />}
              onClick={() => setEditing(false)}
              sx={{ mt: 2 }}
            >
              Save Changes
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Quick social links display */}
      {!editing && (socials.linkedIn || socials.github) && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" sx={{ color: brand.primary, fontSize: '0.75rem', mb: 1.5 }}>
            QUICK LINKS
          </Typography>
          <Stack direction="row" spacing={1.5}>
            {socials.linkedIn && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<LinkedInIcon />}
                href={socials.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ borderColor: '#0A66C2', color: '#0A66C2' }}
              >
                LinkedIn
              </Button>
            )}
            {socials.github && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<GitHubIcon />}
                href={socials.github}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ borderColor: '#333', color: '#333' }}
              >
                GitHub
              </Button>
            )}
          </Stack>
        </>
      )}

    </Box>
  );
}
