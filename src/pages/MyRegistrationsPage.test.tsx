import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import MyRegistrationsPage from './MyRegistrationsPage';
import { renderWithProviders } from '../test/renderWithProviders';
import { __resetEvents } from '../services/eventService';
import {
  __resetRegistrations,
  getRegistrationsByPerson,
} from '../services/registrationService';

function loginAs(personId: string) {
  localStorage.setItem(
    'aws-event-tracker.user',
    JSON.stringify({
      username: 'attendee',
      name: 'Attendee',
      role: 'attendee',
      personId,
    }),
  );
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<MyRegistrationsPage />} />
      <Route path="/events" element={<div>Browse page</div>} />
      <Route path="/events/:id" element={<div>Detail page</div>} />
    </Routes>,
    { route: '/' },
  );
}

describe('MyRegistrationsPage', () => {
  beforeEach(() => {
    __resetEvents();
    __resetRegistrations();
    localStorage.clear();
  });

  it('lists the events the current user registered for', async () => {
    loginAs('per-1'); // Admin User has reg-1 (evt-1) and reg-2 (evt-2).
    renderPage();

    expect(await screen.findByText(/CloudConf 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/Design Systems Workshop/i)).toBeInTheDocument();
  });

  it('shows an empty state when the user has no registrations', async () => {
    loginAs('per-99'); // Nobody with registrations.
    renderPage();

    expect(
      await screen.findByText(/not registered for any events/i),
    ).toBeInTheDocument();
  });

  it('cancels a registration', async () => {
    const user = userEvent.setup();
    loginAs('per-1');
    renderPage();

    await screen.findByText(/CloudConf 2026/i);
    expect(await getRegistrationsByPerson('per-1')).toHaveLength(2);

    // Cancel the first ticket.
    await user.click(screen.getAllByRole('button', { name: /cancel/i })[0]);

    await waitFor(async () => {
      expect(await getRegistrationsByPerson('per-1')).toHaveLength(1);
    });
  });
});
