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
}

export type NewSpeakerInput = Omit<Speaker, 'id'>;
export type UpdateSpeakerInput = Partial<Omit<Speaker, 'id'>>;

/**
 * The subset of a speaker profile that a LinkedIn lookup can (mock-)resolve
 * from a profile URL.
 */
export type LinkedInProfile = Pick<
  Speaker,
  'name' | 'headline' | 'company' | 'bio' | 'avatarUrl'
>;
