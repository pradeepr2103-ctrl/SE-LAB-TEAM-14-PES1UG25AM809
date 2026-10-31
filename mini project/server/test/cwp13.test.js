const test = require("node:test");
const assert = require("node:assert/strict");
const { openDb } = require("../src/db");
const { seed, PASSWORD } = require("../src/seed");
const { createApp } = require("../src/app");

let server, base;
test.before(async () => {
  const db = openDb(":memory:");
  seed(db);
  server = createApp(db).listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

const call = (path, { method = "GET", token, body } = {}) =>
  fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
const login = async (email) =>
  (await call("/api/auth/login", { method: "POST", body: { email, password: PASSWORD } })).json();

test("assessment history is newest first", async () => {
  const s = (await login("student@pes.edu")).token;
  await call("/api/assessments", { method: "POST", token: s, body: { answers: Array(10).fill(0) } });
  await call("/api/assessments", { method: "POST", token: s, body: { answers: Array(10).fill(4) } });
  const mine = await (await call("/api/assessments/mine", { token: s })).json();
  assert.ok(mine[0].id > mine[1].id);
});
