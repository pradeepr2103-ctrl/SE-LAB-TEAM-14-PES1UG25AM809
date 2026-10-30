const test = require('node:test');
const assert = require('node:assert/strict');
const { scoreAssessment, categorize } = require('../src/scoring');

test('all zeros: reverse-scored items add 4 each = 16 (moderate)', () => {
  assert.deepEqual(scoreAssessment(Array(10).fill(0)), { score: 16, category: 'moderate' });
});
test('all fours = 24 (moderate)', () => {
  assert.equal(scoreAssessment(Array(10).fill(4)).score, 24);
});
test('max stress = 40 (high)', () => {
  const a = [4, 4, 4, 0, 0, 4, 0, 0, 4, 4];
  assert.deepEqual(scoreAssessment(a), { score: 40, category: 'high' });
});
test('min stress = 0 (low)', () => {
  const a = [0, 0, 0, 4, 4, 0, 4, 4, 0, 0];
  assert.deepEqual(scoreAssessment(a), { score: 0, category: 'low' });
});
test('category boundaries', () => {
  assert.equal(categorize(13), 'low');
  assert.equal(categorize(14), 'moderate');
  assert.equal(categorize(26), 'moderate');
  assert.equal(categorize(27), 'high');
});
test('rejects wrong length and out-of-range values', () => {
  assert.throws(() => scoreAssessment([1, 2, 3]));
  assert.throws(() => scoreAssessment(Array(10).fill(5)));
  assert.throws(() => scoreAssessment(Array(10).fill(1.5)));
  assert.throws(() => scoreAssessment(null));
});
