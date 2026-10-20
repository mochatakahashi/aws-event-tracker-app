import type {
  AdminCreateAccount,
  AdminUserChanges,
  Credentials,
  ProfileChanges,
  SignUpData,
  User,
} from '../types/auth';
import { formatFullName, passwordError, positionNeedsCommittee, subcommitteesOf, validateSignUp } from '../utils/people';
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
  resetCode?: string;
  resetToken?: string;
  resetExpiresAt?: string;
  passwordChangedAt?: string;
}

const API = '/api/users';

/** Username of the built-in admin account. */
export const ADMIN_USERNAME = 'awsapc.admin';

/**
 * Local development only: the admin account for `npm run dev`, with the
 * password from VITE_LOCAL_ADMIN_PASSWORD in `.env.local` (not committed).
 * The deployed app creates its admin from ADMIN_PASSWORD on the server.
 */
function localSeedUsers(): LocalUser[] {
  const password = import.meta.env?.VITE_LOCAL_ADMIN_PASSWORD as string | undefined;
  if (!password) return [];
  return [
    {
      username: ADMIN_USERNAME,
      password,
      name: 'AWS SBG-APC Admin',
      firstName: 'AWS SBG-APC',
      lastName: 'Admin',
      email: 'aws.apcofficial@gmail.com',
      role: 'admin',
      personId: 'per-1',
      status: 'approved',
      memberType: 'apc',
    },
  ];
}

const local = localCollection<LocalUser>('aws-event-tracker.users.v2', localSeedUsers);

function loadLocalUsers(): LocalUser[] {
  const users = local.load();
  const password = import.meta.env?.VITE_LOCAL_ADMIN_PASSWORD as string | undefined;
  if (!password) return users;

  const idx = users.findIndex(
    (u) => matchesLogin(u, ADMIN_USERNAME) || matchesLogin(u, 'aws.apcofficial@gmail.com')
  );

  if (idx === -1) {
    const adminUser: LocalUser = {
      username: ADMIN_USERNAME,
      password,
      name: 'AWS SBG-APC Admin',
      firstName: 'AWS SBG-APC',
      lastName: 'Admin',
      email: 'aws.apcofficial@gmail.com',
      role: 'admin',
      personId: 'per-1',
      status: 'approved',
      memberType: 'apc',
    };
    const updated = [adminUser, ...users];
    local.save(updated);
    return updated;
  }

  if (users[idx].password !== password || users[idx].status !== 'approved' || users[idx].role !== 'admin') {
    const updated = [...users];
    updated[idx] = {
      ...updated[idx],
      password,
      role: 'admin',
      status: 'approved',
    };
    local.save(updated);
    return updated;
  }

  return users;
}

function strip(u: LocalUser): User {
  const { password: _pw, ...user } = u;
  void _pw;
  return user;
}

function matchesLogin(u: User, login: string): boolean {
  const id = login.trim().toLowerCase();
  return (
    u.username.toLowerCase() === id ||
    (u.email || '').toLowerCase() === id ||
    (u.personalEmail || '').toLowerCase() === id
  );
}

