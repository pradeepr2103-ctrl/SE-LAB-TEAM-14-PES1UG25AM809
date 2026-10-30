// Perceived Stress Scale (PSS-10), Cohen et al. 1983. Answers 0 (never) .. 4 (very often).
// Items 4, 5, 7, 8 are positively worded and reverse-scored. Total 0-40.
const QUESTIONS = [
  'In the last month, how often have you been upset because of something that happened unexpectedly?',
  'How often have you felt unable to control the important things in your life?',
  'How often have you felt nervous and stressed?',
  'How often have you felt confident about your ability to handle your personal problems?',
  'How often have you felt that things were going your way?',
  'How often have you found that you could not cope with all the things you had to do?',
  'How often have you been able to control irritations in your life?',
  'How often have you felt that you were on top of things?',
  'How often have you been angered because of things that were outside of your control?',
  'How often have you felt difficulties were piling up so high that you could not overcome them?',
];
const REVERSED = new Set([3, 4, 6, 7]); // zero-based

class ValidationError extends Error {}

function categorize(score) {
  if (score <= 13) return 'low';
  if (score <= 26) return 'moderate';
  return 'high';
}

function scoreAssessment(answers) {
  if (!Array.isArray(answers) || answers.length !== QUESTIONS.length) {
    throw new ValidationError(`answers must be an array of ${QUESTIONS.length} values`);
  }
  if (!answers.every((a) => Number.isInteger(a) && a >= 0 && a <= 4)) {
    throw new ValidationError('each answer must be an integer from 0 to 4');
  }
  const score = answers.reduce((sum, a, i) => sum + (REVERSED.has(i) ? 4 - a : a), 0);
  return { score, category: categorize(score) };
}

module.exports = { QUESTIONS, scoreAssessment, categorize, ValidationError };
