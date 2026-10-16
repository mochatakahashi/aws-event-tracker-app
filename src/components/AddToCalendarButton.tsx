import { useState } from 'react';
import Button, { type ButtonProps } from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import GoogleIcon from '@mui/icons-material/Google';
import DownloadIcon from '@mui/icons-material/Download';
import type { AppEvent } from '../types/event';
import { getSessionsByEvent } from '../services/sessionService';
import { downloadIcs, eventPageUrl, googleCalendarUrl } from '../utils/calendar';

interface Props {
  event: AppEvent;
  fullWidth?: boolean;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
}

/** "Add to calendar" → Google Calendar link or an .ics download (Apple / Outlook). */
export default function AddToCalendarButton({ event, fullWidth, variant = 'outlined', size = 'medium' }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  async function sessions() {
    try {
      return await getSessionsByEvent(event.id);
    } catch {
      return [];
    }
  }

  async function openGoogle() {
    setAnchor(null);
    // Open the tab right away (pop-up blockers), then point it at the full link.
    const tab = window.open('about:blank', '_blank');
    const url = googleCalendarUrl(event, await sessions(), eventPageUrl(event.id));
    if (tab) tab.location.href = url;
    else window.location.href = url;
  }

  async function saveIcs() {
    setAnchor(null);
    downloadIcs(event, await sessions());
  }

  return (
    <>
      <Button
        fullWidth={fullWidth}
        variant={variant}
        size={size}
        startIcon={<EventAvailableIcon />}
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="menu"
        sx={{ borderRadius: '12px', fontWeight: 700 }}
      >
        Add to Calendar
      </Button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <MenuItem onClick={openGoogle}>
          <ListItemIcon>
            <GoogleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Google Calendar" />
        </MenuItem>
        <MenuItem onClick={saveIcs}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Apple / Outlook (.ics)" secondary="Downloads a calendar file" />
        </MenuItem>
      </Menu>
    </>
  );
}
