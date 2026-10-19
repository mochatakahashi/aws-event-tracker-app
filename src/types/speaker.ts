import type { SocialLinks } from './auth';

/**
 * A speaker in the shared directory. Speakers can be assigned to any number of
 * events. Profile fields may be filled manually or via the (mock) LinkedIn
 * lookup.
 */
export interface Speaker {
  id: string;
  name: string;
  /** Professional headline / job title, e.g. "Principal Engineer". */
  headline: string;
  company: string;
  bio: string;
  /** LinkedIn profile URL (optional). */
  linkedInUrl?: string;
  /** Avatar image URL (optional). */
  avatarUrl?: string;
  /** Linked app account (an officer or member who speaks). Their name, photo and links stay up to date. */
  personId?: string;
  /** Outside speaker's email: when they create an account with it, the speaker links to it automatically. */
  email?: string;
  /** Social links typed in for an outside speaker. */
  socials?: SocialLinks;
  /** Filled when shown: the linked account's live details. */
  profile?: SpeakerProfile;
}

/** Live details from the speaker's account (not stored on the speaker). */
export interface SpeakerProfile {
  personId: string;
  name: string;
  avatarUrl?: string;
  socials?: SocialLinks;
  role?: string;
  title?: string;
}

export type NewSpeakerInput = Omit<Speaker, 'id' | 'profile'>;
export type UpdateSpeakerInput = Partial<Omit<Speaker, 'id' | 'profile'>>;

/**
 * The subset of a speaker profile that a LinkedIn lookup can (mock-)resolve
 * from a profile URL.
 */
export type LinkedInProfile = Pick<
  Speaker,
  'name' | 'headline' | 'company' | 'bio' | 'avatarUrl'
>;
