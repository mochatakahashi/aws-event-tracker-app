import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { brand } from '../theme/theme';

export default function ProfilePage() {
  const { user } = useAuth();

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

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 3 }}>
        My Profile
      </Typography>

      <Card variant="outlined" sx={{ borderRadius: 4, mb: 3, overflow: 'hidden' }}>
        <Box
          sx={{
            height: 100,
            background: `linear-gradient(135deg, ${alpha(brand.primary, 0.8)} 0%, ${alpha(brand.secondary, 0.8)} 100%)`,
            position: 'relative',
          }}
        />
        <CardContent sx={{ pt: 0, px: 3, pb: 3, position: 'relative' }}>
          <Avatar
            sx={{
              width: 90,
              height: 90,
              fontSize: '2rem',
              border: '4px solid',
              borderColor: 'background.paper',
              mt: -6,
              mb: 2,
              bgcolor: brand.primary,
              boxShadow: `0 4px 14px ${alpha(brand.primary, 0.25)}`,
            }}
          >
            {initials}
          </Avatar>

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
