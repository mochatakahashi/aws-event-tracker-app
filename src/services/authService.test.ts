import { describe, it, expect, beforeEach } from 'vitest';
import {
  login,
  signUp,
  getUsers,
  approveUser,
  rejectUser,
  updateUser,
  updateProfile,
  changePassword,
  requestPasswordCode,
  resetPasswordWithCode,
  createAccount,
  resetPassword,
  archiveOfficer,
  deleteUser,
  __resetUsers,
} from './authService';
import type { SignUpData } from '../types/auth';

const officerSignUp: SignUpData = {
  accountType: 'officer',
  firstName: 'Maria',
  middleInitial: 'c',
  lastName: 'Santos',
  email: 'maria.santos@student.apc.edu.ph',
  personalEmail: 'maria@gmail.com',
  password: 'Secret1!',
  studentId: '2024-100200',
  officerPosition: 'director',
  committee: 'marketing',
};

const ADMIN = { username: 'awsapc.admin', password: 'test-admin-password' };

/** Create and approve an APC student; returns their person id. */
async function approvedStudent(email = 'sofia@student.apc.edu.ph') {
  const u = await signUp({
    accountType: 'apc-student',
    firstName: 'Sofia',
    lastName: 'Rossi',
    email,
    password: 'Sofia123!',
    studentId: '2024-100042',
  });
  await approveUser(u.personId, 'per-1');
  return u.personId;
}

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
    __resetUsers();
  });

  it('has only the awsapc.admin account to start with', async () => {
    const users = await getUsers();
    expect(users.map((u) => u.username)).toEqual(['awsapc.admin']);
    expect((await login(ADMIN)).role).toBe('admin');
    await expect(login({ username: 'admin', password: 'admin123' })).rejects.toThrow(/invalid/i);
  });

  it('logs in with an email (any case)', async () => {
    await approvedStudent();
    expect((await login({ username: 'SOFIA@student.apc.edu.ph', password: 'Sofia123!' })).name).toBe('Sofia Rossi');
  });

  it('creates new accounts as pending, and blocks login until approved', async () => {
    const created = await signUp(officerSignUp);
    expect(created.status).toBe('pending');
    expect(created.name).toBe('Maria C. Santos');
    expect(created.requestedRole).toBe('officer');
    expect(created.role).toBe('attendee');

    await expect(login({ username: officerSignUp.email, password: 'Secret1!' })).rejects.toThrow(/waiting for admin approval/i);

    const approved = await approveUser(created.personId, 'per-1');
    expect(approved.status).toBe('approved');
    expect(approved.role).toBe('officer');
    expect(approved.approvedBy).toBe('per-1');

    const loggedIn = await login({ username: officerSignUp.email, password: 'Secret1!' });
    expect(loggedIn.officerPosition).toBe('director');
    expect(loggedIn.committee).toBe('marketing');
  });

  it('requires an APC email for APC students and officers, but not for outsiders', async () => {
    await expect(signUp({ ...officerSignUp, email: 'maria@gmail.com' })).rejects.toThrow(/APC email/);
    const outsider = await signUp({
      accountType: 'outside',
      firstName: 'Ben',
      lastName: 'Cruz',
      email: 'ben@gmail.com',
      password: 'Secret1!',
      organization: 'Mapúa University',
    });
    expect(outsider.memberType).toBe('outside');
    expect(outsider.organization).toBe('Mapúa University');
    expect(outsider.studentId).toBeUndefined();
  });

  it('asks outsiders for an organization and APC students for a student ID', async () => {
    await expect(
      signUp({ accountType: 'outside', firstName: 'A', lastName: 'B', email: 'a@b.com', password: 'Secret1!' }),
    ).rejects.toThrow(/organization/i);
    await expect(
      signUp({ accountType: 'apc-student', firstName: 'A', lastName: 'B', email: 'a@apc.edu.ph', password: 'Secret1!' }),
    ).rejects.toThrow(/student ID/i);
  });

  it('rejects duplicate emails, but lets a declined person sign up again', async () => {
    const first = await signUp(officerSignUp);
    await expect(signUp(officerSignUp)).rejects.toThrow(/already exists/i);
    await rejectUser(first.personId, 'per-1', 'Wrong email address');
    await expect(login({ username: officerSignUp.email, password: 'Secret1!' })).rejects.toThrow(
      /declined: Wrong email address/i,
    );
    const again = await signUp(officerSignUp);
    expect(again.status).toBe('pending');
    expect((await getUsers()).filter((u) => u.email === officerSignUp.email)).toHaveLength(1);
  });

  it('only lets admins change roles', async () => {
    const id = await approvedStudent();
    await expect(updateUser(id, { role: 'admin' }, id)).rejects.toThrow(/only an admin/i);
    expect((await updateUser(id, { role: 'officer' }, 'per-1')).role).toBe('officer');
  });

  it('saves profile changes so other logins see them', async () => {
    const id = await approvedStudent();
    await updateProfile(id, { avatarUrl: 'https://example.com/a.jpg', bio: 'Hi' });
    const sofia = (await getUsers()).find((u) => u.personId === id);
    expect(sofia?.avatarUrl).toBe('https://example.com/a.jpg');
    expect(sofia?.bio).toBe('Hi');
  });

  it('changes a password (including the admin password)', async () => {
    // A code is needed: emailed (shown in local mode), typed in
    await expect(changePassword('per-1', ADMIN.password, 'A-new-admin-pass1', '123456')).rejects.toThrow(/code/i);
    const sent = await requestPasswordCode({ personId: 'per-1' });
    expect(sent.localCode).toMatch(/^\d{6}$/);
    await expect(changePassword('per-1', 'wrong', 'Newpass1!', sent.localCode!)).rejects.toThrow(/incorrect/i);
    const wrong = sent.localCode === '000000' ? '111111' : '000000';
    await expect(changePassword('per-1', ADMIN.password, 'A-new-admin-pass1', wrong)).rejects.toThrow(/not right/i);
    await changePassword('per-1', ADMIN.password, 'A-new-admin-pass1', sent.localCode!);
    await expect(login(ADMIN)).rejects.toThrow();
    expect((await login({ username: 'awsapc.admin', password: 'A-new-admin-pass1' })).personId).toBe('per-1');
  });

  it('archives an officer as an alumni attendee and keeps the term', async () => {
    const created = await signUp(officerSignUp);
    await approveUser(created.personId, 'per-1');
    const archived = await archiveOfficer(created.personId, '2025–2026', 'per-1');
    expect(archived.role).toBe('attendee');
    expect(archived.officerPosition).toBeNull();
    expect(archived.officerHistory).toEqual([
      expect.objectContaining({ schoolYear: '2025–2026', officerPosition: 'director', committee: 'marketing' }),
    ]);
    // still able to sign in
    expect((await login({ username: officerSignUp.email, password: 'Secret1!' })).role).toBe('attendee');
  });

  it('lets only an admin delete accounts', async () => {
    const id = await approvedStudent();
    await expect(deleteUser('per-1', id)).rejects.toThrow(/only an admin/i);
    await expect(deleteUser('per-1', 'per-1')).rejects.toThrow(/own account/i);
    await deleteUser(id, 'per-1');
    expect((await getUsers()).some((u) => u.personId === id)).toBe(false);
  });
});

