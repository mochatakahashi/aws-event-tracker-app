import { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import RestaurantRoundedIcon from '@mui/icons-material/RestaurantRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import type { AppEvent, FoodMeal } from '../types/event';
import {
  FOOD_KIND_LABELS,
  getFoodBoard,
  getMyFood,
  giveMeal,
  mealDateTime,
  mealOpen,
  mealTime,
  undoMeal,
  type FoodBoard,
  type MealClaim,
  type MyFood,
} from '../services/foodService';

/** One meal row with a Give button, or who gave it and when. */
function MealRow({
  meal,
  claim,
  busy,
  onGive,
  onUndo,
  giverName,
}: {
  meal: FoodMeal;
  claim?: MealClaim;
  busy: boolean;
  onGive: () => void;
  onUndo?: () => void;
  giverName?: string;
}) {
  const open = mealOpen(meal);
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} data-testid={`give-${meal.id}`}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {meal.label}
        </Typography>
        {claim ? (
          <Typography variant="caption" sx={{ color: brand.success, fontWeight: 700 }}>
            Already claimed at {mealTime(claim.claimedAt)}
            {giverName ? ` (given by ${giverName})` : ''}
          </Typography>
        ) : !open ? (
          <Typography variant="caption" color="text.secondary">
            Opens {mealDateTime(meal.opensAt!)}
          </Typography>
        ) : null}
      </Box>
      {claim ? (
        onUndo ? (
          <Button size="small" color="inherit" onClick={onUndo} disabled={busy} sx={{ textTransform: 'none' }}>
            Undo
          </Button>
        ) : (
          <CheckCircleRoundedIcon sx={{ color: brand.success }} />
        )
      ) : (
        <Button
          variant="contained"
          color="warning"
          size="small"
          onClick={onGive}
          disabled={busy || !open}
          startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <RestaurantRoundedIcon />}
          sx={{ textTransform: 'none', fontWeight: 800, borderRadius: '10px', whiteSpace: 'nowrap' }}
        >
          Give {meal.label}
        </Button>
      )}
    </Stack>
  );
}

/**
 * On the scan result card: the person's food stubs with a Give button per
 * meal (food team and admins). Refreshes when they get checked in.
 */
