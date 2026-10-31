const test = require("node:test");
const assert = require("node:assert/strict");
const { scoreAssessment } = require("../src/scoring");

test("all-middle answers score 20 (moderate)", () => {
  assert.deepEqual(scoreAssessment(Array(10).fill(2)), { score: 20, category: "moderate" });
});