describe('account security', () => {
  it('enforces the password rules on sign-up', async () => {
    const base = { accountType: 'outside' as const, firstName: 'P', lastName: 'Q', email: 'pq@gmail.com', organization: 'X' };
    await expect(signUp({ ...base, password: 'secret1' })).rejects.toThrow(/capital letter/);
    await expect(signUp({ ...base, password: 'SECRET1!' })).rejects.toThrow(/small letter/);
    await expect(signUp({ ...base, password: 'Secret!' })).rejects.toThrow(/number/);
    await expect(signUp({ ...base, password: 'Secret1' })).rejects.toThrow(/special symbol/);
    await expect(signUp({ ...base, password: 'S1!a' })).rejects.toThrow(/at least 6/);
    expect((await signUp({ ...base, password: 'Secret1!' })).signupType).toBe('outside');
  });

  it('lets an admin create an account with a temporary password that must be changed', async () => {
    const admin = await login(ADMIN);
    const created = await createAccount(
      {
        accountType: 'officer',
        role: 'officer',
        firstName: 'Mika',
        lastName: 'Reyes',
        email: 'mika@student.apc.edu.ph',
        studentId: '2024-100009',
        officerPosition: 'associate',
        committee: 'marketing',
        subcommittee: 'creatives',
        password: 'Temp123!',
      },
      admin.personId,
    );
    expect(created.status).toBe('approved');
    expect(created.role).toBe('officer');
    expect(created.subcommittee).toBe('creatives');
    const first = await login({ username: 'mika@student.apc.edu.ph', password: 'Temp123!' });
    expect(first.mustChangePassword).toBe(true);
    await expect(changePassword(first.personId, 'Temp123!', 'Temp123!', '123456')).rejects.toThrow(/different/);
    const code = (await requestPasswordCode({ personId: first.personId })).localCode!;
    await changePassword(first.personId, 'Temp123!', 'MyOwn123!', code);
    // the code works once
    await expect(changePassword(first.personId, 'MyOwn123!', 'Again123!', code)).rejects.toThrow(/code/i);
    // forgot password: code by email, typed with a new password
    const forgot = (await requestPasswordCode({ login: 'mika@student.apc.edu.ph' })).localCode!;
    await resetPasswordWithCode('mika@student.apc.edu.ph', forgot, 'Forgot123!');
    expect((await login({ username: 'mika@student.apc.edu.ph', password: 'Forgot123!' })).personId).toBe(first.personId);
    await resetPasswordWithCode('mika@student.apc.edu.ph', (await requestPasswordCode({ login: 'mika@student.apc.edu.ph' })).localCode!, 'MyOwn123!');
    expect((await login({ username: 'mika@student.apc.edu.ph', password: 'MyOwn123!' })).mustChangePassword).toBe(false);
    // admin reset → must change again
    await resetPassword(first.personId, 'Reset123!', admin.personId);
    expect((await login({ username: 'mika@student.apc.edu.ph', password: 'Reset123!' })).mustChangePassword).toBe(true);
    await expect(resetPassword(first.personId, 'Reset123!', first.personId)).rejects.toThrow(/only an admin/i);
  });
});
