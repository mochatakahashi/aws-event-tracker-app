import { describe, it, expect, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import DashboardPage from './DashboardPage';
import { renderWithProviders } from '../test/renderWithProviders';
import { __resetEvents } from '../services/eventService';
import { __resetSpeakers } from '../services/speakerService';
import { __resetRegistrations } from '../services/registrationService';
import { seedEvents } from '../services/seedData';

describe('DashboardPage', () => {
  beforeEach(() => {
    __resetEvents();
    __resetSpeakers();
    __resetRegistrations();
  });

  it('shows the upcoming-events count matching the seed data', async () => {
    renderWithProviders(<DashboardPage />);
    // Wait for load: the summary label appears inside a MuiCard.
    const label = await screen.findByText('Upcoming events', {
      selector: '.MuiCard-root .MuiTypography-root',
    });

    const upcoming = seedEvents.filter((e) => e.status === 'upcoming').length;
    const card = label.closest('.MuiCard-root') as HTMLElement;
    expect(within(card).getByText(String(upcoming))).toBeInTheDocument();
  });

  it('lists upcoming events', async () => {
    renderWithProviders(<DashboardPage />);
    // CloudConf 2026 is an upcoming event in the seed.
    expect(await screen.findByText(/CloudConf 2026/i)).toBeInTheDocument();
  });
});
