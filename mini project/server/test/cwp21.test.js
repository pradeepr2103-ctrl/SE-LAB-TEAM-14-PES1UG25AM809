const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { openDb } = require('../src/db');
const { seed, PASSWORD } = require('../src/seed');
const { createApp } = require('../src/app');
const { encrypt, decrypt } = require('../src/crypto');

let db, server, base, student, counselor, counselor2, admin, assessmentId;

const call = (path, { method = 'GET', token, body } = {}) =>
  fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
const login = async (email) =>
  (await (await call('/api/auth/login', { method: 'POST', body: { email, password: PASSWORD } })).json()).token;

test.before(async () => {
  db = openDb(':memory:');
  seed(db);
  db.prepare("INSERT INTO users (email, name, password_hash, role) VALUES ('counselor2@pes.edu', 'Dr. Iyer', ?, 'counselor')")
    .run(bcrypt.hashSync(PASSWORD, 10));
  server = createApp(db).listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
  student = await login('student@pes.edu');
  counselor = await login('counselor@pes.edu');
  counselor2 = await login('counselor2@pes.edu');
  admin = await login('admin@pes.edu');
  const a = await call('/api/assessments', { method: 'POST', token: student, body: { answers: Array(10).fill(3) } });
  assessmentId = (await a.json()).id;
});
test.after(() => server.close());

const addNote = (token, note, id = assessmentId) =>
  call(`/api/assessments/${id}/notes`, { method: 'POST', token, body: { note } });

test('encrypt/decrypt round-trips and uses a fresh iv each time', () => {
  const a = encrypt('hello');
  assert.notEqual(a, encrypt('hello'));
  assert.equal(decrypt(a), 'hello');
  assert.equal(decrypt(encrypt('unicode ✓ ñ')), 'unicode ✓ ñ');
});

test('tampered ciphertext is rejected', () => {
  const [iv, tag, enc] = encrypt('secret').split('.');
  const flipped = Buffer.from(enc, 'base64');
  flipped[0] ^= 1;
  assert.throws(() => decrypt([iv, tag, flipped.toString('base64')].join('.')));
});

test('counselor saves a note and reads it back', async () => {
  const res = await addNote(counselor, '  Follow up next week  ');
  assert.equal(res.status, 201);
  const list = await (await call(`/api/assessments/${assessmentId}/notes`, { token: counselor })).json();
  assert.equal(list.length, 1);
  assert.equal(list[0].note, 'Follow up next week');
});

test('the database never holds the note as readable text', async () => {
  await addNote(counselor, 'Very private observation');
  const rows = db.prepare('SELECT note_enc FROM assessment_notes').all();
  assert.ok(rows.length >= 1);
  for (const r of rows) {
    assert.ok(!r.note_enc.includes('private'));
    assert.ok(!r.note_enc.includes('Follow'));
    assert.equal(r.note_enc.split('.').length, 3);
  }
});

test('another counselor cannot read someone else\'s notes', async () => {
  const list = await (await call(`/api/assessments/${assessmentId}/notes`, { token: counselor2 })).json();
  assert.deepEqual(list, []);
});

test('students and admins get 403, anonymous gets 401', async () => {
  for (const tok of [student, admin]) {
    assert.equal((await addNote(tok, 'x')).status, 403);
    assert.equal((await call(`/api/assessments/${assessmentId}/notes`, { token: tok })).status, 403);
  }
  assert.equal((await call(`/api/assessments/${assessmentId}/notes`)).status, 401);
});

test('validation: empty, blank, too long, unknown assessment, bad id', async () => {
  assert.equal((await addNote(counselor, '')).status, 400);
  assert.equal((await addNote(counselor, '   ')).status, 400);
  assert.equal((await addNote(counselor, 'x'.repeat(1001))).status, 400);
  assert.equal((await addNote(counselor, 'ok', 9999)).status, 404);
  assert.equal((await addNote(counselor, 'ok', 'abc')).status, 400);
  assert.equal((await call('/api/assessments/abc/notes', { token: counselor })).status, 400);
  assert.equal((await call('/api/assessments/1/notes', { method: 'POST', token: counselor, body: {} })).status, 400);
});
