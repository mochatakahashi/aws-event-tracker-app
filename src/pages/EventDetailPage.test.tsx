import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import EventDetailPage from './EventDetailPage';
import { renderWithProviders } from '../test/renderWithProviders';
import { __resetEvents } from '../services/eventService';
import { __resetSpeakers } from '../services/speakerService';
import {
  __resetRegistrations,
  findRegistration,
} from '../services/registrationService';

// Log in as an attendee (per-3 / Sofia Rossi) so personId is available.
function loginAsAttendee() {
  localStorage.setItem(
    'aws-event-tracker.user',
    JSON.stringify({
      username: 'attendee',
      name: 'Sofia Rossi',
      role: 'attendee',
      personId: 'per-3',
    }),
  );
}

function renderAt(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/events/:id" element={<EventDetailPage />} />
      <Route path="/events" element={<div>Events list page</div>} />
    </Routes>,
    { route },
  );
}

describe('EventDetailPage', () => {
  beforeEach(() => {
    __resetEvents();
    __resetSpeakers();
    __resetRegistrations();
    localStorage.clear();
    loginAsAttendee();
  });

  it('renders event details with the speaker lineup', async () => {
    renderAt('/events/evt-1');
    expect(
      await screen.findByRole('heading', { name: /CloudConf 2026/i }),
    ).toBeInTheDocument();
    // evt-1 has speakers spk-1 (Amara Chen) and spk-3 (Priya Nair).
    expect(screen.getByText(/Dr\. Amara Chen/i)).toBeInTheDocument();
    expect(screen.getByText(/Priya Nair/i)).toBeInTheDocument();
  });

  it('shows a not-found state for an unknown id', async () => {
    renderAt('/events/nope');
    expect(await screen.findByText(/event not found/i)).toBeInTheDocument();
  });

  it('lets an attendee register for an event', async () => {
    const user = userEvent.setup();
    // evt-2: attendee per-3 is not registered in the seed.
    renderAt('/events/evt-2');
    await screen.findByRole('heading', { name: /Design Systems Workshop/i });

    expect(await findRegistration('evt-2', 'per-3')).toBeNull();

    await user.click(screen.getByRole('button', { name: /i'm going/i }));

    await waitFor(async () => {
      expect(await findRegistration('evt-2', 'per-3')).not.toBeNull();
    });
    // UI switches to the registered state.
    expect(
      await screen.findByText(/you are registered/i),
    ).toBeInTheDocument();
  });

  it('shows registered state and allows cancelling', async () => {
    const user = userEvent.setup();
    // evt-1: attendee per-3 IS registered in the seed (reg-3).
    renderAt('/events/evt-1');
    expect(
      await screen.findByText(/you are registered/i),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /cancel registration/i }),
    );

    await waitFor(async () => {
      expect(await findRegistration('evt-1', 'per-3')).toBeNull();
    });
  });
});
