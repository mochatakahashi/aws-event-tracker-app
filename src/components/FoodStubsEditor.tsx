import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { EventFood, FoodMeal } from '../types/event';
import { DateTimeField } from './Pickers';

export const DEFAULT_MEALS: FoodMeal[] = [
  { id: 'lunch', label: 'Lunch' },
  { id: 'snack', label: 'Snack' },
];

/** ISO → <input type="datetime-local"> value in Manila time. */
function toInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('sv-SE', { timeZone: 'Asia/Manila' }).replace(' ', 'T').slice(0, 16);
}

/** <input type="datetime-local"> value (Manila time) → ISO. */
function fromInput(v: string): string | undefined {
  if (!v) return undefined;
  const d = new Date(`${v.length === 16 ? `${v}:00` : v}+08:00`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

const slug = (label: string, taken: Set<string>) => {
  const base = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'meal';
  let id = base;
  let n = 2;
  while (taken.has(id)) id = `${base}-${n++}`;
  return id;
};

/**
 * Admin: food stubs for the event. When on, everyone who gets food (checked-in
 * attendees, the event team, co-organizer staff and speakers) can claim each
 * meal once; the food team gives it out by scanning their pass.
 */
export default function FoodStubsEditor({ value, onChange }: { value: EventFood | undefined; onChange: (next: EventFood) => void }) {
  const enabled = Boolean(value?.enabled);
  const meals = value?.meals?.length ? value.meals : DEFAULT_MEALS;
  const save = (next: FoodMeal[], on = enabled) => onChange({ enabled: on, meals: next });
  // "Turn on food" from Event staff opens the form here
  const ref = useRef<HTMLDivElement>(null);
  const { search } = useLocation();
  useEffect(() => {
    if (new URLSearchParams(search).get('focus') !== 'food') return;
    const t = window.setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 600);
    return () => window.clearTimeout(t);
  }, [search]);

  return (
    <Box data-testid="food-editor" id="food-stubs" ref={ref} sx={{ scrollMarginTop: 80 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap spacing={1} sx={{ mb: 0.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Food stubs
        </Typography>
        <FormControlLabel control={<Switch checked={enabled} onChange={(e) => save(meals, e.target.checked)} />} label="Give out food" />
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Each checked-in attendee, officer on the event, co-organizer staff and speaker gets one of each meal. The food team
        (tick <b>Food</b> for them under Event staff) scans their pass at the food table; a second claim is refused.
      </Typography>
      {enabled && (
        <Stack spacing={1}>
          {meals.map((m, i) => (
            <Stack key={m.id} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} data-testid={`meal-edit-${i}`}>
              <TextField
                size="small"
                label={`Meal ${i + 1}`}
                value={m.label}
                onChange={(e) => save(meals.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                inputProps={{ maxLength: 40 }}
                sx={{ flex: 1 }}
              />
              <Stack direction="row" spacing={1} alignItems="center">
                <DateTimeField
                  label="Opens at (optional)"
                  value={toInput(m.opensAt)}
                  onChange={(v) => save(meals.map((x, j) => (j === i ? { ...x, opensAt: fromInput(v) } : x)))}
                  sx={{ minWidth: 220, flex: 1 }}
                  testId={`meal-opens-${i}`}
                />
                <IconButton
                  size="small"
                  aria-label={`Remove ${m.label || `meal ${i + 1}`}`}
                  disabled={meals.length <= 1}
                  onClick={() => save(meals.filter((_, j) => j !== i))}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
          ))}
          {meals.length < 6 && (
            <Button
              size="small"
              startIcon={<AddIcon />}
              sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
              onClick={() => save([...meals, { id: slug(`meal ${meals.length + 1}`, new Set(meals.map((x) => x.id))), label: '' }])}
            >
              Add meal
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );
}
