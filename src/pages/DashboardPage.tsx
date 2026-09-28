import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { BarChart } from '@mui/x-charts/BarChart';
import { getEvents } from '../services/eventService';
import { getSpeakers } from '../services/speakerService';
import { getRegistrationsByEvent } from '../services/registrationService';
import { EVENT_CATEGORIES, type AppEvent } from '../types/event';
import { CategoryChip, StatusChip } from '../components/EventChips';
import { capitalize, formatDateTime } from '../utils/eventDisplay';

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography color="text.secondary" variant="body2" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h2">{value}</Typography>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [totalSpeakers, setTotalSpeakers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([getEvents(), getSpeakers()])
      .then(async ([evts, speakers]) => {
        const counts = await Promise.all(
          evts.map((e) => getRegistrationsByEvent(e.id)),
        );
        if (!active) return;
        setEvents(evts);
        setTotalSpeakers(speakers.length);
        setTotalRegistrations(counts.reduce((sum, r) => sum + r.length, 0));
      })
      .catch((err: unknown) => {
        if (active)
          setError(err instanceof Error ? err.message : 'Failed to load data.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const upcoming = useMemo(
    () => events.filter((e) => e.status === 'upcoming'),
    [events],
  );

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of EVENT_CATEGORIES) map.set(c, 0);
    for (const e of events) map.set(e.category, (map.get(e.category) ?? 0) + 1);
    return EVENT_CATEGORIES.map((c) => ({
      category: capitalize(c),
      count: map.get(c) ?? 0,
    }));
  }, [events]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h1" gutterBottom>
        Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <SummaryCard label="Upcoming events" value={upcoming.length} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <SummaryCard label="Total events" value={events.length} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <SummaryCard label="Registrations" value={totalRegistrations} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <SummaryCard label="Speakers" value={totalSpeakers} />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        {/* Events by category */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h3" gutterBottom>
              Events by category
            </Typography>
            {events.length === 0 ? (
              <Typography
                color="text.secondary"
                sx={{ py: 4, textAlign: 'center' }}
              >
                No events to chart.
              </Typography>
            ) : (
              <BarChart
                height={280}
                xAxis={[
                  {
                    scaleType: 'band',
                    data: byCategory.map((d) => d.category),
                    label: 'Category',
                  },
                ]}
                series={[
                  {
                    data: byCategory.map((d) => d.count),
                    label: 'Events',
                    color: '#0972d3',
                  },
                ]}
              />
            )}
          </Paper>
        </Grid>

        {/* Upcoming events */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h3" gutterBottom>
              Upcoming events
            </Typography>
            {upcoming.length === 0 ? (
              <Typography
                color="text.secondary"
                sx={{ py: 4, textAlign: 'center' }}
              >
                No upcoming events.
              </Typography>
            ) : (
              <List disablePadding>
                {upcoming.slice(0, 5).map((event, i) => (
                  <Box key={event.id}>
                    {i > 0 && <Divider component="li" />}
                    <ListItemButton
                      component={RouterLink}
                      to={`/events/${event.id}`}
                    >
                      <ListItemText
                        primary={event.title}
                        secondary={formatDateTime(event.startAt)}
                      />
                      <Stack direction="row" spacing={1}>
                        <CategoryChip category={event.category} />
                        <StatusChip status={event.status} />
                      </Stack>
                    </ListItemButton>
                  </Box>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
