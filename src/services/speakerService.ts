import type {
  Speaker,
  NewSpeakerInput,
  UpdateSpeakerInput,
  LinkedInProfile,
} from '../types/speaker';
import { seedSpeakers } from './seedData';

/**
 * In-memory speaker directory. Async to mirror a real API.
 */

let speakers: Speaker[] = seedSpeakers.map((s) => ({ ...s }));

const LATENCY = 150;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY));
}

function generateId(): string {
  return `spk-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/** All speakers, alphabetized by name. */
export async function getSpeakers(): Promise<Speaker[]> {
  const sorted = [...speakers].sort((a, b) => a.name.localeCompare(b.name));
  return delay(sorted.map((s) => ({ ...s })));
}

/** A single speaker by id, or null. */
export async function getSpeaker(id: string): Promise<Speaker | null> {
  const found = speakers.find((s) => s.id === id);
  return delay(found ? { ...found } : null);
}

/** Resolve several speakers by id (used to show an event's lineup). */
export async function getSpeakersByIds(ids: string[]): Promise<Speaker[]> {
  const set = new Set(ids);
  return delay(speakers.filter((s) => set.has(s.id)).map((s) => ({ ...s })));
}

/** Create a speaker in the directory. */
export async function createSpeaker(input: NewSpeakerInput): Promise<Speaker> {
  const created: Speaker = { ...input, id: generateId() };
  speakers = [...speakers, created];
  return delay({ ...created });
}

/** Update a speaker; rejects if unknown. */
export async function updateSpeaker(
  id: string,
  changes: UpdateSpeakerInput,
): Promise<Speaker> {
  const index = speakers.findIndex((s) => s.id === id);
  if (index === -1) return Promise.reject(new Error(`Speaker not found: ${id}`));
  const updated: Speaker = { ...speakers[index], ...changes, id };
  speakers[index] = updated;
  return delay({ ...updated });
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
  speakers = seedSpeakers.map((s) => ({ ...s }));
}
