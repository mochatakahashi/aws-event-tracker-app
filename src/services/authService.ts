import type {
  AdminUserChanges,
  Credentials,
  ProfileChanges,
  SignUpData,
  User,
} from '../types/auth';
import { formatFullName, validateSignUp } from '../utils/people';
import { apiJson, delay, generateId, isRemoteAvailable, localCollection } from './apiClient';

/**
 * Accounts service.
 *
 * - Deployed (Vercel + DynamoDB): everything goes through `/api/users`, where
 *   passwords are hashed and accounts are shared by every device and login.
 * - Local fallback (`npm run dev`, tests): accounts live in this browser's
 *   localStorage so different logins on the same browser still see each
 *   other's changes. Passwords are stored as-is here, so this mode is for
 *   development only.
 */

interface LocalUser extends User {
  password: string;
}

const API = '/api/users';

/** Demo accounts. The same accounts are created in DynamoDB on first use. */
export const DEMO_USERS: LocalUser[] = [
  {
    username: 'admin',
    password: 'admin123',
    name: 'Admin User',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@awssbg-apc.com',
    role: 'admin',
    personId: 'per-1',
    status: 'approved',
    memberType: 'apc',
  },
  {
    username: 'rj',
    password: 'rj123',
    name: 'Rodmina Jhoy Ibe',
    firstName: 'Rodmina Jhoy',
    lastName: 'Ibe',
    email: 'rodmina@apc.edu.ph',
    role: 'officer',
    personId: 'per-2',
    studentId: 'APC-2024-001',
    status: 'approved',
    memberType: 'apc',
  },
  {
    username: 'sofia',
    password: 'sofia123',
    name: 'Sofia Rossi',
    firstName: 'Sofia',
    lastName: 'Rossi',
    email: 'sofia@apc.edu.ph',
    role: 'attendee',
    personId: 'per-3',
    studentId: 'APC-2024-042',
    status: 'approved',
    memberType: 'apc',
  },
  {
    username: 'kenji',
    password: 'kenji123',
    name: 'Kenji Tanaka',
    firstName: 'Kenji',
    lastName: 'Tanaka',
    email: 'kenji@apc.edu.ph',
    role: 'attendee',
    personId: 'per-4',
    studentId: 'APC-2024-088',
    status: 'approved',
    memberType: 'apc',
  },
  {
    username: 'grace',
    password: 'grace123',
    name: 'Grace Adeyemi',
    firstName: 'Grace',
    lastName: 'Adeyemi',
    email: 'grace@apc.edu.ph',
    role: 'attendee',
    personId: 'per-5',
    studentId: 'APC-2024-105',
    status: 'approved',
    memberType: 'apc',
  },
  {
    username: 'john.doe@student.apc.edu.ph',
    password: 'password123',
    name: 'John D. Doe',
    firstName: 'John',
    middleInitial: 'D',
    lastName: 'Doe',
    email: 'john.doe@student.apc.edu.ph',
    role: 'attendee',
    personId: 'per-6',
    studentId: 'APC-2024-999',
    status: 'pending',
    requestedRole: 'officer',
    memberType: 'apc',
    officerPosition: 'associate',
    committee: 'marketing',
  },
];

export const DEMO_CREDENTIALS = {
  admin: { username: 'admin', password: 'admin123' },
  officer: { username: 'rj', password: 'rj123' },
  attendee: { username: 'sofia', password: 'sofia123' },
};

const local = localCollection<LocalUser>('aws-event-tracker.users.v1', () =>
  DEMO_USERS.map((u) => ({ ...u })),
);

function strip(u: LocalUser): User {
  const { password: _pw, ...user } = u;
  void _pw;
  return user;
}

function matchesLogin(u: User, login: string): boolean {
  const id = login.trim().toLowerCase();
  return u.username.toLowerCase() === id || (u.email || '').toLowerCase() === id;
}

/** Message shown when an account cannot sign in yet. */
function statusError(u: User): Error | null {
  if (u.status === 'pending') {
    return new Error('Your account is waiting for admin approval. Please try again once it is approved.');
  }
  if (u.status === 'rejected') {
    return new Error('Your sign-up was declined by an admin. Please contact the AWS SBG-APC officers.');
  }
  return null;
}