export function ScanFoodSection({
  event,
  personId,
  actorId,
  refreshKey,
  nameOf,
}: {
  event: AppEvent;
  personId: string;
  actorId: string;
  refreshKey?: string;
  nameOf: (id: string) => string | undefined;
}) {
  const [data, setData] = useState<MyFood | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const load = useCallback(() => {
    getMyFood(event.id, personId, actorId)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load the food stubs.'));
  }, [event.id, personId, actorId]);
  useEffect(() => {
    setNote('');
    setError('');
    load();
  }, [load, refreshKey]);

  async function give(meal: FoodMeal) {
    setBusy(meal.id);
    setError('');
    setNote('');
    try {
      const r = await giveMeal(event.id, personId, meal.id, actorId);
      setNote(r.alreadyClaimed ? `${meal.label} was already claimed at ${mealTime(r.claim.claimedAt)}. Don't give another.` : `${meal.label} given. Enjoy!`);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not give the meal.');
    } finally {
      setBusy(null);
    }
  }

  if (!data) return error ? <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert> : null;
  return (
    <Box
      data-testid="scan-food"
      sx={{ mt: 2.5, p: 1.75, borderRadius: '14px', border: `1px dashed ${alpha(brand.warning, 0.7)}`, bgcolor: alpha(brand.warning, 0.06) }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <RestaurantRoundedIcon sx={{ color: brand.warning }} fontSize="small" />
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          Food stubs
        </Typography>
        {data.kind && <Chip size="small" label={FOOD_KIND_LABELS[data.kind]} variant="outlined" />}
      </Stack>
      {!data.eligible ? (
        <Typography variant="body2" color="text.secondary">
          No food stubs yet: check them in first.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {data.food.meals.map((m) => {
            const claim = data.claims.find((c) => c.mealId === m.id);
            return <MealRow key={m.id} meal={m} claim={claim} busy={busy === m.id} onGive={() => void give(m)} giverName={claim ? nameOf(claim.givenBy) : undefined} />;
          })}
        </Stack>
      )}
      {note && (
        <Alert severity={/already/.test(note) ? 'warning' : 'success'} sx={{ mt: 1.25 }} data-testid="food-note">
          {note}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 1.25 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}

/**
 * Event Desk "Food" tab: pick a meal, see how many were given, find people
 * who can't be scanned (officers, speakers) and give or undo by hand.
 */
export function FoodDeskPanel({
  event,
  actorId,
  onScan,
  nameOf,
}: {
  event: AppEvent;
  actorId: string;
  onScan: () => void;
  nameOf: (id: string) => string | undefined;
}) {
  const [board, setBoard] = useState<FoodBoard | null>(null);
  const [mealId, setMealId] = useState('');
  const [show, setShow] = useState<'waiting' | 'claimed' | 'all'>('waiting');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    getFoodBoard(event.id, actorId)
      .then((b) => {
        setBoard(b);
        setMealId((cur) => (cur && b.food.meals.some((m) => m.id === cur) ? cur : b.food.meals.find((m) => mealOpen(m))?.id || b.food.meals[0]?.id || ''));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load the food list.'));
  }, [event.id, actorId]);
  useEffect(() => {
    load();
    const t = window.setInterval(load, 20_000);
    return () => window.clearInterval(t);
  }, [load]);

  const meal = board?.food.meals.find((m) => m.id === mealId);
  const claimed = useMemo(() => new Map((board?.claims || []).filter((c) => c.mealId === mealId).map((c) => [c.personId, c])), [board, mealId]);
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (board?.people || [])
      .filter((p) => (show === 'all' ? true : show === 'claimed' ? claimed.has(p.personId) : !claimed.has(p.personId)))
      .filter((p) => !term || p.name.toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [board, q, show, claimed]);

  async function act(personId: string, undo: boolean) {
    if (!meal) return;
    setBusy(personId);
    setError('');
    try {
      if (undo) await undoMeal(event.id, personId, meal.id, actorId);
      else await giveMeal(event.id, personId, meal.id, actorId);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(null);
    }
  }

  if (!board) return error ? <Alert severity="error">{error}</Alert> : <LinearProgress />;
  if (!board.food.enabled) return <Alert severity="info">Food stubs are off for this event. An admin can turn them on in Edit event.</Alert>;

  const total = board.people.length;
  return (
    <Box data-testid="food-desk">
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ sm: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={mealId}
          onChange={(_e, v) => v && setMealId(v)}
          aria-label="Meal"
          sx={{ flexWrap: 'wrap', '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 700 } }}
        >
          {board.food.meals.map((m) => (
            <ToggleButton key={m.id} value={m.id}>
              {m.label} {board.claims.filter((c) => c.mealId === m.id).length}/{total}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Button variant="contained" startIcon={<QrCodeScannerRoundedIcon />} onClick={onScan} sx={{ textTransform: 'none', fontWeight: 700 }}>
          Scan a pass
        </Button>
      </Stack>
      {meal && (
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '12px', mb: 2 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {meal.label}: {claimed.size} given, {total - claimed.size} left
            </Typography>
            {!mealOpen(meal) && (
              <Typography variant="caption" color="text.secondary">
                Opens {mealDateTime(meal.opensAt!)}
              </Typography>
            )}
          </Stack>
          <LinearProgress variant="determinate" value={total ? (claimed.size / total) * 100 : 0} color="warning" sx={{ height: 8, borderRadius: 4 }} />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
            Counts everyone who gets food now: checked-in attendees, the event team and speakers.
          </Typography>
        </Paper>
      )}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1.5 }}>
        <TextField
          size="small"
          placeholder="Find a name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          fullWidth
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
          inputProps={{ 'aria-label': 'Find a name' }}
        />
        <ToggleButtonGroup exclusive size="small" value={show} onChange={(_e, v) => v && setShow(v)} aria-label="Show">
          <ToggleButton value="waiting">Not yet</ToggleButton>
          <ToggleButton value="claimed">Claimed</ToggleButton>
          <ToggleButton value="all">All</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      <Stack spacing={1} data-testid="food-list">
        {rows.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            {show === 'waiting' ? 'Everyone here has claimed it.' : 'Nobody to show.'}
          </Typography>
        )}
        {meal &&
          rows.map((p) => {
            const c = claimed.get(p.personId);
            return (
              <Paper key={p.personId} variant="outlined" sx={{ p: 1.25, borderRadius: '12px' }} data-testid={`food-row-${p.personId}`}>
                <Stack direction="row" alignItems="center" spacing={1} justifyContent="space-between">
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                      {p.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {p.label}
                      {c ? ` · claimed ${mealTime(c.claimedAt)}${nameOf(c.givenBy) ? ` by ${nameOf(c.givenBy)}` : ''}` : ''}
                    </Typography>
                  </Box>
                  {c ? (
                    <Button size="small" color="inherit" onClick={() => void act(p.personId, true)} disabled={busy === p.personId} sx={{ textTransform: 'none' }}>
                      Undo
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      variant="contained"
                      color="warning"
                      onClick={() => void act(p.personId, false)}
                      disabled={busy === p.personId || !mealOpen(meal)}
                      sx={{ textTransform: 'none', fontWeight: 800, whiteSpace: 'nowrap' }}
                    >
                      Give {meal.label}
                    </Button>
                  )}
                </Stack>
              </Paper>
            );
          })}
      </Stack>
    </Box>
  );
}
