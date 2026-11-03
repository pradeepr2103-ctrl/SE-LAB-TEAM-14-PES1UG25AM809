const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { createApp } = require('../src/app');
const { signToken } = require('../src/auth');

let db, server, base, adminToken, studentToken, counselorToken;

before(async () => {
  db = new Database(':memory:');
  db.exec(fs.readFileSync(path.join(__dirname, '../src/schema.sql'), 'utf8'));
  const ins = db.prepare('INSERT INTO users (email, name, password_hash, role) VALUES (?,?,?,?)');
  ins.run('admin@pes.edu', 'Admin', 'x', 'admin');
  ins.run('student@pes.edu', 'Student', 'x', 'student');
  ins.run('counselor@pes.edu', 'Counselor', 'x', 'counselor');
  const tok = (email, jti) =>
    signToken(db.prepare('SELECT * FROM users WHERE email = ?').get(email), jti);
  adminToken = tok('admin@pes.edu', 'a1');
  studentToken = tok('student@pes.edu', 's1');
  counselorToken = tok('counselor@pes.edu', 'c1');
  server = createApp(db).listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  db.close();
});

const call = (method, url, token, body) =>
  fetch(base + url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

test('admin can list users', async () => {
  const res = await call('GET', '/api/users', adminToken);
  assert.strictEqual(res.status, 200);
  const { users } = await res.json();
  assert.strictEqual(users.length, 3);
  assert.ok(!('password_hash' in users[0]));
});

test('student gets 403 on GET /api/users', async () => {
  const res = await call('GET', '/api/users', studentToken);
  assert.strictEqual(res.status, 403);
});

test('counselor gets 403 on PATCH role', async () => {
  const res = await call('PATCH', '/api/users/2/role', counselorToken, { role: 'admin' });
  assert.strictEqual(res.status, 403);
});

test('no token gets 401', async () => {
  const res = await call('GET', '/api/users');
  assert.strictEqual(res.status, 401);
});

test('admin can change a role', async () => {
  const res = await call('PATCH', '/api/users/2/role', adminToken, { role: 'counselor' });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(db.prepare('SELECT role FROM users WHERE id = 2').get().role, 'counselor');
});

test('invalid role returns 400', async () => {
  const res = await call('PATCH', '/api/users/2/role', adminToken, { role: 'superuser' });
  assert.strictEqual(res.status, 400);
});

test('unknown user returns 404', async () => {
  const res = await call('PATCH', '/api/users/999/role', adminToken, { role: 'student' });
  assert.strictEqual(res.status, 404);
});

test('admin cannot change own role', async () => {
  const res = await call('PATCH', '/api/users/1/role', adminToken, { role: 'student' });
  assert.strictEqual(res.status, 400);
});