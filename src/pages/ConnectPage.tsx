import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded';
import QrScanner from '../components/QrScanner';
import { useBoardData } from '../hooks/useBoardData';
import { attendeeBoard } from '../utils/leaderboard';
import { BADGES } from '../utils/badges';
import { parseProfileLink } from '../utils/pass';
import { memberLabel, officerTitle } from '../utils/people';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { brand } from '../theme/theme';
import type { SocialLinks } from '../types/auth';
import NetworkingCard from '../components/NetworkingCard';
import { getUser, updateProfile } from '../services/authService';
import ConnectButton from '../components/ConnectButton';
import SocialLinksEditor, { socialsProblem } from '../components/SocialLinksEditor';
import SocialLinksRow from '../components/SocialLinksRow';
import { imageSrc } from '../utils/imageUrl';

export default function ConnectPage() {
  const { user, setCurrentUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [socials, setSocials] = useState<SocialLinks>({ ...(user?.socials || {}) });

  // Fresh copy of my account: new connection requests and connections
  useEffect(() => {
    if (!user?.personId) return;
    getUser(user.personId)
      .then((u) => u && setCurrentUser(u))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.personId]);

  // Saved on the account, so the bio and links show up on every device
  async function toggleEditing() {
    if (!editing) {
      setEditing(true);
      return;
    }
    if (!user) return;
    setSaving(true);
    setSaveError('');
    try {
      const badLink = socialsProblem(socials);
      if (badLink) throw new Error(badLink);
      setCurrentUser(await updateProfile(user.personId, { bio: bio.trim(), socials }));
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  }
  const [showQR, setShowQR] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState('');
  const navigate = useNavigate();
  const { data } = useBoardData();
  const connections = useMemo(() => {
    if (!data || !user?.connections?.length) return [];
    const rows = new Map(attendeeBoard(data).map((r) => [r.personId, r]));
    return user.connections
      .map((id) => data.people.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((person) => ({ person, row: rows.get(person.id) }));
  }, [data, user?.connections]);
  const peopleById = useMemo(() => new Map((data?.people ?? []).map((p) => [p.id, p])), [data]);
  const incoming = (user?.connectionRequests ?? []).map((id) => peopleById.get(id)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  const outgoing = (user?.sentConnectionRequests ?? []).map((id) => peopleById.get(id)).filter((p): p is NonNullable<typeof p> => Boolean(p));

  function onScan(text: string) {
    const id = parseProfileLink(text);
    if (id) {
      setScanning(false);
      navigate(`/people/${id}`);
    } else {
      setScanMsg("That QR isn't an AWS SBG-APC networking card. Ask them to open Connect → QR Card.");
    }
  }

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
            src={imageSrc(user?.avatarUrl)}
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

          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'flex-start' }} spacing={1}>
            <Box>
              <Typography variant="h2" sx={{ mb: 0.3 }}>
                {user?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {user?.studentId ?? user?.username}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.75 }} data-testid="my-connection-count">
                <strong>{user?.connections?.length ?? 0}</strong> AWS SBG-APC connection{user?.connections?.length === 1 ? '' : 's'}
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
            <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' }, mt: 1 }}>
            <Button
              size="small"
              variant={showQR ? 'contained' : 'outlined'}
              startIcon={<QrCode2Icon />}
              onClick={() => setShowQR((v) => !v)}
              sx={{ flex: { xs: 1, sm: 'none' } }}
            >
              {showQR ? 'Hide QR Card' : 'QR Card'}
            </Button>
            <Button
              size="small"
              variant={scanning ? 'contained' : 'outlined'}
              startIcon={<QrCodeScannerRoundedIcon />}
              onClick={() => setScanning((v) => !v)}
              sx={{ flex: { xs: 1, sm: 'none' } }}
            >
              Scan QR
            </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Networking Card - Inline (No Overlays) */}
      {showQR && (
        <NetworkingCard
          open={showQR}
          onClose={() => setShowQR(false)}
          personId={user?.personId ?? ''}
          name={user?.name ?? ''}
          subtitle={user ? (user.role === 'officer' ? officerTitle(user) : memberLabel(user)) : ''}
          bio={bio}
          socials={socials}
        />
      )}

      {/* Scan someone's QR */}
      {scanning && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: '16px' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Scan someone's networking QR
            </Typography>
            <Button size="small" onClick={() => setScanning(false)}>
              Close
            </Button>
          </Stack>
          {scanMsg && (
            <Alert severity="warning" sx={{ mb: 1.5 }} onClose={() => setScanMsg('')}>
              {scanMsg}
            </Alert>
          )}
          <Box sx={{ maxWidth: 420, mx: 'auto' }}>
            <QrScanner onResult={onScan} />
          </Box>
        </Paper>
      )}

      {/* Connection requests */}
      {(incoming.length > 0 || outgoing.length > 0) && (
        <Paper sx={{ p: { xs: 2, sm: 2.5 }, mb: 3, borderRadius: '16px' }} data-testid="connection-requests">
          {incoming.length > 0 && (
            <>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5 }}>
                Connection requests ({incoming.length})
              </Typography>
              <Stack spacing={1} sx={{ mb: outgoing.length ? 2.5 : 0 }}>
                {incoming.map((p) => (
                  <Stack
                    key={p.id}
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    alignItems={{ sm: 'center' }}
                    sx={{ p: 1.25, borderRadius: '12px', border: `1px solid ${alpha(brand.primary, 0.2)}` }}
                    data-testid={`request-${p.id}`}
                  >
                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => navigate(`/people/${p.id}`)}>
                      <Avatar src={imageSrc(p.avatarUrl)} sx={{ width: 40, height: 40 }}>
                        {p.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                          {p.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                          {p.role === 'officer' ? officerTitle(p) : memberLabel(p)}
                        </Typography>
                      </Box>
                    </Stack>
                    <ConnectButton personId={p.id} name={p.name} size="small" />
                  </Stack>
                ))}
              </Stack>
            </>
          )}
          {outgoing.length > 0 && (
            <>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, mb: 1 }}>
                Requests you sent
              </Typography>
              <Stack spacing={1}>
                {outgoing.map((p) => (
                  <Stack key={p.id} direction="row" spacing={1.25} alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap>
                    <Typography variant="body2" sx={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate(`/people/${p.id}`)}>
                      {p.name}
                    </Typography>
                    <ConnectButton personId={p.id} name={p.name} size="small" />
                  </Stack>
                ))}
              </Stack>
            </>
          )}
        </Paper>
      )}

      {/* My connections */}
      <Paper sx={{ p: { xs: 2, sm: 2.5 }, mb: 3, borderRadius: '16px' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            My connections {connections.length > 0 && `(${connections.length})`}
          </Typography>
          {!scanning && (
            <Button size="small" startIcon={<QrCodeScannerRoundedIcon />} onClick={() => setScanning(true)}>
              Scan QR
            </Button>
          )}
        </Stack>
        {connections.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Scan another attendee's or officer's networking QR and tap <strong>Connect</strong>. Once they approve, you'll see
            their achievements here.
          </Typography>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
            {connections.map(({ person, row }) => (
              <Stack
                key={person.id}
                direction="row"
                spacing={1.5}
                alignItems="center"
                onClick={() => navigate(`/people/${person.id}`)}
                role="button"
                sx={{
                  p: 1.25,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  border: `1px solid ${alpha(brand.primary, 0.12)}`,
                  '&:hover': { bgcolor: alpha(brand.primary, 0.04) },
                }}
              >
                <Avatar src={imageSrc(person.avatarUrl)} sx={{ width: 40, height: 40 }}>
                  {person.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                    {person.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                    {person.role === 'officer' ? officerTitle(person) : memberLabel(person)} · {row?.stamps ?? 0} stamps ·{' '}
                    {row?.checkIns ?? 0} events
                  </Typography>
                </Box>
                <Box sx={{ fontSize: 16, flexShrink: 0 }} aria-label={`${row?.badges.length ?? 0} badges`}>
                  {BADGES.filter((b) => row?.badges.includes(b.id)).map((b) => b.emoji).join('')}
                </Box>
              </Stack>
            ))}
          </Box>
        )}
      </Paper>

      {/* Laptop: About and Social links side by side */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' }, gap: { xs: 0, md: 3 }, alignItems: 'start' }}>
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
              onClick={toggleEditing}
              disabled={saving}
              sx={{ fontSize: '0.75rem' }}
            >
              {saving ? 'Saving…' : editing ? 'Save' : 'Edit'}
            </Button>
          </Stack>
          {saveError && (
            <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
              {saveError}
            </Typography>
          )}
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

          {editing ? (
            <SocialLinksEditor value={socials} onChange={setSocials} />
          ) : (
            <SocialLinksRow socials={socials} align="flex-start" empty="No links yet - tap Edit to add Facebook, Instagram, LinkedIn and more." />
          )}

          {editing && (
            <Button
              variant="contained"
              fullWidth
              startIcon={<SaveIcon />}
              onClick={toggleEditing}
              disabled={saving}
              sx={{ mt: 2 }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          )}
        </CardContent>
      </Card>
      </Box>

    </Box>
  );
}
