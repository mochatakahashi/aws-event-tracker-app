import type { Credentials, User } from '../types/auth';

/**
 * Hardcoded users for the mock auth flow. In a real app this would be replaced
 * by a call to an identity provider (e.g. Cognito). Passwords live here only
 * because there is no backend yet; never do this in production.
 */
interface MockUser extends User {
  password: string;
}

const MOCK_USERS: MockUser[] = [
  {
    username: 'admin',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
    personId: 'per-1',
  },
  {
    username: 'attendee',
    password: 'attendee123',
    name: 'Sofia Rossi',
    role: 'attendee',
    personId: 'per-3',
  },
];

/** Simulated network latency (ms). */
const LATENCY = 200;

/**
 * Validate credentials against the hardcoded user list.
 * Resolves with the User (minus password) on success, rejects on bad creds.
 */
export async function login(credentials: Credentials): Promise<User> {
  const { username, password } = credentials;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const match = MOCK_USERS.find(
        (u) => u.username === username.trim() && u.password === password,
      );
      if (!match) {
        reject(new Error('Invalid username or password.'));
        return;
      }
      const { password: _pw, ...user } = match;
      void _pw;
      resolve(user);
    }, LATENCY);
  });
}

/** The demo credentials, surfaced on the login page as a hint. */
export const DEMO_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
};
