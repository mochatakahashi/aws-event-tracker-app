import { useCallback, useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import DrawRoundedIcon from '@mui/icons-material/DrawRounded';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { getSignoffs, requestSignoff, reviewSignoff } from '../services/adviserService';
import type { SignoffRequest } from '../types/adviser';

const when = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' }) : '';

const STATUS: Record<SignoffRequest['status'], { label: string; color: 'warning' | 'success' | 'error' }> = {
  pending: { label: 'Waiting for the adviser', color: 'warning' },
  approved: { label: 'Signed / approved', color: 'success' },
  returned: { label: 'Returned', color: 'error' },
};

/**
 * Sign-off ("papirma") requests. Officers and admins send a request with a
 * file link; the adviser approves it or returns it with a comment. Everyone
 * keeps a record of what was signed and when.
 */
export default function SignoffPanel({ viewer }: { viewer: { personId: string; name: string; role?: string } }) {
  const isAdviser = viewer.role === 'adviser';
  const canRequest = viewer.role === 'officer' || viewer.role === 'admin';
  const [items, setItems] = useState<SignoffRequest[]>([]);
  const [form, setForm] = useState({ title: '', details: '', link: '' });
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [returning, setReturning] = useState<{ id: string; comment: string } | null>(null);
  const [approveNote, setApproveNote] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setItems(await getSignoffs(viewer.personId));
    } catch {
      /* keep */
    }
  }, [viewer.personId]);
  useEffect(() => {
    void load();
  }, [load]);

  async function send() {
    setBusy('new');
    setError('');
    try {
      const item = await requestSignoff({ title: form.title, details: form.details.trim() || undefined, link: form.link.trim() || undefined }, viewer);
      setItems((prev) => [item, ...prev]);
      setForm({ title: '', details: '', link: '' });
      setAdding(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the request.');
    } finally {
      setBusy(null);
    }
  }

  async function review(item: SignoffRequest, decision: 'approved' | 'returned', comment?: string) {
    setBusy(item.id);
    setError('');
    try {
      const updated = await reviewSignoff(item.id, decision, viewer, comment);
      setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setReturning(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your decision.');
    } finally {
      setBusy(null);
    }
  }

  const pending = items.filter((x) => x.status === 'pending');
  const done = items.filter((x) => x.status !== 'pending');

  const row = (x: SignoffRequest) => (
    <Box key={x.id} sx={{ p: 1.5, borderRadius: '12px', border: `1px solid ${alpha(brand.primary, 0.12)}` }} data-testid={`signoff-${x.id}`}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'flex-start' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            {x.title}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            From {x.requestedByName} · {when(x.createdAt)}
          </Typography>
          {x.details && (
            <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-line' }}>
              {x.details}
            </Typography>
          )}
          {x.link && (
            <Link href={x.link} target="_blank" rel="noopener noreferrer" variant="body2" sx={{ wordBreak: 'break-all' }}>
              Open the file
            </Link>
          )}
          {x.status !== 'pending' && (
            <Typography variant="body2" color={x.status === 'returned' ? 'error' : 'success.main'} sx={{ mt: 0.5 }}>
              {x.status === 'approved' ? 'Approved' : 'Returned'} by {x.reviewedByName} · {when(x.reviewedAt)}
              {x.comment ? ` - “${x.comment}”` : ''}
            </Typography>
          )}
        </Box>
        <Chip size="small" color={STATUS[x.status].color} variant={x.status === 'pending' ? 'outlined' : 'filled'} label={STATUS[x.status].label} />
      </Stack>
      {isAdviser && x.status === 'pending' && (
        <Box sx={{ mt: 1.25 }}>
          {returning?.id === x.id ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                size="small"
                fullWidth
                label="What needs to change?"
                value={returning.comment}
                onChange={(e) => setReturning({ id: x.id, comment: e.target.value })}
                inputProps={{ maxLength: 1000 }}
              />
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={() => setReturning(null)}>
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  disabled={busy === x.id || !returning.comment.trim()}
                  onClick={() => void review(x, 'returned', returning.comment)}
                >
                  Return
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
              <TextField
                size="small"
                fullWidth
                label="Note (optional)"
                value={approveNote[x.id] ?? ''}
                onChange={(e) => setApproveNote({ ...approveNote, [x.id]: e.target.value })}
                inputProps={{ maxLength: 1000 }}
              />
              <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                <Button size="small" variant="contained" color="success" disabled={busy === x.id} onClick={() => void review(x, 'approved', approveNote[x.id])}>
                  Approve
                </Button>
                <Button size="small" variant="outlined" color="error" disabled={busy === x.id} onClick={() => setReturning({ id: x.id, comment: '' })}>
                  Return
                </Button>
              </Stack>
            </Stack>
          )}
        </Box>
      )}
    </Box>
  );

  return (
    <Card variant="outlined" sx={{ mb: 3, borderRadius: '16px' }} data-testid="signoff-panel">
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }} flexWrap="wrap" useFlexGap>
          <DrawRoundedIcon sx={{ color: brand.primary }} />
          <Typography variant="h3" sx={{ flex: 1 }}>
            {isAdviser ? `To sign (${pending.length})` : 'Adviser sign-off'}
          </Typography>
          {canRequest && !adding && (
            <Button size="small" variant="outlined" onClick={() => setAdding(true)}>
              Ask the adviser to sign
            </Button>
          )}
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {isAdviser
            ? 'Requests from officers and admins. Approve, or return with what needs to change - they are notified either way.'
            : 'Send a document or plan to the adviser for approval (papirma). You are notified when it’s signed or returned.'}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {adding && (
          <Stack spacing={1} sx={{ mb: 2, p: 1.5, borderRadius: '12px', bgcolor: alpha(brand.primary, 0.04) }} data-testid="signoff-form">
            <TextField size="small" label="What needs signing" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} inputProps={{ maxLength: 140 }} />
            <TextField size="small" label="Details (optional)" multiline minRows={2} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
            <TextField size="small" label="File link (Google Drive, Canva…)" placeholder="https://" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button size="small" onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button size="small" variant="contained" disabled={busy === 'new' || !form.title.trim()} onClick={() => void send()}>
                Send to the adviser
              </Button>
            </Stack>
          </Stack>
        )}
        {items.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {isAdviser ? 'Nothing to sign right now.' : 'No requests yet.'}
          </Typography>
        ) : (
          <Stack spacing={1}>
            {pending.map(row)}
            {done.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mt: 1 }}>
                Done
              </Typography>
            )}
            {done.slice(0, 10).map(row)}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
