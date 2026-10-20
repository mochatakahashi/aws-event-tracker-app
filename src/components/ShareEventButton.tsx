import { useEffect, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Snackbar from '@mui/material/Snackbar';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import FacebookRoundedIcon from '@mui/icons-material/FacebookRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import { isRemoteAvailable } from '../services/apiClient';
import type { AppEvent } from '../types/event';

/**
 * The link to share for an event. When deployed it goes through
 * /api/events?action=share, which gives Facebook / Messenger a preview
 * (title, date, picture) and then opens the event. Locally it opens the event page directly.
 */
export async function eventShareLink(eventId: string): Promise<string> {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  if (await isRemoteAvailable('/api/events')) return `${origin}/api/events?action=share&id=${encodeURIComponent(eventId)}`;
  return directLink(eventId);
}

/** The page link (works everywhere, no preview), used until the preview link is known. */
function directLink(eventId: string, register = false): string {
  const page = typeof window === 'undefined' ? '' : `${window.location.origin}${window.location.pathname}`;
  return `${page}#/e/${encodeURIComponent(eventId)}${register ? '?register=1' : ''}`;
}

/**
 * The event's registration link: opens the event (sign in / sign up first if
 * needed) with a one-tap Register. Same as the event's saved `externalUrl` when deployed.
 */
export async function eventRegisterLink(eventId: string): Promise<string> {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  if (await isRemoteAvailable('/api/events')) return `${origin}/api/events?action=share&id=${encodeURIComponent(eventId)}&register=1`;
  return directLink(eventId, true);
}

/**
 * Share an event: the phone's share sheet, or copy link / Facebook / email.
 * The link is worked out when the button appears, so tapping it opens the share
 * sheet right away (phones only allow that straight from the tap).
 */
export default function ShareEventButton({ event, sx, size }: { event: Pick<AppEvent, 'id' | 'title'>; sx?: object; size?: 'small' | 'medium' }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [link, setLink] = useState(() => directLink(event.id));
  const [note, setNote] = useState('');
  const [showLink, setShowLink] = useState(false);

  useEffect(() => {
    let alive = true;
    setLink(directLink(event.id));
    eventShareLink(event.id)
      .then((url) => alive && setLink(url))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [event.id]);

  function open(el: HTMLElement) {
    // Phones and tablets: the built-in share sheet (Messenger, Facebook, Instagram, SMS...)
    const touch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
    if (touch && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      navigator
        .share({ title: event.title, text: `Join me at ${event.title}!`, url: link })
        .catch((e: Error) => {
          // Closed the sheet: nothing to do. Anything else (not allowed in this app's browser): show the menu.
          if (e?.name !== 'AbortError') setAnchor(el);
        });
      return;
    }
    setAnchor(el);
  }

  async function copy() {
    setAnchor(null);
    try {
      await navigator.clipboard.writeText(link);
      setNote('Link copied. Paste it anywhere to share the event.');
    } catch {
      // Clipboard blocked (some in-app browsers): show the link to copy by hand
      setShowLink(true);
    }
  }

  return (
    <>
      <Tooltip title="Share event">
        <IconButton
          aria-label="Share event"
          size={size}
          onClick={(e) => {
            e.stopPropagation();
            open(e.currentTarget);
          }}
          sx={sx}
        >
          <ShareRoundedIcon sx={size === 'small' ? { fontSize: 18 } : undefined} />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} data-testid="share-menu" onClick={(e) => e.stopPropagation()}>
        <MenuItem onClick={() => void copy()}>
          <ListItemIcon>
            <LinkRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy link</ListItemText>
        </MenuItem>
        <MenuItem
          component="a"
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setAnchor(null)}
        >
          <ListItemIcon>
            <FacebookRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share on Facebook</ListItemText>
        </MenuItem>
        <MenuItem
          component="a"
          href={`mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(`Join me at ${event.title}!\n${link}`)}`}
          onClick={() => setAnchor(null)}
        >
          <ListItemIcon>
            <EmailRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Send by email</ListItemText>
        </MenuItem>
      </Menu>
      <Dialog open={showLink} onClose={() => setShowLink(false)} fullWidth maxWidth="xs" onClick={(e) => e.stopPropagation()}>
        <DialogTitle sx={{ textTransform: 'none', letterSpacing: 0, fontWeight: 800 }}>Event link</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Copy this link and send it to anyone.
          </Typography>
          <TextField fullWidth size="small" value={link} inputProps={{ readOnly: true, 'aria-label': 'Event link' }} onFocus={(e) => e.target.select()} autoFocus />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLink(false)}>Done</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={Boolean(note)} autoHideDuration={2500} onClose={() => setNote('')} message={note} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </>
  );
}
