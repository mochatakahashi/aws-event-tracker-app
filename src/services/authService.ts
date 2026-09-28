import type { Credentials, User } from '../types/auth';

/**
 * Hardcoded users for the mock auth flow. In a real app this would be replaced
 * by a call to an identity provider (e.g. Cognito). Passwords live here only
 * because there is no backend yet; never do this in production.
 */
interface MockUser extends User {
  password: string;
}

let MOCK_USERS: MockUser[] = [
  {
    username: 'admin',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
    personId: 'per-1',
  },
  {
    username: 'rj',
    password: 'rj123',
    name: 'Rodmina Jhoy Ibe',
    role: 'officer',
    personId: 'per-2',
    studentId: 'APC-2024-001',
  },
  {
    username: 'sofia',
    password: 'sofia123',
    name: 'Sofia Rossi',
    role: 'attendee',
    personId: 'per-3',
    studentId: 'APC-2024-042',
  },
  {
    username: 'kenji',
    password: 'kenji123',
    name: 'Kenji Tanaka',
    role: 'attendee',
    personId: 'per-4',
    studentId: 'APC-2024-088',
  },
  {
    username: 'grace',
    password: 'grace123',
    name: 'Grace Adeyemi',
    role: 'attendee',
    personId: 'per-5',
    studentId: 'APC-2024-105',
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

export const DEMO_CREDENTIALS = {
  admin: { username: 'admin', password: 'admin123' },
  officer: { username: 'rj', password: 'rj123' },
  attendee: { username: 'sofia', password: 'sofia123' },
};

export async function getUsers(): Promise<User[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_USERS.map(({ password: _pw, ...u }) => u));
    }, LATENCY);
  });
}

export async function updateUserRole(username: string, role: 'admin' | 'officer' | 'attendee'): Promise<User> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const idx = MOCK_USERS.findIndex(u => u.username === username);
      if (idx === -1) return reject(new Error('User not found'));
      MOCK_USERS[idx].role = role;
      const { password: _pw, ...user } = MOCK_USERS[idx];
      resolve(user);
    }, LATENCY);
  });
}
