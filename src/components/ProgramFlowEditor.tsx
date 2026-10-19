import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import ContentPasteRoundedIcon from '@mui/icons-material/ContentPasteRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ProgramFlowTable, { parseProgramFlow } from './ProgramFlowTable';
import type { ProgramRow } from '../types/event';

/** Event form: paste the program from a document (becomes a table), or edit it row by row. */
export default function ProgramFlowEditor({ value, onChange }: { value: ProgramRow[]; onChange: (rows: ProgramRow[]) => void }) {
  const [pasting, setPasting] = useState(false);
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const set = (i: number, k: keyof ProgramRow, v: string) => onChange(value.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  return (
    <Box data-testid="program-flow-editor">
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }} flexWrap="wrap" useFlexGap spacing={1}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Program flow
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" startIcon={<ContentPasteRoundedIcon />} onClick={() => setPasting((v) => !v)} sx={{ textTransform: 'none' }}>
            Paste from document
          </Button>
          <Button size="small" startIcon={<AddIcon />} onClick={() => onChange([...value, { time: '', duration: '', activity: '', personInCharge: '' }])} sx={{ textTransform: 'none' }}>
            Add row
          </Button>
        </Stack>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Shown on the event page as a table (Time · Duration · Activity · Person-in-charge). Optional.
      </Typography>
      {pasting && (
        <Box sx={{ mb: 2 }}>
          <TextField
            multiline
            minRows={5}
            fullWidth
            size="small"
            label="Paste the program here"
            placeholder={'07:00 AM - 07:30 AM\n30 mins\nIngress and Technical Setup\nOperations\n…'}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Stack direction="row" spacing={1} sx={{ mt: 1 }} justifyContent="flex-end">
            <Button size="small" onClick={() => setPasting(false)}>
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              disabled={!text.trim()}
              onClick={() => {
                const rows = parseProgramFlow(text);
                if (!rows.length) return setNote('Could not find any rows. Each row should start with a time like “01:00 PM - 01:30 PM”.');
                onChange(rows);
                setNote(`Made a table with ${rows.length} rows — check it below.`);
                setText('');
                setPasting(false);
              }}
            >
              Make table
            </Button>
          </Stack>
        </Box>
      )}
      {note && (
        <Alert severity="info" sx={{ mb: 1.5 }} onClose={() => setNote('')}>
          {note}
        </Alert>
      )}
      <Stack spacing={1}>
        {value.map((r, i) => (
          <Box
            key={i}
            sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '170px 90px minmax(0, 2fr) minmax(0, 1.4fr) 36px' }, gap: 1, alignItems: 'center' }}
          >
            <TextField size="small" label="Time" value={r.time} onChange={(e) => set(i, 'time', e.target.value)} />
            <TextField size="small" label="Duration" value={r.duration ?? ''} onChange={(e) => set(i, 'duration', e.target.value)} />
            <TextField size="small" label="Activity" value={r.activity} onChange={(e) => set(i, 'activity', e.target.value)} />
            <TextField size="small" label="Person-in-charge" value={r.personInCharge ?? ''} onChange={(e) => set(i, 'personInCharge', e.target.value)} />
            <IconButton size="small" aria-label={`Remove row ${i + 1}`} onClick={() => onChange(value.filter((_, j) => j !== i))}>
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Stack>
      {value.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
            Preview
          </Typography>
          <ProgramFlowTable rows={value} />
        </Box>
      )}
    </Box>
  );
}
