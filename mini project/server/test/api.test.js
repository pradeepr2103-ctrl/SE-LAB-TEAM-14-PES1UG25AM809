const test = require('node:test');
const assert = require('node:assert/strict');
const { openDb } = require('../src/db');
const { seed, PASSWORD } = require('../src/seed');
const { createApp } = require('../src/app');

let server, base;
test.before(async () => {
  const db = openDb(':memory:');
  seed(db);
  server = createApp(db).listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

const call = (path, { method = 'GET', token, body } = {}) =>
  fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
const login = async (email, password = PASSWORD) => {
  const res = await call('/api/auth/login', { method: 'POST', body: { email, password } });
  return { res, data: await res.json() };
};

test('login succeeds and returns token + role', async () => {
  const { res, data } = await login('student@pes.edu');
  assert.equal(res.status, 200);
  assert.equal(data.user.role, 'student');
  assert.ok(data.token);
});

test('login rejects wrong password and unknown user', async () => {
  assert.equal((await login('student@pes.edu', 'nope')).res.status, 401);
  assert.equal((await login('ghost@pes.edu')).res.status, 401);
});

test('logout revokes the token', async () => {
  const { data } = await login('student@pes.edu');
  assert.equal((await call('/api/auth/me', { token: data.token })).status, 200);
  assert.equal((await call('/api/auth/logout', { method: 'POST', token: data.token })).status, 204);
  assert.equal((await call('/api/auth/me', { token: data.token })).status, 401);
});

test('account locks after 5 failed attempts, even with the right password', async () => {
  for (let i = 0; i < 4; i++) assert.equal((await login('student2@pes.edu', 'bad')).res.status, 401);
  assert.equal((await login('student2@pes.edu', 'bad')).res.status, 423);
  assert.equal((await login('student2@pes.edu')).res.status, 423);
});

test('protected routes need a token', async () => {
  assert.equal((await call('/api/assessments/mine')).status, 401);
});

test('role-based access: student vs counselor', async () => {
  const s = (await login('student@pes.edu')).data.token;
  const c = (await login('counselor@pes.edu')).data.token;
  assert.equal((await call('/api/assessments', { token: s })).status, 403);
  assert.equal((await call('/api/assessments', { token: c })).status, 200);
  assert.equal((await call('/api/assessments', { method: 'POST', token: c, body: { answers: Array(10).fill(1) } })).status, 403);
});

test('student takes assessment and sees it in history; counselor sees it too', async () => {
  const s = (await login('student@pes.edu')).data.token;
  const c = (await login('counselor@pes.edu')).data.token;
  const post = await call('/api/assessments', { method: 'POST', token: s, body: { answers: [4, 4, 4, 0, 0, 4, 0, 0, 4, 4] } });
  assert.equal(post.status, 201);
  assert.deepEqual({ ...(await post.json()), id: 0 }, { id: 0, score: 40, category: 'high' });
  const mine = await (await call('/api/assessments/mine', { token: s })).json();
  assert.equal(mine[0].category, 'high');
  const all = await (await call('/api/assessments', { token: c })).json();
  assert.equal(all[0].student, 'Sachin');
  const bad = await call('/api/assessments', { method: 'POST', token: s, body: { answers: [1] } });
  assert.equal(bad.status, 400);
});

test('mood check-in: validates and keeps one per day', async () => {
  const s = (await login('student@pes.edu')).data.token;
  assert.equal((await call('/api/mood', { method: 'POST', token: s, body: { mood: 9 } })).status, 400);
  assert.equal((await call('/api/mood', { method: 'POST', token: s, body: { mood: 2, note: 'tired' } })).status, 201);
  assert.equal((await call('/api/mood', { method: 'POST', token: s, body: { mood: 4 } })).status, 201);
  const list = await (await call('/api/mood/mine', { token: s })).json();
  assert.equal(list.length, 1);
  assert.equal(list[0].mood, 4);
});