/** Validate credentials. Resolves with the User (no password) on success. */
export async function login(credentials: Credentials): Promise<User> {
  if (await isRemoteAvailable(API)) {
    return apiJson<User>(`${API}?action=login`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }
  await delay(null, 200);
  const match = local
    .load()
    .find((u) => matchesLogin(u, credentials.username) && u.password === credentials.password);
  if (!match) throw new Error('Invalid email or password.');
  const blocked = statusError(match);
  if (blocked) throw blocked;
  return strip(match);
}

/** Create a new account. It stays `pending` until an admin approves it. */
export async function signUp(data: SignUpData): Promise<User> {
  const invalid = validateSignUp(data);
  if (invalid) throw new Error(invalid);

  if (await isRemoteAvailable(API)) {
    return apiJson<User>(`${API}?action=signup`, { method: 'POST', body: JSON.stringify(data) });
  }

  await delay(null, 200);
  const users = local.load();
  const email = data.email.trim().toLowerCase();
  const existing = users.find((u) => matchesLogin(u, email));
  if (existing && existing.status !== 'rejected') {
    throw new Error('An account with this email already exists.');
  }
  const user: LocalUser = {
    ...buildUserFromSignUp(data),
    personId: existing?.personId ?? generateId('per'),
    password: data.password,
  };
  local.save([...users.filter((u) => u !== existing), user]);
  return strip(user);
}

/** Turn sign-up form data into a pending account (no id / password). */
export function buildUserFromSignUp(data: SignUpData): Omit<User, 'personId'> {
  const email = data.email.trim().toLowerCase();
  const isOfficer = data.accountType === 'officer';
  const isOutside = data.accountType === 'outside';
  const mi = data.middleInitial?.replace(/\./g, '').trim().toUpperCase() || undefined;
  return {
    username: email,
    email,
    name: formatFullName(data.firstName, mi, data.lastName),
    firstName: data.firstName.trim(),
    middleInitial: mi,
    lastName: data.lastName.trim(),
    personalEmail: isOfficer ? data.personalEmail?.trim() || undefined : undefined,
    role: 'attendee',
    requestedRole: isOfficer ? 'officer' : 'attendee',
    status: 'pending',
    memberType: isOutside ? 'outside' : 'apc',
    studentId: isOutside ? undefined : data.studentId?.trim(),
    organization: isOutside ? data.organization?.trim() : undefined,
    officerPosition: isOfficer ? data.officerPosition : undefined,
    committee: isOfficer ? data.committee : undefined,
    createdAt: new Date().toISOString(),
  };
}

/** All accounts (any status), without passwords. */
export async function getUsers(): Promise<User[]> {
  if (await isRemoteAvailable(API)) {
    return apiJson<User[]>(API);
  }
  return delay(local.load().map(strip));
}

/** One account by person id. */
export async function getUser(personId: string): Promise<User | null> {
  if (await isRemoteAvailable(API)) {
    try {
      return await apiJson<User>(`${API}?id=${encodeURIComponent(personId)}`);
    } catch {
      return null;
    }
  }
  const found = local.load().find((u) => u.personId === personId);
  return delay(found ? strip(found) : null);
}

/**
 * Update an account. `actorId` is the person making the change; role and
 * status changes are only accepted from an admin.
 */
export async function updateUser(
  personId: string,
  changes: AdminUserChanges,
  actorId: string,
): Promise<User> {
  if (await isRemoteAvailable(API)) {
    return apiJson<User>(`${API}?id=${encodeURIComponent(personId)}`, {
      method: 'PUT',
      body: JSON.stringify({ changes, actorId }),
    });
  }
  const users = local.load();
  const idx = users.findIndex((u) => u.personId === personId);
  if (idx === -1) throw new Error('User not found');
  const actor = users.find((u) => u.personId === actorId);
  const adminOnly = 'role' in changes || 'status' in changes || 'requestedRole' in changes;
  if (adminOnly && actor?.role !== 'admin') throw new Error('Only an admin can change roles or approve accounts.');
  if (!adminOnly && actorId !== personId && actor?.role !== 'admin') {
    throw new Error('You can only edit your own profile.');
  }
  const stamped =
    changes.status === 'approved' && users[idx].status !== 'approved'
      ? { approvedAt: new Date().toISOString(), approvedBy: actorId }
      : {};
  users[idx] = { ...users[idx], ...changes, ...stamped };
  local.save(users);
  return delay(strip(users[idx]));
}

/** Update your own profile (photo, bio, socials, personal email). */
export function updateProfile(personId: string, changes: ProfileChanges): Promise<User> {
  return updateUser(personId, changes, personId);
}

/** Approve a pending account and grant the role it asked for. */
export async function approveUser(personId: string, actorId: string): Promise<User> {
  const user = (await getUsers()).find((u) => u.personId === personId);
  if (!user) throw new Error('User not found');
  return updateUser(
    personId,
    {
      status: 'approved',
      role: user.requestedRole === 'officer' ? 'officer' : user.requestedRole === 'admin' ? 'admin' : user.role,
      requestedRole: null,
    },
    actorId,
  );
}

/** Decline a pending account. The person can sign up again with the same email. */
export function rejectUser(personId: string, actorId: string): Promise<User> {
  return updateUser(personId, { status: 'rejected', requestedRole: null }, actorId);
}

/** Change an account's role (admin). Kept for older callers that use the username. */
export async function updateUserRole(
  username: string,
  role: 'admin' | 'officer' | 'attendee',
  actorId: string,
): Promise<User> {
  const user = (await getUsers()).find((u) => u.username === username);
  if (!user) throw new Error('User not found');
  return updateUser(user.personId, { role, requestedRole: null }, actorId);
}

/** Change your password. */
export async function changePassword(
  personId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  if (newPassword.length < 6) throw new Error('New password must be at least 6 characters.');
  if (await isRemoteAvailable(API)) {
    await apiJson(`${API}?action=password`, {
      method: 'POST',
      body: JSON.stringify({ id: personId, currentPassword, newPassword }),
    });
    return;
  }
  const users = local.load();
  const idx = users.findIndex((u) => u.personId === personId);
  if (idx === -1 || users[idx].password !== currentPassword) {
    throw new Error('Your current password is incorrect.');
  }
  users[idx] = { ...users[idx], password: newPassword };
  local.save(users);
  await delay(null);
}

/** Reset local accounts to the demo set (tests / dev only). */
export function __resetUsers(): void {
  local.reset();
}
