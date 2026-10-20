import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import RestaurantRoundedIcon from '@mui/icons-material/RestaurantRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { alpha } from '@mui/material/styles';
import { brand } from '../theme/theme';
import type { AppEvent } from '../types/event';
import { getMyFood, mealDateTime, mealOpen, mealTime, type MyFood } from '../services/foodService';

/**
 * The person's food stubs for an event: each meal shows "Ready to claim",
 * "Opens at …" or "Claimed at …". Staff give the meal by scanning the pass,
 * so this only shows the status (refreshed every 30 s).
 */
export default function FoodStubsCard({
  event,
  personId,
  registered = false,
  compact = false,
}: {
  event: Pick<AppEvent, 'id' | 'food'>;
  personId: string;
  /** Registered attendees see the stubs (locked) before check-in. */
  registered?: boolean;
  compact?: boolean;
}) {
  const [data, setData] = useState<MyFood | null>(null);
  const on = Boolean(event.food?.enabled && event.food.meals?.length);

  useEffect(() => {
    if (!on) return;
    let alive = true;
    const load = () =>
      getMyFood(event.id, personId, personId)
        .then((d) => alive && setData(d))
        .catch(() => undefined);
    void load();
    const t = window.setInterval(load, 30_000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, [on, event.id, personId]);

  if (!on || !data || !data.food.enabled) return null;
  if (!data.eligible && !registered) return null;

  return (
    <Box
      data-testid="food-stubs"
      sx={{ mt: compact ? 1.5 : 2, p: compact ? 1.25 : 1.75, borderRadius: '14px', border: `1px dashed ${alpha(brand.warning, 0.6)}`, bgcolor: alpha(brand.warning, 0.06), textAlign: 'left' }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <RestaurantRoundedIcon sx={{ color: brand.warning }} fontSize="small" />
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          Food stubs
        </Typography>
      </Stack>
      {!data.eligible ? (
        <Typography variant="body2" color="text.secondary">
          Your food stubs unlock when you're checked in.
        </Typography>
      ) : (
        <>
          <Stack spacing={0.75}>
            {data.food.meals.map((m) => {
              const claim = data.claims.find((c) => c.mealId === m.id);
              const open = mealOpen(m);
              return (
                <Stack key={m.id} direction="row" justifyContent="space-between" alignItems="center" spacing={1} data-testid={`stub-${m.id}`}>
                  <Typography variant="body2" sx={{ fontWeight: 700, textDecoration: claim ? 'line-through' : 'none' }}>
                    {m.label}
                  </Typography>
                  {claim ? (
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: brand.success }}>
                      <CheckCircleRoundedIcon sx={{ fontSize: 16 }} />
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        Claimed {mealTime(claim.claimedAt)}
                      </Typography>
                    </Stack>
                  ) : open ? (
                    <Typography variant="caption" sx={{ fontWeight: 700, color: brand.warning }}>
                      Ready to claim
                    </Typography>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Opens {mealDateTime(m.opensAt!)}
                    </Typography>
                  )}
                </Stack>
              );
            })}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            One of each. Show this pass at the food table.
          </Typography>
        </>
      )}
    </Box>
  );
}
