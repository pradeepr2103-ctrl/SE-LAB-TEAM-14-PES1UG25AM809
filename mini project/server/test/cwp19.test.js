const test = require('node:test');
const assert = require('node:assert/strict');
const { openDb } = require('../src/db');
const { seed, PASSWORD } = require('../src/seed');
const { createApp } = require('../src/app');

let db, server, base, token, userId;
const dayOffset = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

test.before(async () => {
  db = openDb(':memory:');
  seed(db);
  server = createApp(db).listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
  const res = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@pes.edu', password: PASSWORD }),
  });
  const data = await res.json();
  token = data.token;
  userId = data.user.id;
  const ins = db.prepare('INSERT INTO mood_checkins (user_id, mood, day) VALUES (?, ?, ?)');
  // out of order on purpose; 30 days ago falls outside a 30-day window (today is day 1 of 30)
  ins.run(userId, 4, dayOffset(5));
  ins.run(userId, 2, dayOffset(29));
  ins.run(userId, 5, dayOffset(0));
  ins.run(userId, 1, dayOffset(30));
  ins.run(userId, 3, dayOffset(40));
});
test.after(() => server.close());

const get = (path, tok = token) =>
  fetch(base + path, { headers: tok ? { Authorization: `Bearer ${tok}` } : {} });

test('trend returns the last 30 days only, oldest first', async () => {
  const body = await (await get('/api/mood/trend')).json();
  assert.equal(body.days, 30);
  assert.deepEqual(body.points.map((p) => p.mood), [2, 4, 5]);
  assert.deepEqual(body.points.map((p) => p.day), [dayOffset(29), dayOffset(5), dayOffset(0)]);
});

test('trend honours the days parameter (7-day window)', async () => {
  const body = await (await get('/api/mood/trend?days=7')).json();
  assert.deepEqual(body.points.map((p) => p.mood), [4, 5]);
});

test('trend accepts a 90-day window', async () => {
  const body = await (await get('/api/mood/trend?days=90')).json();
  assert.equal(body.points.length, 5);
});

test('trend rejects invalid days', async () => {
  for (const d of ['6', '91', 'abc', '10.5']) {
    assert.equal((await get(`/api/mood/trend?days=${d}`)).status, 400, d);
  }
});

test('trend only returns the signed-in student\'s own data', async () => {
  const res = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student2@pes.edu', password: PASSWORD }),
  });
  const other = (await res.json()).token;
  const body = await (await get('/api/mood/trend', other)).json();
  assert.deepEqual(body.points, []);
});

test('trend needs a student token', async () => {
  assert.equal((await get('/api/mood/trend', null)).status, 401);
  const res = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'counselor@pes.edu', password: PASSWORD }),
  });
  const counselor = (await res.json()).token;
  assert.equal((await get('/api/mood/trend', counselor)).status, 403);
});
