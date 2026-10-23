import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme/theme';
import { AuthProvider } from './context/AuthContext';
import { EventProvider } from './context/EventContext';
import ProtectedRoute from './components/ProtectedRoute';
import EventPreviewPage from './pages/EventPreviewPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AppLayout from './components/AppLayout';

// Public pages
import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Protected pages
import DashboardPage from './pages/DashboardPage';
import AchievementsPage from './pages/AchievementsPage';
import SessionDetailPage from './pages/SessionDetailPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import ProfilePage from './pages/ProfilePage';
import ConnectPage from './pages/ConnectPage';
import NotificationsPage from './pages/NotificationsPage';
import OfficerDashboardPage from './pages/OfficerDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminAttendeesPage from './pages/AdminAttendeesPage';
import AdminOfficersPage from './pages/AdminOfficersPage';
import AdminTasksPage from './pages/AdminTasksPage';
import EventBuilderPage from './pages/EventBuilderPage';
import NotFoundPage from './pages/NotFoundPage';
import EventPassPage from './pages/EventPassPage';
import OfficerScanPage from './pages/OfficerScanPage';
import VerifyCertificatePage from './pages/VerifyCertificatePage';
import LeaderboardPage from './pages/LeaderboardPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import PersonProfilePage from './pages/PersonProfilePage';
import LegalPage from './pages/LegalPage';

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
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify" element={<VerifyCertificatePage />} />
              <Route path="/verify/:id" element={<VerifyCertificatePage />} />
              {/* Shared event links: public preview (signed-in people go to the event page) */}
              <Route path="/e/:id" element={<EventPreviewPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/privacy" element={<LegalPage kind="privacy" />} />
              <Route path="/terms" element={<LegalPage kind="terms" />} />

              <Route
                path="/change-password"
                element={
                  <ProtectedRoute>
                    <ChangePasswordPage />
                  </ProtectedRoute>
                }
              />

              {/* Old event switcher: the dashboard follows your registrations now */}
              <Route path="/select-event" element={<Navigate to="/home" replace />} />

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
                <Route path="/officer" element={<OfficerDashboardPage />} />
                <Route path="/officer/scan" element={<OfficerScanPage />} />
                <Route path="/pass" element={<EventPassPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/people/:id" element={<PersonProfilePage />} />
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/attendees" element={<AdminAttendeesPage />} />
                <Route path="/admin/officers" element={<AdminOfficersPage />} />
                <Route path="/admin/tasks" element={<AdminTasksPage />} />
                {/* Committee Directors / Assistant Directors, the President and VPs */}
                <Route path="/officer/tasks" element={<AdminTasksPage />} />
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
