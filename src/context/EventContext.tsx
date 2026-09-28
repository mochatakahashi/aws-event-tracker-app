import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AppEvent } from '../types/event';

interface EventContextValue {
  /** The currently selected/active event. */
  selectedEvent: AppEvent | null;
  /** Set the active event (e.g. from the event selector page). */
  selectEvent: (event: AppEvent | null) => void;
}

const EventContext = createContext<EventContextValue | undefined>(undefined);

const STORAGE_KEY = 'aws-event-tracker.selectedEvent';

function readStoredEvent(): AppEvent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppEvent) : null;
  } catch {
    return null;
  }
}

import { getEvents, getEvent } from '../services/eventService';
import { getRegistrationsByPerson } from '../services/registrationService';
import { useAuth } from './AuthContext';

export function EventProvider({ children }: { children: ReactNode }) {
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(() => readStoredEvent());
  const { user } = useAuth();

  const selectEvent = useCallback((event: AppEvent | null) => {
    setSelectedEvent(event);
    if (event) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(event));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!selectedEvent) {
      if (user?.personId) {
        getRegistrationsByPerson(user.personId).then((regs) => {
          if (regs.length > 0) {
            // Sort by latest registered
            const sorted = [...regs].sort(
              (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
            );
            getEvent(sorted[0].eventId).then((evt) => {
              if (evt) selectEvent(evt);
            });
          } else {
            // Fallback
            getEvents().then((events) => {
              if (events.length > 0) selectEvent(events[0]);
            });
          }
        });
      } else {
        getEvents().then((events) => {
          if (events.length > 0) selectEvent(events[0]);
        });
      }
    }
  }, [selectedEvent, selectEvent, user?.personId]);

  const value = useMemo<EventContextValue>(
    () => ({ selectedEvent, selectEvent }),
    [selectedEvent, selectEvent],
  );

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

/** Access the event context. Throws if used outside an EventProvider. */
// eslint-disable-next-line react-refresh/only-export-components
export function useEvent(): EventContextValue {
  const ctx = useContext(EventContext);
  if (!ctx) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return ctx;
}
