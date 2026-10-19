import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Credentials, User } from '../types/auth';
import { login as loginService, getUser } from '../services/authService';
import { clearSavedCopies } from '../services/apiClient';

const STORAGE_KEY = 'aws-event-tracker.user';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: Credentials) => Promise<User>;
  logout: () => void;
  /** Replace the signed-in user after a profile change (photo, bio, …). */
  setCurrentUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser());

  // Keep localStorage in sync with the current user.
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  // The stored user can be stale (e.g. an admin changed the role, or the photo
  // was changed on another device). Refresh it once on startup.
  const storedPersonId = user?.personId;
  useEffect(() => {
    if (!storedPersonId) return;
    let cancelled = false;
    getUser(storedPersonId)
      .then((fresh) => {
        if (cancelled || !fresh) return;
        if (fresh.status === 'pending' || fresh.status === 'rejected') {
          setUser(null);
        } else {
          setUser(fresh);
        }
      })
      .catch(() => {
        /* keep the cached user when offline */
      });
    return () => {
      cancelled = true;
    };
  }, [storedPersonId]);

  const login = useCallback(async (credentials: Credentials) => {
    const loggedIn = await loginService(credentials);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const logout = useCallback(() => {
    clearSavedCopies();
    setUser(null);
  }, []);

  const setCurrentUser = useCallback((next: User) => {
    setUser(next);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, login, logout, setCurrentUser }),
    [user, login, logout, setCurrentUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Access the auth context. Throws if used outside an AuthProvider. */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
