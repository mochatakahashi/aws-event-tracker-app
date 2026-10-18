import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import type { Committee, OfficerPosition, Subcommittee } from '../types/auth';
import {
  COMMITTEES,
  COMMITTEE_LABELS,
  OFFICER_POSITIONS,
  POSITION_LABELS,
  SUBCOMMITTEE_LABELS,
  positionNeedsCommittee,
  subcommitteesOf,
} from '../utils/people';

export interface OfficerRoleValue {
  officerPosition: OfficerPosition | '';
  committee: Committee | '';
  subcommittee: Subcommittee | '';
}

/** Officer position → committee → sub-committee pickers (sign-up and admin "Add account"). */
export default function OfficerRoleFields({
  value,
  onChange,
  size,
}: {
  value: OfficerRoleValue;
  onChange: (next: OfficerRoleValue) => void;
  size?: 'small' | 'medium';
}) {
  const subs = subcommitteesOf(value.committee || undefined);
  return (
    <>
      <TextField
        select
        label="Officer Position"
        value={value.officerPosition}
        onChange={(e) => {
          const v = e.target.value as OfficerPosition;
          onChange(positionNeedsCommittee(v) ? { ...value, officerPosition: v } : { officerPosition: v, committee: '', subcommittee: '' });
        }}
        fullWidth
        margin="normal"
        size={size}
        required
      >
        {OFFICER_POSITIONS.map((p) => (
          <MenuItem key={p} value={p}>
            {POSITION_LABELS[p]}
          </MenuItem>
        ))}
      </TextField>
      {positionNeedsCommittee(value.officerPosition || undefined) && (
        <TextField
          select
          label="Committee"
          value={value.committee}
          onChange={(e) => onChange({ ...value, committee: e.target.value as Committee, subcommittee: '' })}
          fullWidth
          margin="normal"
          size={size}
          required
        >
          {COMMITTEES.map((c) => (
            <MenuItem key={c} value={c}>
              {COMMITTEE_LABELS[c]}
              {subcommitteesOf(c).length > 0 && ` (${subcommitteesOf(c).map((s) => SUBCOMMITTEE_LABELS[s]).join(', ')})`}
            </MenuItem>
          ))}
        </TextField>
      )}
      {subs.length > 0 && (
        <TextField
          select
          label="Sub-committee"
          value={value.subcommittee}
          onChange={(e) => onChange({ ...value, subcommittee: e.target.value as Subcommittee })}
          fullWidth
          margin="normal"
          size={size}
          helperText="Optional"
        >
          <MenuItem value="">Not sure yet</MenuItem>
          {subs.map((s) => (
            <MenuItem key={s} value={s}>
              {SUBCOMMITTEE_LABELS[s]}
            </MenuItem>
          ))}
        </TextField>
      )}
    </>
  );
}
