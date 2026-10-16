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
  password: 'secret1',
  studentId: '2024-100200',
  officerPosition: 'director',
  committee: 'marketing',
};

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
    __resetUsers();
  });

  it('logs in with a username or an email', async () => {
    expect((await login({ username: 'admin', password: 'admin123' })).role).toBe('admin');
    expect((await login({ username: 'SOFIA@apc.edu.ph', password: 'sofia123' })).username).toBe('sofia');
  });

  it('creates new accounts as pending, and blocks login until approved', async () => {
    const created = await signUp(officerSignUp);
    expect(created.status).toBe('pending');
    expect(created.name).toBe('Maria C. Santos');
    expect(created.requestedRole).toBe('officer');
    expect(created.role).toBe('attendee');

    await expect(login({ username: officerSignUp.email, password: 'secret1' })).rejects.toThrow(/waiting for admin approval/i);

    const approved = await approveUser(created.personId, 'per-1');
    expect(approved.status).toBe('approved');
    expect(approved.role).toBe('officer');
    expect(approved.approvedBy).toBe('per-1');

    const loggedIn = await login({ username: officerSignUp.email, password: 'secret1' });
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
      password: 'secret1',
      organization: 'Mapúa University',
    });
    expect(outsider.memberType).toBe('outside');
    expect(outsider.organization).toBe('Mapúa University');
    expect(outsider.studentId).toBeUndefined();
  });

  it('asks outsiders for an organization and APC students for a student ID', async () => {
    await expect(
      signUp({ accountType: 'outside', firstName: 'A', lastName: 'B', email: 'a@b.com', password: 'secret1' }),
    ).rejects.toThrow(/organization/i);
    await expect(
      signUp({ accountType: 'apc-student', firstName: 'A', lastName: 'B', email: 'a@apc.edu.ph', password: 'secret1' }),
    ).rejects.toThrow(/student ID/i);
  });

  it('rejects duplicate emails, but lets a declined person sign up again', async () => {
    const first = await signUp(officerSignUp);
    await expect(signUp(officerSignUp)).rejects.toThrow(/already exists/i);
    await rejectUser(first.personId, 'per-1');
    await expect(login({ username: officerSignUp.email, password: 'secret1' })).rejects.toThrow(/declined/i);
    const again = await signUp(officerSignUp);
    expect(again.status).toBe('pending');
    expect((await getUsers()).filter((u) => u.email === officerSignUp.email)).toHaveLength(1);
  });

  it('only lets admins change roles', async () => {
    await expect(updateUser('per-3', { role: 'admin' }, 'per-3')).rejects.toThrow(/only an admin/i);
    expect((await updateUser('per-3', { role: 'officer' }, 'per-1')).role).toBe('officer');
  });

  it('saves profile changes so other logins see them', async () => {
    await updateProfile('per-3', { avatarUrl: 'https://example.com/a.jpg', bio: 'Hi' });
    const sofia = (await getUsers()).find((u) => u.personId === 'per-3');
    expect(sofia?.avatarUrl).toBe('https://example.com/a.jpg');
    expect(sofia?.bio).toBe('Hi');
  });

  it('changes a password', async () => {
    await expect(changePassword('per-3', 'wrong', 'newpass1')).rejects.toThrow(/incorrect/i);
    await changePassword('per-3', 'sofia123', 'newpass1');
    await expect(login({ username: 'sofia', password: 'sofia123' })).rejects.toThrow();
    expect((await login({ username: 'sofia', password: 'newpass1' })).personId).toBe('per-3');
  });
});
