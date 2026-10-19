import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import { commentOnTask } from '../services/taskService';
import { notifyInApp } from '../services/notificationService';
import { deadlineInfo, type OfficerTask } from '../types/task';

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' });

/** "3 days left", "Due today", "Overdue by 2 days", "Done on time", "Done 1 day late". */
export function DeadlineChip({ task }: { task: OfficerTask }) {
  const d = deadlineInfo(task);
  if (d.tone === 'none') return null;
  const color = d.tone === 'late' ? 'error' : d.tone === 'warn' ? 'warning' : d.tone === 'done' ? 'success' : 'default';
  return <Chip size="small" color={color} variant={d.tone === 'ok' ? 'outlined' : 'filled'} label={d.label} data-testid={`deadline-${task.id}`} sx={{ fontWeight: 700 }} />;
}

/**
 * Comments on a task between the admins and the officers assigned. Posting
 * notifies everyone else on the task (and the admin who made it).
 */
export default function TaskThread({
  task,
  me,
  adminIds = [],
  onChange,
}: {
  task: OfficerTask;
  me: { personId: string; name: string; role?: string };
  /** Admins to notify when an officer comments (defaults to the task's creator). */
  adminIds?: string[];
  onChange: (task: OfficerTask) => void;
}) {
  const comments = task.comments ?? [];
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function post() {
    setBusy(true);
    setError('');
    try {
      const updated = await commentOnTask(task.id, text, me);
      onChange(updated);
      setText('');
      const others = new Set([...task.assigneeIds, ...(me.role === 'admin' ? [] : adminIds), task.createdBy].filter(Boolean));
      others.delete(me.personId);
      if (others.size) {
        void notifyInApp({
          personIds: [...others],
          kind: 'task-comment',
          title: `${me.name} commented on “${task.title}”`,
          message: text.trim().slice(0, 140),
          link: me.role === 'admin' ? '/officer' : '/admin/tasks',
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not post the comment.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ mt: 1 }} data-testid={`thread-${task.id}`}>
      <Button size="small" startIcon={<ChatBubbleOutlineRoundedIcon />} onClick={() => setOpen((v) => !v)} sx={{ px: 0.5 }}>
        {open ? 'Hide comments' : comments.length ? `Comments (${comments.length})` : 'Add a comment'}
      </Button>
      <Collapse in={open} unmountOnExit>
        <Stack spacing={1} sx={{ mt: 1 }}>
          {comments.map((c) => (
            <Box
              key={c.id}
              sx={{
                p: 1.25,
                borderRadius: '10px',
                bgcolor: c.authorId === me.personId ? alpha(brand.primary, 0.06) : alpha('#000', 0.03),
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                {c.authorName}
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  {when(c.createdAt)}
                </Typography>
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                {c.text}
              </Typography>
            </Box>
          ))}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'flex-start' }}>
            <TextField
              size="small"
              fullWidth
              multiline
              maxRows={4}
              placeholder="Write a comment…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              inputProps={{ maxLength: 1000, 'aria-label': 'Comment' }}
            />
            <Button variant="contained" size="small" disabled={busy || !text.trim()} onClick={() => void post()} sx={{ flexShrink: 0, mt: { sm: 0.25 } }}>
              Post
            </Button>
          </Stack>
          {error && (
            <Typography variant="caption" color="error">
              {error}
            </Typography>
          )}
        </Stack>
      </Collapse>
    </Box>
  );
}
