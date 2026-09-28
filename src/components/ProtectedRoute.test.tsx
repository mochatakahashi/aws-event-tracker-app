import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { renderWithProviders } from '../test/renderWithProviders';

function ProtectedContent() {
  return <div>Secret dashboard</div>;
}

function LoginStub() {
  return <div>Login screen</div>;
}

function renderRoutes(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginStub />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ProtectedContent />
          </ProtectedRoute>
        }
      />
    </Routes>,
    { route },
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects unauthenticated users to login', () => {
    renderRoutes('/');
    expect(screen.getByText(/login screen/i)).toBeInTheDocument();
    expect(screen.queryByText(/secret dashboard/i)).not.toBeInTheDocument();
  });

  it('renders protected content when authenticated', () => {
    localStorage.setItem(
      'aws-event-tracker.user',
      JSON.stringify({ username: 'admin', name: 'Admin User', role: 'admin' }),
    );
    renderRoutes('/');
    expect(screen.getByText(/secret dashboard/i)).toBeInTheDocument();
  });
});
