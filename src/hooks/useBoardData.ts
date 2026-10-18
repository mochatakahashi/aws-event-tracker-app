import { useEffect, useState } from 'react';
import { getEvents } from '../services/eventService';
import { getSessions, getStamps } from '../services/sessionService';
import { getAllRegistrations, getPeople } from '../services/registrationService';
import { getTasks } from '../services/taskService';
import type { BoardData } from '../utils/leaderboard';

/** Everything the leaderboard and "Your standing" need, loaded once. */
export function useBoardData() {
  const [data, setData] = useState<BoardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    Promise.all([getPeople(), getStamps(), getSessions(), getAllRegistrations(), getTasks(), getEvents()])
      .then(([people, stamps, sessions, registrations, tasks, events]) => {
        if (alive) setData({ people, stamps, sessions, registrations, tasks, events });
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : 'Could not load the leaderboard.'));
    return () => {
      alive = false;
    };
  }, []);

  return { data, error, loading: !data && !error };
}
