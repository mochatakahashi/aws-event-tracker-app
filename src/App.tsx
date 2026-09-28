import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import EventFlowPage from './pages/EventFlowPage';
import SessionDetailPage from './pages/SessionDetailPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import MorePage from './pages/MorePage';
import OfficerDashboardPage from './pages/OfficerDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <EventProvider>
          <BrowserRouter>
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
                <Route path="/flow" element={<EventFlowPage />} />
                <Route path="/flow/session/:id" element={<SessionDetailPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:id" element={<EventDetailPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/more" element={<MorePage />} />
                <Route path="/officer" element={<OfficerDashboardPage />} />
                <Route path="/admin" element={<AdminDashboardPage />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </EventProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
