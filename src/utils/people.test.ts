import { describe, it, expect } from 'vitest';
import { compareOfficers, formatFullName, isApcEmail, officerTitle } from './people';
import type { Committee, OfficerPosition } from '../types/auth';

describe('people utils', () => {
  it('formats "First M. Last"', () => {
    expect(formatFullName('Juan', 'd.', 'Dela Cruz')).toBe('Juan D. Dela Cruz');
    expect(formatFullName('Juan', '', 'Dela Cruz')).toBe('Juan Dela Cruz');
  });

  it('recognizes APC emails', () => {
    expect(isApcEmail('a@apc.edu.ph')).toBe(true);
    expect(isApcEmail('a@student.apc.edu.ph')).toBe(true);
    expect(isApcEmail('a@gmail.com')).toBe(false);
  });

  it('sorts officers by the hierarchy', () => {
    const o = (name: string, officerPosition?: OfficerPosition, committee?: Committee) => ({ name, officerPosition, committee });
    const sorted = [
      o('Associate Ops', 'associate', 'operations'),
      o('No position'),
      o('Director Relations', 'director', 'relations'),
      o('VP External', 'vp-external'),
      o('AD Secretariat', 'assistant-director', 'secretariat'),
      o('President', 'president'),
      o('Director Secretariat', 'director', 'secretariat'),
      o('VP Internal', 'vp-internal'),
    ]
      .sort(compareOfficers)
      .map((x) => x.name);
    expect(sorted).toEqual([
      'President',
      'VP Internal',
      'VP External',
      'Director Secretariat',
      'Director Relations',
      'AD Secretariat',
      'Associate Ops',
      'No position',
    ]);
  });

  it('builds officer titles', () => {
    expect(officerTitle({ officerPosition: 'director', committee: 'technicals' })).toBe('Director - Technicals');
    expect(officerTitle({ officerPosition: 'vp-internal' })).toBe('VP Internal');
    expect(officerTitle({})).toBe('Officer');
  });
});
