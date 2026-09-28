import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import EventFormPage from './EventFormPage';
import { renderWithProviders } from '../test/renderWithProviders';
import { __resetEvents, getEvents, getEvent } from '../services/eventService';
import { __resetSpeakers } from '../services/speakerService';

function renderAt(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/events/new" element={<EventFormPage />} />
      <Route path="/events/:id/edit" element={<EventFormPage />} />
      <Route path="/events/:id" element={<div>Detail page</div>} />
    </Routes>,
    { route },
  );
}

describe('EventFormPage - create', () => {
  beforeEach(() => {
    __resetEvents();
    __resetSpeakers();
  });

  it('shows validation errors when required fields are empty', async () => {
    const user = userEvent.setup();
    renderAt('/events/new');

    await user.click(screen.getByRole('button', { name: /create event/i }));

    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
    expect(screen.getByText(/description is required/i)).toBeInTheDocument();
    expect(screen.getByText(/venue is required/i)).toBeInTheDocument();
  });

  it('creates a new event and navigates to its detail page', async () => {
    const user = userEvent.setup({ delay: null });
    renderAt('/events/new');

    await user.type(screen.getByLabelText(/title/i), 'React Summit');
    await user.type(
      screen.getByLabelText(/description/i),
      'A gathering of React developers.',
    );
    await user.type(screen.getByLabelText(/venue/i), 'Tech Center');
    await user.type(screen.getByLabelText(/starts/i), '2026-11-01T09:00');
    await user.type(screen.getByLabelText(/ends/i), '2026-11-01T17:00');

    await user.click(screen.getByRole('button', { name: /create event/i }));

    expect(
      await screen.findByText(/detail page/i, undefined, { timeout: 4000 }),
    ).toBeInTheDocument();
    const after = await getEvents();
    expect(after.some((e) => e.title === 'React Summit')).toBe(true);
  });

  it('imports a speaker from a LinkedIn URL and assigns them', async () => {
    const user = userEvent.setup({ delay: null });
    renderAt('/events/new');

    await user.type(
      screen.getByLabelText(/linkedin profile url/i),
      'https://www.linkedin.com/in/jane-doe',
    );
    await user.click(screen.getByRole('button', { name: /import/i }));

    // The imported speaker appears as a selected chip in the Autocomplete.
    // The mock LinkedIn lookup is intentionally slow, so allow extra time.
    expect(
      await screen.findByText('Jane Doe', undefined, { timeout: 4000 }),
    ).toBeInTheDocument();
  });
});

describe('EventFormPage - edit', () => {
  beforeEach(() => {
    __resetEvents();
    __resetSpeakers();
  });

  it('prefills and updates an existing event', async () => {
    const user = userEvent.setup({ delay: null });
    renderAt('/events/evt-1/edit');

    const titleInput = await screen.findByLabelText(/title/i);
    expect(titleInput).toHaveValue('CloudConf 2026');

    await user.clear(titleInput);
    await user.type(titleInput, 'CloudConf 2026 (Updated)');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(
      () => {
        expect(screen.getByText(/detail page/i)).toBeInTheDocument();
      },
      { timeout: 4000 },
    );
    const updated = await getEvent('evt-1');
    expect(updated?.title).toBe('CloudConf 2026 (Updated)');
  });
});
