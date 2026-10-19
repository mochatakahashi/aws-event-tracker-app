import { useCallback, useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { ANNOUNCEMENTS_CHANGED, deleteAnnouncement, getAnnouncements, postAnnouncement } from '../services/adviserService';
import { isPinned, type Announcement } from '../types/adviser';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' });

/**
 * Announcements from the adviser (or an admin). The adviser and admins post
 * here; a new announcement is pinned at the top of dashboards for 24 hours
 * (AnnouncementBanner), then listed here as an earlier announcement.
 */
export default function AnnouncementsCard({
  viewer,
  limit = 5,
}: {
  viewer: { personId: string; name: string; role?: string };
  limit?: number;
}) {
  const canPost = viewer.role === 'adviser' || viewer.role === 'admin';
  const [items, setItems] = useState<Announcement[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [audience, setAudience] = useState<'officers' | 'everyone'>('officers');

  const load = useCallback(async () => {
    try {
      setItems(await getAnnouncements(viewer.personId, viewer.role));
    } catch {
      /* keep what we have */
    } finally {
      setLoaded(true);
    }
  }, [viewer.personId]);

  useEffect(() => {
    void load();
    const onChange = () => void load();
    window.addEventListener(ANNOUNCEMENTS_CHANGED, onChange);
    return () => window.removeEventListener(ANNOUNCEMENTS_CHANGED, onChange);
  }, [load]);

  async function post() {
    setBusy(true);
    setError('');
    try {
      await postAnnouncement({ title, message, audience: viewer.role === 'admin' ? audience : 'officers' }, viewer);
      setTitle('');
      setMessage('');
      setNote(
        `Posted. It stays at the top of ${audience === 'everyone' && viewer.role === 'admin' ? "everyone's" : "the officers'"} dashboard for 24 hours (you can edit it there), and they get a notification.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not post the announcement.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(a: Announcement) {
    try {
      await deleteAnnouncement(a.id, viewer.personId);
      setItems((prev) => prev.filter((x) => x.id !== a.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove it.');
    }
  }

  // Pinned ones are shown at the top of the dashboard; this lists the earlier ones
  const earlier = items.filter((a) => !isPinned(a));
  // Readers only see the card when there is something to read
  if (!canPost && loaded && earlier.length === 0) return null;
  const shown = showAll ? earlier : earlier.slice(0, limit);

  return (
    <Card variant="outlined" sx={{ mb: 3, borderRadius: '16px', borderColor: alpha(brand.primary, 0.25) }} data-testid="announcements">
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <CampaignRoundedIcon sx={{ color: brand.primary }} />
          <Typography variant="h3">{canPost ? 'Announcements' : 'Earlier announcements'}</Typography>
        </Stack>
        {canPost && (
          <Box sx={{ mb: 2 }} data-testid="announce-form">
            <Stack spacing={1}>
              <TextField size="small" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} inputProps={{ maxLength: 140 }} />
              <TextField
                size="small"
                label="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                multiline
                minRows={2}
                inputProps={{ maxLength: 2000 }}
              />
              <Stack direction="row" alignItems="center" spacing={1} justifyContent="space-between" flexWrap="wrap" useFlexGap>
                {viewer.role === 'admin' ? (
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={audience}
                    onChange={(_, v) => v && setAudience(v)}
                    aria-label="Who sees it"
                  >
                    <ToggleButton value="officers" sx={{ textTransform: 'none', px: 1.5 }}>
                      Officers
                    </ToggleButton>
                    <ToggleButton value="everyone" sx={{ textTransform: 'none', px: 1.5 }}>
                      Everyone
                    </ToggleButton>
                  </ToggleButtonGroup>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Goes to all officers: top of their dashboard for 24 hours + a notification.
                  </Typography>
                )}
                <Button variant="contained" size="small" onClick={() => void post()} disabled={busy || !title.trim() || !message.trim()}>
                  {busy ? 'Posting…' : 'Post announcement'}
                </Button>
              </Stack>
            </Stack>
            {note && (
              <Alert severity="success" sx={{ mt: 1 }} onClose={() => setNote('')}>
                {note}
              </Alert>
            )}
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {canPost && earlier.length > 0 && (
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Earlier (no longer pinned)
          </Typography>
        )}
        {loaded && earlier.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {items.length > 0 ? 'New announcements are pinned at the top of the page for 24 hours.' : 'No announcements yet.'}
          </Typography>
        ) : (
          <Stack spacing={1}>
            {shown.map((a) => (
              <Box key={a.id} sx={{ p: 1.5, borderRadius: '12px', bgcolor: alpha(brand.primary, 0.04) }} data-testid={`announcement-${a.id}`}>
                <Stack direction="row" alignItems="flex-start" spacing={1}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {a.title}
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line', wordBreak: 'break-word', mt: 0.25 }}>
                      {a.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {a.authorName} · {a.authorRole === 'adviser' ? 'Adviser' : 'Admin'} · {when(a.createdAt)}
                      {a.audience === 'everyone' ? ' · to everyone' : ''}
                    </Typography>
                  </Box>
                  {(a.authorId === viewer.personId || viewer.role === 'admin') && (
                    <Tooltip title="Remove">
                      <IconButton size="small" aria-label={`Remove announcement ${a.title}`} onClick={() => void remove(a)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
        {earlier.length > limit && (
          <Button size="small" sx={{ mt: 1 }} onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Show fewer' : `Show all ${earlier.length}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
