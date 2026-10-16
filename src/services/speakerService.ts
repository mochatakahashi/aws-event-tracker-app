import type {
  Speaker,
  NewSpeakerInput,
  UpdateSpeakerInput,
  LinkedInProfile,
} from '../types/speaker';
import { seedSpeakers } from './seedData';
import { apiJson, delay, generateId, isRemoteAvailable, localCollection } from './apiClient';

/**
 * Speaker directory. Stored in DynamoDB through `/api/speakers` when deployed
 * (merged over the built-in seed speakers), and in localStorage otherwise, so
 * speakers and their photos added in the Event Builder are kept.
 */

const API = '/api/speakers';

const local = localCollection<Speaker>('aws-event-tracker.speakers.v1', () =>
  seedSpeakers.map((s) => ({ ...s })),
);

async function loadAll(): Promise<Speaker[]> {
  if (await isRemoteAvailable(API)) {
    const saved = await apiJson<Speaker[]>(API);
    const byId = new Map<string, Speaker>(seedSpeakers.map((s) => [s.id, { ...s }]));
    for (const sp of saved) byId.set(sp.id, sp);
    return [...byId.values()];
  }
  return delay(local.load());
}

/** All speakers, alphabetized by name. */
export async function getSpeakers(): Promise<Speaker[]> {
  return (await loadAll()).sort((a, b) => a.name.localeCompare(b.name));
}

/** A single speaker by id, or null. */
export async function getSpeaker(id: string): Promise<Speaker | null> {
  return (await loadAll()).find((s) => s.id === id) ?? null;
}

/** Resolve several speakers by id (used to show an event's lineup), keeping the given order. */
export async function getSpeakersByIds(ids: string[]): Promise<Speaker[]> {
  const all = await loadAll();
  return ids.map((id) => all.find((s) => s.id === id)).filter((s): s is Speaker => Boolean(s));
}

/** Create a speaker in the directory. */
export async function createSpeaker(input: NewSpeakerInput): Promise<Speaker> {
  if (await isRemoteAvailable(API)) {
    return apiJson<Speaker>(API, { method: 'POST', body: JSON.stringify(input) });
  }
  const created: Speaker = { ...input, id: generateId('spk') };
  local.save([...local.load(), created]);
  return delay({ ...created });
}

/** Update a speaker; rejects if unknown. */
export async function updateSpeaker(id: string, changes: UpdateSpeakerInput): Promise<Speaker> {
  if (await isRemoteAvailable(API)) {
    const current = (await loadAll()).find((s) => s.id === id);
    return apiJson<Speaker>(`${API}?id=${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ ...(current || {}), ...changes }),
    });
  }
  const speakers = local.load();
  const index = speakers.findIndex((s) => s.id === id);
  if (index === -1) throw new Error(`Speaker not found: ${id}`);
  speakers[index] = { ...speakers[index], ...changes, id };
  local.save(speakers);
  return delay({ ...speakers[index] });
}

/**
 * MOCK LinkedIn lookup.
 *
 * Real LinkedIn profile data is not publicly retrievable from a URL without an
 * approved partner integration, so this simulates the shape of what such an
 * integration would return: it derives a plausible name from the URL slug and
 * fills placeholder professional details. Swap this out for a real integration
 * (or a backend proxy) later — the signature can stay the same.
 */
export async function lookupLinkedInProfile(
  url: string,
): Promise<LinkedInProfile> {
  const trimmed = url.trim();
  if (!/linkedin\.com\/in\//i.test(trimmed)) {
    return Promise.reject(
      new Error('Enter a valid LinkedIn profile URL (linkedin.com/in/…).'),
    );
  }

  // Derive a display name from the /in/<slug> portion of the URL.
  const match = trimmed.match(/linkedin\.com\/in\/([^/?#]+)/i);
  const slug = match?.[1] ?? 'new-speaker';
  const name = slug
    .split(/[-_.]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .replace(/\d+/g, '')
    .trim();

  const profile: LinkedInProfile = {
    name: name || 'New Speaker',
    headline: 'Speaker',
    company: '',
    bio: `Profile imported from LinkedIn (${trimmed}). Edit to add details.`,
    avatarUrl: '',
  };
  // Simulate a slightly longer network round-trip than a local read.
  return new Promise((resolve) => setTimeout(() => resolve(profile), 400));
}

/** Reset the directory to seed data (tests / dev only). */
export function __resetSpeakers(): void {
  local.reset();
}
