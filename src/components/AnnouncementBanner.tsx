import { useCallback, useEffect, useState } from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { ANNOUNCEMENTS_CHANGED, deleteAnnouncement, editAnnouncement, getAnnouncements } from '../services/adviserService';
import { isPinned, type Announcement } from '../types/adviser';

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' });

function timeLeft(a: Announcement): string {
  const until = Date.parse(a.expiresAt || '') || Date.parse(a.createdAt) + 24 * 3600 * 1000;
  const mins = Math.max(0, Math.round((until - Date.now()) / 60000));
  if (mins >= 60) {
    const h = Math.round(mins / 60);
    return `${h} more hour${h === 1 ? '' : 's'}`;
  }
  return `${mins} more minute${mins === 1 ? '' : 's'}`;
}

/**
 * New announcements (from the adviser or an admin) pinned at the top of the
 * dashboard for 24 hours. Their author or an admin can edit them right here.
 */
export default function AnnouncementBanner({ viewer }: { viewer: { personId: string; name: string; role?: string } }) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const list = await getAnnouncements(viewer.personId, viewer.role);
      setItems(list.filter((a) => isPinned(a)));
    } catch {
      /* keep what we have */
    }
  }, [viewer.personId, viewer.role]);

  useEffect(() => {
    void load();
    const onChange = () => void load();
    window.addEventListener(ANNOUNCEMENTS_CHANGED, onChange);
    // Drop announcements once their 24 hours are up
    const t = window.setInterval(() => setItems((prev) => prev.filter((a) => isPinned(a))), 60_000);
    return () => {
      window.removeEventListener(ANNOUNCEMENTS_CHANGED, onChange);
      window.clearInterval(t);
    };
  }, [load]);

  async function save(a: Announcement) {
    setBusy(true);
    setError('');
    try {
      const saved = await editAnnouncement(a.id, { title, message }, viewer);
      setItems((prev) => prev.map((x) => (x.id === a.id ? saved : x)));
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the changes.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(a: Announcement) {
    setBusy(true);
    setError('');
    try {
      await deleteAnnouncement(a.id, viewer.personId);
      setItems((prev) => prev.filter((x) => x.id !== a.id));
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove it.');
    } finally {
      setBusy(false);
    }
  }

  if (items.length === 0) return null;

  return (
    <Stack spacing={1.5} sx={{ mb: 3 }} data-testid="announcement-banner">
      {items.map((a) => {
        const canEdit = a.authorId === viewer.personId || viewer.role === 'admin';
        const isEditing = editing === a.id;
        return (
          <Paper
            key={a.id}
            variant="outlined"
            data-testid={`pinned-${a.id}`}
            sx={{
              p: { xs: 1.75, sm: 2 },
              borderRadius: '16px',
              borderColor: alpha(brand.primary, 0.4),
              borderLeft: `5px solid ${brand.primary}`,
              bgcolor: alpha(brand.primary, 0.05),
            }}
          >
            <Stack direction="row" spacing={1.25} alignItems="flex-start">
              <CampaignRoundedIcon sx={{ color: brand.primary, mt: 0.25 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
                  <Typography variant="overline" sx={{ lineHeight: 1.4, color: brand.primary, fontWeight: 800 }}>
                    Announcement
                  </Typography>
                  {a.audience === 'officers' && viewer.role !== 'officer' && <Chip size="small" label="Officers" variant="outlined" />}
                  {a.audience === 'everyone' && viewer.role === 'admin' && <Chip size="small" label="Everyone" variant="outlined" />}
                </Stack>
                {isEditing ? (
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
                    {error && <Alert severity="error">{error}</Alert>}
                    <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                      <Button size="small" color="error" onClick={() => void remove(a)} disabled={busy} sx={{ mr: 'auto' }}>
                        Remove
                      </Button>
                      <Button size="small" onClick={() => setEditing(null)} disabled={busy}>
                        Cancel
                      </Button>
                      <Button size="small" variant="contained" onClick={() => void save(a)} disabled={busy || !title.trim() || !message.trim()}>
                        {busy ? 'Saving…' : 'Save'}
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, wordBreak: 'break-word' }}>
                      {a.title}
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line', wordBreak: 'break-word', mt: 0.25 }}>
                      {a.message}
                    </Typography>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap spacing={1} sx={{ mt: 0.75 }}>
                      <Typography variant="caption" color="text.secondary">
                        {a.authorName} · {a.authorRole === 'adviser' ? 'Adviser' : 'Admin'} · {when(a.createdAt)}
                        {a.editedAt ? ' · edited' : ''}
                        {canEdit ? ` · pinned here for ${timeLeft(a)}` : ''}
                      </Typography>
                      {canEdit && (
                        <Button
                          size="small"
                          startIcon={<EditRoundedIcon fontSize="small" />}
                          aria-label={`Edit announcement ${a.title}`}
                          onClick={() => {
                            setTitle(a.title);
                            setMessage(a.message);
                            setError('');
                            setEditing(a.id);
                          }}
                        >
                          Edit
                        </Button>
                      )}
                    </Stack>
                  </>
                )}
              </Box>
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}
