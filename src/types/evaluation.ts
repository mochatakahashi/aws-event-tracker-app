/** One question on an event's evaluation form. */
export type EvalQuestionType = 'rating' | 'yesno' | 'choice' | 'text';

export interface EvalQuestion {
  id: string;
  type: EvalQuestionType;
  label: string;
  required: boolean;
  /** Choices for type 'choice'. */
  options?: string[];
}

/** The evaluation form of an event (set by an admin; the standard set when not changed). */
export interface EventEvaluation {
  /** false: no evaluation for this event (the certificate doesn't need one). */
  enabled?: boolean;
  questions: EvalQuestion[];
}

/** Answers: rating → 1..5, yesno → 'yes' | 'no', choice → the option, text → the text. */
export type EvalAnswers = Record<string, number | string>;

/** One attendee's submitted evaluation. */
export interface EvaluationResponse {
  id: string;
  eventId: string;
  personId: string;
  personName?: string;
  registrationId: string;
  answers: EvalAnswers;
  submittedAt: string;
}
