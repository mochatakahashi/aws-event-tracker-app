import type { EventFood } from '../types/event';
import { apiJson, isRemoteAvailable } from './apiClient';

/**
 * Food stubs: each person who gets food at an event can claim each meal once.
 * The food team (or an admin) gives it out by scanning the person's pass;
 * the server refuses a second claim. Needs the live API.
 */

const API = '/api/registrations';

export type FoodKind = 'attendee' | 'officer' | 'staff' | 'speaker';

export const FOOD_KIND_LABELS: Record<FoodKind, string> = {
  attendee: 'Attendee',
  officer: 'Officer',
  staff: 'Co-organizer staff',
  speaker: 'Speaker',
};

export interface MealClaim {
  id: string;
  eventId: string;
  personId: string;
  mealId: string;
  mealLabel: string;
  kind: FoodKind;
  claimedAt: string;
  givenBy: string;
}

export interface MyFood {
  food: EventFood;
  eligible: boolean;
  kind?: FoodKind;
  claims: MealClaim[];
}

export interface FoodPerson {
  personId: string;
  name: string;
  kind: FoodKind;
  label: string;
}

export interface FoodBoard {
  food: EventFood;
  people: FoodPerson[];
  claims: MealClaim[];
}

export interface GiveResult {
  claim: MealClaim;
  alreadyClaimed: boolean;
  name: string;
}

const NO_API = 'Food stubs need the live database. Try again when you are online.';

async function needApi() {
  if (!(await isRemoteAvailable(API))) throw new Error(NO_API);
}

/** One person's stubs (themselves, or the food team). */
export async function getMyFood(eventId: string, personId: string, actorId: string): Promise<MyFood> {
  await needApi();
  const q = new URLSearchParams({ action: 'meals', eventId, personId, actorId });
  return apiJson<MyFood>(`${API}?${q}`);
}

/** Food team: everyone who gets food and every claim. */
export async function getFoodBoard(eventId: string, actorId: string): Promise<FoodBoard> {
  await needApi();
  const q = new URLSearchParams({ action: 'meals', eventId, actorId });
  return apiJson<FoodBoard>(`${API}?${q}`);
}

export async function giveMeal(eventId: string, personId: string, mealId: string, actorId: string): Promise<GiveResult> {
  await needApi();
  return apiJson<GiveResult>(`${API}?action=meal`, { method: 'POST', body: JSON.stringify({ eventId, personId, mealId, actorId }) });
}

export async function undoMeal(eventId: string, personId: string, mealId: string, actorId: string): Promise<void> {
  await needApi();
  await apiJson(`${API}?action=meal-undo`, { method: 'POST', body: JSON.stringify({ eventId, personId, mealId, actorId }) });
}

/** "12:05 PM" in Manila time. */
export const mealTime = (iso: string) =>
  new Date(iso).toLocaleString('en-PH', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' });

/** "Oct 25, 12:00 PM" in Manila time. */
export const mealDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export const mealOpen = (m: { opensAt?: string }, now = Date.now()) => !m.opensAt || now >= new Date(m.opensAt).getTime();
