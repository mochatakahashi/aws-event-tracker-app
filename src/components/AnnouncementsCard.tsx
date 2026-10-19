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
import { deleteAnnouncement, getAnnouncements, postAnnouncement } from '../services/adviserService';
import type { Announcement } from '../types/adviser';

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' });

/**
 * Announcements from the adviser (or an admin) to the officers. The adviser
 * and admins can post; officers read them on their dashboards.
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

  const load = useCallback(async () => {
    try {
      setItems(await getAnnouncements(viewer.personId));
    } catch {
      /* keep what we have */
    } finally {
      setLoaded(true);
    }
  }, [viewer.personId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function post() {
    setBusy(true);
    setError('');
    try {
      const a = await postAnnouncement({ title, message }, viewer);
      setItems((prev) => [a, ...prev]);
      setTitle('');
      setMessage('');
      setNote('Posted. Officers see it on their dashboard and get a notification.');
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

  // Officers only see the card when there is something to read
  if (!canPost && loaded && items.length === 0) return null;
  const shown = showAll ? items : items.slice(0, limit);

  return (
    <Card variant="outlined" sx={{ mb: 3, borderRadius: '16px', borderColor: alpha(brand.primary, 0.25) }} data-testid="announcements">
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <CampaignRoundedIcon sx={{ color: brand.primary }} />
          <Typography variant="h3">{canPost ? 'Announcements to the officers' : 'From the adviser'}</Typography>
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
                <Typography variant="caption" color="text.secondary">
                  Goes to all officers (and admins): their dashboard + a notification.
                </Typography>
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
        {loaded && items.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No announcements yet.
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
        {items.length > limit && (
          <Button size="small" sx={{ mt: 1 }} onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Show fewer' : `Show all ${items.length}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
