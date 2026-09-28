import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSpeakers,
  getSpeaker,
  getSpeakersByIds,
  createSpeaker,
  lookupLinkedInProfile,
  __resetSpeakers,
} from './speakerService';
import { seedSpeakers } from './seedData';

describe('speakerService', () => {
  beforeEach(() => {
    __resetSpeakers();
  });

  it('lists all speakers alphabetically', async () => {
    const result = await getSpeakers();
    expect(result).toHaveLength(seedSpeakers.length);
    const names = result.map((s) => s.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('gets a speaker by id and by ids', async () => {
    expect((await getSpeaker('spk-1'))?.name).toBe('Dr. Amara Chen');
    const lineup = await getSpeakersByIds(['spk-1', 'spk-3']);
    expect(lineup.map((s) => s.id).sort()).toEqual(['spk-1', 'spk-3']);
  });

  it('creates a speaker', async () => {
    const created = await createSpeaker({
      name: 'Test Speaker',
      headline: 'Engineer',
      company: 'Acme',
      bio: 'Bio',
    });
    expect(created.id).toBeTruthy();
    expect(await getSpeaker(created.id)).not.toBeNull();
  });

  it('mock-resolves a LinkedIn profile from a URL', async () => {
    const profile = await lookupLinkedInProfile(
      'https://www.linkedin.com/in/jane-doe',
    );
    expect(profile.name).toBe('Jane Doe');
    expect(profile.bio).toMatch(/linkedin/i);
  });

  it('rejects an invalid LinkedIn URL', async () => {
    await expect(lookupLinkedInProfile('https://example.com')).rejects.toThrow(
      /valid linkedin/i,
    );
  });
});
