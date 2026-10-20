import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Snackbar from '@mui/material/Snackbar';
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
  const page = typeof window === 'undefined' ? '' : `${origin}${window.location.pathname}`;
  if (await isRemoteAvailable('/api/events')) return `${origin}/api/events?action=share&id=${encodeURIComponent(eventId)}`;
  return `${page}#/e/${encodeURIComponent(eventId)}`;
}

/** Share an event: the phone's share sheet, or copy link / Facebook / email. */
export default function ShareEventButton({ event, sx }: { event: Pick<AppEvent, 'id' | 'title'>; sx?: object }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [link, setLink] = useState('');
  const [note, setNote] = useState('');

  async function open(el: HTMLElement) {
    const url = await eventShareLink(event.id);
    setLink(url);
    // Phones: the built-in share sheet (Messenger, Facebook, Instagram, SMS...)
    const coarse = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
    if (coarse && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: event.title, text: `Join me at ${event.title}!`, url });
        return;
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') return; // closed the share sheet
      }
    }
    setAnchor(el);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setNote('Link copied. Paste it anywhere to share the event.');
    } catch {
      window.prompt('Copy this link:', link);
    }
    setAnchor(null);
  }

  return (
    <>
      <Tooltip title="Share event">
        <IconButton aria-label="Share event" onClick={(e) => void open(e.currentTarget)} sx={sx}>
          <ShareRoundedIcon />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} data-testid="share-menu">
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
      <Snackbar open={Boolean(note)} autoHideDuration={2500} onClose={() => setNote('')} message={note} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </>
  );
}
