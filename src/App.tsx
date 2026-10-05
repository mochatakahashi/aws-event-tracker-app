import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme/theme';
import { AuthProvider } from './context/AuthContext';
import { EventProvider } from './context/EventContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

// Public pages
import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';

// Protected pages
import SelectEventPage from './pages/SelectEventPage';
import DashboardPage from './pages/DashboardPage';
import AchievementsPage from './pages/AchievementsPage';
import SessionDetailPage from './pages/SessionDetailPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import ProfilePage from './pages/ProfilePage';
import ConnectPage from './pages/ConnectPage';
import NotificationsPage from './pages/NotificationsPage';
import MorePage from './pages/MorePage';
import OfficerDashboardPage from './pages/OfficerDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import EventBuilderPage from './pages/EventBuilderPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <EventProvider>
          <HashRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<WelcomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />

              {/* Protected: Select event (no layout, standalone) */}
              <Route
                path="/select-event"
                element={
                  <ProtectedRoute>
                    <SelectEventPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected: Main app with layout */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/home" element={<DashboardPage />} />
                <Route path="/achievements" element={<AchievementsPage />} />
                <Route path="/achievements/session/:id" element={<SessionDetailPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:id" element={<EventDetailPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/connect" element={<ConnectPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/more" element={<MorePage />} />
                <Route path="/officer" element={<OfficerDashboardPage />} />
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/events/new" element={<EventBuilderPage />} />
                <Route path="/admin/events/:id/edit" element={<EventBuilderPage />} />

                {/* Redirect old /flow routes to /achievements */}
                <Route path="/flow" element={<Navigate to="/achievements" replace />} />
                <Route path="/flow/session/:id" element={<Navigate to="/achievements" replace />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </HashRouter>
        </EventProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
