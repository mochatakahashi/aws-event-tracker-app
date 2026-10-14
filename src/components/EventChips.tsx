import Chip from '@mui/material/Chip';
import type { EventModality, EventStatus, EventTag } from '../types/event';
import type { RsvpStatus } from '../types/attendee';
import {
  capitalize,
  modalityColor,
  statusColor,
  tagColor,
  tagLabel,
  rsvpColor,
} from '../utils/eventDisplay';

export function ModalityChip({ modality }: { modality: EventModality }) {
  return (
    <Chip
      size="small"
      color={modalityColor(modality)}
      label={capitalize(modality)}
    />
  );
}

export function StatusChip({ status }: { status: EventStatus }) {
  return (
    <Chip
      size="small"
      color={statusColor(status)}
      label={capitalize(status)}
      variant="outlined"
    />
  );
}

export function TagChip({ tag }: { tag: EventTag }) {
  return (
    <Chip
      size="small"
      label={tagLabel(tag)}
      sx={{
        backgroundColor: tagColor(tag) + '18',
        color: tagColor(tag),
        fontWeight: 600,
        border: `1px solid ${tagColor(tag)}40`,
        fontSize: '0.7rem',
        textTransform: 'uppercase',
      }}
    />
  );
}

export function RsvpChip({ rsvp }: { rsvp: RsvpStatus }) {
  return (
    <Chip size="small" color={rsvpColor(rsvp)} label={capitalize(rsvp)} />
  );
}
