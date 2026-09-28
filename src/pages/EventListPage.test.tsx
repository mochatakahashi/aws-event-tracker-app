import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventListPage from './EventListPage';
import { renderWithProviders } from '../test/renderWithProviders';
import { __resetEvents } from '../services/eventService';
import { __resetRegistrations } from '../services/registrationService';

describe('EventListPage', () => {
  beforeEach(() => {
    __resetEvents();
    __resetRegistrations();
  });

  it('renders events from the mock service', async () => {
    renderWithProviders(<EventListPage />);
    expect(await screen.findByText(/CloudConf 2026/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Design Systems Workshop/i),
    ).toBeInTheDocument();
  });

  it('filters by search term', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EventListPage />);
    await screen.findByText(/CloudConf 2026/i);

    await user.type(screen.getByLabelText(/search/i), 'workshop');

    await waitFor(() => {
      expect(screen.queryByText(/CloudConf 2026/i)).not.toBeInTheDocument();
    });
    expect(screen.getByText(/Design Systems Workshop/i)).toBeInTheDocument();
  });

  it('filters by category', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EventListPage />);
    await screen.findByText(/CloudConf 2026/i);

    await user.click(screen.getByLabelText(/category/i));
    const listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByText('Webinar'));

    await waitFor(() => {
      expect(screen.queryByText(/CloudConf 2026/i)).not.toBeInTheDocument();
    });
    expect(
      screen.getByText(/Intro to Machine Learning/i),
    ).toBeInTheDocument();
  });

  it('shows an empty state when nothing matches', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EventListPage />);
    await screen.findByText(/CloudConf 2026/i);

    await user.type(screen.getByLabelText(/search/i), 'zzz-no-match');
    expect(
      await screen.findByText(/no events match your filters/i),
    ).toBeInTheDocument();
  });
});
