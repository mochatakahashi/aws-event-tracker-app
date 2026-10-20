import type { EvalAnswers, EvalQuestion, EventEvaluation } from '../types/evaluation';

/** The evaluation opens this long before the event ends. */
export const EVAL_OPENS_BEFORE_END_MS = 30 * 60 * 1000;

/**
 * Events that ended before evaluations existed keep their certificates
 * without one (keep in sync with api/registrations.ts).
 */
export const EVAL_REQUIRED_FROM = '2026-10-20T00:00:00+08:00';

/** The standard questions every event starts with. The admin can edit, remove or add. */
export function standardQuestions(hasSpeakers = true): EvalQuestion[] {
  return [
    { id: 'q-overall', type: 'rating', label: 'How would you rate the event overall?', required: true },
    ...(hasSpeakers ? [{ id: 'q-speakers', type: 'rating' as const, label: 'How would you rate the speakers?', required: true }] : []),
    { id: 'q-organization', type: 'rating', label: 'How would you rate the venue and how the event was organized?', required: true },
    { id: 'q-learned', type: 'text', label: 'What did you learn from this event?', required: false },
    { id: 'q-improve', type: 'text', label: 'What can we improve?', required: false },
    { id: 'q-again', type: 'yesno', label: 'Would you join our next event?', required: true },
  ];
}

type EvalEvent = { startAt?: string; endAt?: string; speakerIds?: string[]; evaluation?: EventEvaluation | null };

/** The questions for this event (its own, or the standard set). */
export function evaluationQuestions(event: EvalEvent | null | undefined): EvalQuestion[] {
  const own = event?.evaluation?.questions;
  return own && own.length ? own : standardQuestions((event?.speakerIds?.length ?? 0) > 0);
}

/** Whether this event's certificate needs the evaluation answered. */
export function evaluationRequired(event: EvalEvent | null | undefined): boolean {
  if (!event || event.evaluation?.enabled === false) return false;
  const end = event.endAt || event.startAt;
  if (!end) return false;
  return new Date(end).getTime() >= new Date(EVAL_REQUIRED_FROM).getTime();
}

/** When the form opens: 30 minutes before the event ends. */
export function evaluationOpensAt(event: EvalEvent | null | undefined): number | null {
  const end = event?.endAt || event?.startAt;
  return end ? new Date(end).getTime() - EVAL_OPENS_BEFORE_END_MS : null;
}

export function evaluationOpen(event: EvalEvent | null | undefined, now = Date.now()): boolean {
  const at = evaluationOpensAt(event);
  return evaluationRequired(event) && at !== null && now >= at;
}

/** The first problem with the answers, or '' when they're complete. */
export function checkAnswers(questions: EvalQuestion[], answers: EvalAnswers): string {
  for (const q of questions) {
    const a = answers[q.id];
    const empty = a === undefined || a === null || (typeof a === 'string' && !a.trim());
    if (empty) {
      if (q.required) return `Please answer: ${q.label}`;
      continue;
    }
    if (q.type === 'rating' && !(typeof a === 'number' && a >= 1 && a <= 5)) return `Pick 1 to 5 for: ${q.label}`;
    if (q.type === 'yesno' && a !== 'yes' && a !== 'no') return `Pick yes or no for: ${q.label}`;
    if (q.type === 'choice' && !(q.options || []).includes(String(a))) return `Pick one of the choices for: ${q.label}`;
  }
  return '';
}

export const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