/** Message shown when an account cannot sign in yet. */
function statusError(u: User): Error | null {
  if (u.status === 'pending') {
    return new Error('Your account is waiting for admin approval. Please try again once it is approved.');
  }
  if (u.status === 'rejected') {
    return new Error(
      u.rejectionReason
        ? `Your sign-up was declined: ${u.rejectionReason}. You can sign up again with the correct details.`
        : 'Your sign-up was declined by an admin. Please contact the AWS SBG-APC officers.',
    );
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
  const match = loadLocalUsers().find(
    (u) => matchesLogin(u, credentials.username) && u.password === credentials.password
  );
  if (!match) throw new Error('Invalid email or password.');
  const blocked = statusError(match);
  if (blocked) throw blocked;
  const firstSignIn = !match.lastLoginAt && !match.tutorialSeen;
  const users = loadLocalUsers().map((u) =>
    u.personId === match.personId ? { ...u, lastLoginAt: new Date().toISOString(), loginCount: (u.loginCount ?? 0) + 1 } : u,
  );
  local.save(users);
  return { ...strip(users.find((u) => u.personId === match.personId)!), firstSignIn };
}

/** Create a new account. It stays `pending` until an admin approves it. */
export async function signUp(data: SignUpData): Promise<User> {
  const invalid = validateSignUp(data);
  if (invalid) throw new Error(invalid);

  if (await isRemoteAvailable(API)) {
    return apiJson<User>(`${API}?action=signup`, { method: 'POST', body: JSON.stringify(data) });
  }

  await delay(null, 200);
  const users = loadLocalUsers();
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
    committee: isOfficer && positionNeedsCommittee(data.officerPosition) ? data.committee : undefined,
    subcommittee:
      isOfficer && data.subcommittee && subcommitteesOf(data.committee).includes(data.subcommittee)
        ? data.subcommittee
        : undefined,
    signupType: data.accountType,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Admin creates an approved account with a temporary password. The person
 * must change it the first time they sign in.
 */
export async function createAccount(account: AdminCreateAccount, actorId: string): Promise<User> {
  const invalid = validateSignUp(account);
  if (invalid) throw new Error(invalid);
  if (await isRemoteAvailable(API)) {
    return apiJson<User>(`${API}?action=create`, { method: 'POST', body: JSON.stringify({ actorId, account }) });
  }
  const users = loadLocalUsers();
  if (users.find((u) => u.personId === actorId)?.role !== 'admin') throw new Error('Only an admin can create accounts.');
  const email = account.email.trim().toLowerCase();
  const existing = users.find((u) => matchesLogin(u, email));
  if (existing && existing.status !== 'rejected') throw new Error('An account with this email already exists.');
  const role = account.role || (account.accountType === 'officer' ? 'officer' : 'attendee');
  const user: LocalUser = {
    ...buildUserFromSignUp(account),
    personId: existing?.personId ?? generateId('per'),
    password: account.password,
    role,
    requestedRole: null,
    status: 'approved',
    approvedAt: new Date().toISOString(),
    approvedBy: actorId,
    mustChangePassword: true,
  };
  local.save([...users.filter((u) => u !== existing), user]);
  return delay(strip(user));
}

/** Admin sets a temporary password (e.g. someone forgot theirs). They must change it at sign-in. */
export async function resetPassword(personId: string, newPassword: string, actorId: string): Promise<User> {
  const pwError = passwordError(newPassword);
  if (pwError) throw new Error(pwError);
  if (await isRemoteAvailable(API)) {
    return apiJson<User>(`${API}?action=reset`, {
      method: 'POST',
      body: JSON.stringify({ actorId, id: personId, newPassword }),
    });
  }
  const users = loadLocalUsers();
  if (users.find((u) => u.personId === actorId)?.role !== 'admin') throw new Error('Only an admin can reset passwords.');
  const idx = users.findIndex((u) => u.personId === personId);
  if (idx === -1) throw new Error('User not found');
  users[idx] = { ...users[idx], password: newPassword, mustChangePassword: true };
  local.save(users);
  return delay(strip(users[idx]));
}

/** Request a password reset code / link to the user's email. */
export async function forgotPassword(email: string): Promise<{ success: boolean; message: string; devCode?: string }> {
  if (await isRemoteAvailable(API)) {
    return apiJson<{ success: boolean; message: string; devCode?: string }>(`${API}?action=forgot-password`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }
  const users = loadLocalUsers();
  const user = users.find((u) => matchesLogin(u, email));
  if (!user) {
    return { success: true, message: 'If an account exists with that email, a password reset code has been sent.' };
  }
  const code = '123456';
  const token = 'local-dev-token';
  const idx = users.findIndex((u) => u.personId === user.personId);
  users[idx] = {
    ...users[idx],
    resetCode: code,
    resetToken: token,
    resetExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
  } as any;
  local.save(users);
  return { success: true, devCode: code, message: `Password reset code sent. (Dev mode code: ${code})` };
}

/** Reset password using the code or token sent via email. */
export async function resetPasswordWithCode(
  email: string,
  code: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {
  const pwError = passwordError(newPassword);
  if (pwError) throw new Error(pwError);

  if (await isRemoteAvailable(API)) {
    return apiJson<{ success: boolean; message: string }>(`${API}?action=reset-password`, {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    });
  }
  const users = loadLocalUsers();
  const idx = users.findIndex((u) => matchesLogin(u, email));
  if (idx === -1) throw new Error('Account not found.');
  const user = users[idx] as any;
  const inputCode = code.trim().toLowerCase();
  if (user.resetCode !== inputCode && user.resetToken !== inputCode && inputCode !== '123456') {
    throw new Error('Invalid or incorrect reset code.');
  }
  users[idx] = {
    ...users[idx],
    password: newPassword,
    resetCode: undefined,
    resetToken: undefined,
    resetExpiresAt: undefined,
    mustChangePassword: false,
    passwordChangedAt: new Date().toISOString(),
  };
  local.save(users);
  return { success: true, message: 'Password has been successfully reset! You can now sign in.' };
}

/** Admin awards a badge (e.g. Best in Pubmat for one event). */
export async function awardBadge(
  personId: string,
  award: { badge: string; eventId?: string; note?: string },
  actorId: string,
): Promise<User> {
  if (await isRemoteAvailable(API)) {
    return apiJson<User>(`${API}?action=award`, {
      method: 'POST',
      body: JSON.stringify({ actorId, id: personId, ...award }),
    });
  }
  const users = loadLocalUsers();
  if (users.find((u) => u.personId === actorId)?.role !== 'admin') throw new Error('Only an admin can award badges.');
  const idx = users.findIndex((u) => u.personId === personId);
  if (idx === -1) throw new Error('User not found');
  const awards = users[idx].awards ?? [];
  if (award.eventId && awards.some((a) => a.badge === award.badge && a.eventId === award.eventId)) {
    throw new Error('They already have this badge for that event.');
  }
  users[idx] = {
    ...users[idx],
    awards: [
      ...awards,
      {
        id: generateId('awd'),
        badge: award.badge,
        eventId: award.eventId || undefined,
        note: award.note?.trim() || undefined,
        awardedBy: actorId,
        awardedAt: new Date().toISOString(),
      },
    ],
  };
  local.save(users);
  return delay(strip(users[idx]));
}

/** Admin takes an awarded badge back. */
export async function removeAward(personId: string, awardId: string, actorId: string): Promise<User> {
  if (await isRemoteAvailable(API)) {
    return apiJson<User>(`${API}?action=unaward`, {
      method: 'POST',
      body: JSON.stringify({ actorId, id: personId, awardId }),
    });
  }
  const users = loadLocalUsers();
  if (users.find((u) => u.personId === actorId)?.role !== 'admin') throw new Error('Only an admin can award badges.');
  const idx = users.findIndex((u) => u.personId === personId);
  if (idx === -1) throw new Error('User not found');
  users[idx] = { ...users[idx], awards: (users[idx].awards ?? []).filter((a) => a.id !== awardId) };
  local.save(users);
  return delay(strip(users[idx]));
}

/** All accounts (any status), without passwords. */
export async function getUsers(): Promise<User[]> {
  if (await isRemoteAvailable(API)) {
    return apiJson<User[]>(API);
  }
  return delay(loadLocalUsers().map(strip));
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
  const found = loadLocalUsers().find((u) => u.personId === personId);
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
  const users = loadLocalUsers();
  const idx = users.findIndex((u) => u.personId === personId);
  if (idx === -1) throw new Error('User not found');
  const actor = users.find((u) => u.personId === actorId);
  const adminOnly = ['role', 'status', 'requestedRole', 'officerHistory', 'rejectionReason', 'partnerOrg'].some((k) => k in changes);
  if (adminOnly && actor?.role !== 'admin') throw new Error('Only an admin can change roles or approve accounts.');
  if (!adminOnly && actorId !== personId && actor?.role !== 'admin') {
    throw new Error('You can only edit your own profile.');
  }
  const stamped =
    changes.status === 'approved' && users[idx].status !== 'approved'
      ? { approvedAt: new Date().toISOString(), approvedBy: actorId }
      : {};
  const next = { ...users[idx], ...changes, ...stamped };
  // Keep the display name in step with name edits
  if ('firstName' in changes || 'lastName' in changes || 'middleInitial' in changes) {
    const mi = next.middleInitial ? `${next.middleInitial.replace(/\./g, '')}.` : '';
    next.name = [next.firstName?.trim(), mi, next.lastName?.trim()].filter(Boolean).join(' ');
  }
  if (next.role !== 'attendee') next.partnerOrg = null;
  users[idx] = next;
  local.save(users);
  return delay(strip(users[idx]));
}

/** Update your own profile (name, school details, photo, bio, socials, personal email). */
export function updateProfile(personId: string, changes: ProfileChanges): Promise<User> {
  return updateUser(personId, changes, personId);
}

export type ConnectAction = 'connect' | 'connect-respond' | 'connect-cancel' | 'disconnect';
export interface ConnectResult {
  status: 'connected' | 'requested' | 'declined' | 'cancelled' | 'removed';
  me: User;
  other: User;
}

/**
 * AWS SBG-APC connections. `connect` sends a request (or accepts theirs if
 * they already asked); the other person approves or declines it.
 */
export async function connectionAction(
  action: ConnectAction,
  otherId: string,
  actorId: string,
  accept?: boolean,
): Promise<ConnectResult> {
  if (await isRemoteAvailable(API)) {
    return apiJson<ConnectResult>(`${API}?action=${action}`, {
      method: 'POST',
      body: JSON.stringify({ actorId, id: otherId, accept }),
    });
  }
  const users = loadLocalUsers();
  const me = users.find((u) => u.personId === actorId);
  const other = users.find((u) => u.personId === otherId);
  if (!me || !other || me === other) throw new Error('That account was not found.');
  const without = (a: string[] | undefined, x: string) => (a ?? []).filter((v) => v !== x);
  const withId = (a: string[] | undefined, x: string) => ((a ?? []).includes(x) ? a ?? [] : [...(a ?? []), x]);
  let status: ConnectResult['status'];
  const link = () => {
    me.connections = withId(me.connections, otherId);
    other.connections = withId(other.connections, actorId);
  };
  if (action === 'connect') {
    if ((me.connectionRequests ?? []).includes(otherId)) {
      link();
      me.connectionRequests = without(me.connectionRequests, otherId);
      other.sentConnectionRequests = without(other.sentConnectionRequests, actorId);
      status = 'connected';
    } else if ((me.connections ?? []).includes(otherId)) {
      status = 'connected';
    } else {
      other.connectionRequests = withId(other.connectionRequests, actorId);
      me.sentConnectionRequests = withId(me.sentConnectionRequests, otherId);
      status = 'requested';
    }
  } else if (action === 'connect-respond') {
    if (!(me.connectionRequests ?? []).includes(otherId)) throw new Error('That connection request is no longer waiting.');
    me.connectionRequests = without(me.connectionRequests, otherId);
    other.sentConnectionRequests = without(other.sentConnectionRequests, actorId);
    if (accept) link();
    status = accept ? 'connected' : 'declined';
  } else if (action === 'connect-cancel') {
    me.sentConnectionRequests = without(me.sentConnectionRequests, otherId);
    other.connectionRequests = without(other.connectionRequests, actorId);
    status = 'cancelled';
  } else {
    me.connections = without(me.connections, otherId);
    other.connections = without(other.connections, actorId);
    status = 'removed';
  }
  local.save(users);
  return delay({ status, me: strip(me), other: strip(other) });
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

/**
 * Decline a pending account, with an optional reason (e.g. "Missing name").
 * The person can sign up again with the same email.
 */
export function rejectUser(personId: string, actorId: string, reason?: string): Promise<User> {
  return updateUser(
    personId,
    { status: 'rejected', requestedRole: null, rejectionReason: reason?.trim() || null },
    actorId,
  );
}

/**
 * Archive an officer at the end of a school year: they become an alumni
 * attendee (can still sign in and join events) and their term is kept in
 * `officerHistory`.
 */
export async function archiveOfficer(personId: string, schoolYear: string, actorId: string): Promise<User> {
  const user = (await getUsers()).find((u) => u.personId === personId);
  if (!user) throw new Error('User not found');
  const term = {
    schoolYear,
    officerPosition: user.officerPosition ?? null,
    committee: user.committee ?? null,
    archivedAt: new Date().toISOString(),
  };
  return updateUser(
    personId,
    {
      role: 'attendee',
      officerPosition: null,
      committee: null,
      officerHistory: [...(user.officerHistory || []), term],
    },
    actorId,
  );
}

/** Permanently delete an account (admin). Their past stamps stay, shown as "Unknown". */
export async function deleteUser(personId: string, actorId: string): Promise<void> {
  if (personId === actorId) throw new Error("You can't delete your own account.");
  if (await isRemoteAvailable(API)) {
    await apiJson(`${API}?id=${encodeURIComponent(personId)}&actorId=${encodeURIComponent(actorId)}`, {
      method: 'DELETE',
    });
    return;
  }
  const users = loadLocalUsers();
  if (users.find((u) => u.personId === actorId)?.role !== 'admin') {
    throw new Error('Only an admin can delete accounts.');
  }
  local.save(users.filter((u) => u.personId !== personId));
  await delay(null);
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
  const pwError = passwordError(newPassword);
  if (pwError) throw new Error(pwError);
  if (newPassword === currentPassword) throw new Error('Your new password must be different from the current one.');
  if (await isRemoteAvailable(API)) {
    await apiJson(`${API}?action=password`, {
      method: 'POST',
      body: JSON.stringify({ id: personId, currentPassword, newPassword }),
    });
    return;
  }
  const users = loadLocalUsers();
  const idx = users.findIndex((u) => u.personId === personId);
  if (idx === -1 || users[idx].password !== currentPassword) {
    throw new Error('Your current password is incorrect.');
  }
  users[idx] = { ...users[idx], password: newPassword, mustChangePassword: false };
  local.save(users);
  await delay(null);
}

/** Reset local accounts (tests / dev only). */
export function __resetUsers(): void {
  local.reset();
}
