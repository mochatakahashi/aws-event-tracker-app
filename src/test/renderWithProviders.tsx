import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { AuthProvider } from '../context/AuthContext';
import theme from '../theme/theme';

interface Options extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  withAuth?: boolean;
}

/**
 * Render a component wrapped in the app's theme, router, and (optionally) auth
 * providers. Keeps individual tests focused on behavior rather than setup.
 */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', withAuth = true, ...options }: Options = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    const tree = (
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </ThemeProvider>
    );
    return withAuth ? <AuthProvider>{tree}</AuthProvider> : tree;
  }
  return render(ui, { wrapper: Wrapper, ...options });
}
