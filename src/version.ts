/** App version (keep in step with package.json and CHANGELOG.md). */
export const APP_VERSION = '0.6.32';

/** Short "What's new" for the About window (latest first). */
export const WHATS_NEW: { version: string; items: string[] }[] = [
  {
    version: '0.6.32',
    items: [
      'Student IDs use the format 2026-140242.',
      'Admins can edit account details or ask someone to fix their profile.',
      'Tasks can be edited after assigning (move the deadline, add details).',
      'Undo a mistaken check-in at the Event Desk.',
      'Social links and adviser documents are checked for safety.',
      'The show password button no longer disappears.',
    ],
  },
  { version: '0.6.31', items: ['Food stubs: one lunch and one snack per person, given by the food team.'] },
  { version: '0.6.30', items: ['Whole org or event tasks, a table view and an Excel summary.'] },
  { version: '0.6.29', items: ['Directors, Assistant Directors, VPs and the President manage their committees’ tasks.'] },
];
