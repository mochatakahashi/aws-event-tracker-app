import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects to the login screen when not authenticated', async () => {
    render(<App />);
    // The login page shows the "Sign in to continue" subtitle.
    expect(
      await screen.findByText(/sign in to continue/i),
    ).toBeInTheDocument();
  });
});
