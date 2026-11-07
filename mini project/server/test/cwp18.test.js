const test = require('node:test');
const assert = require('node:assert/strict');
const { openDb } = require('../src/db');
const { seed, PASSWORD } = require('../src/seed');
const { createApp } = require('../src/app');
const { validatePassword, generateTempPassword } = require('../src/password');

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
  return { status: res.status, ...(await res.json()) };
};
const change = (token, currentPassword, newPassword) =>
  call('/api/auth/change-password', { method: 'POST', token, body: { currentPassword, newPassword } });

test('password policy: length, letter and number', () => {
  assert.ok(validatePassword('short1'));
  assert.ok(validatePassword('onlyletters'));
  assert.ok(validatePassword('12345678'));
  assert.ok(validatePassword('a1'.repeat(40)));
  assert.ok(validatePassword(42));
  assert.equal(validatePassword('Goodpass1'), null);
});

test('generated temporary passwords always satisfy the policy', () => {
  for (let i = 0; i < 50; i++) {
    const p = generateTempPassword();
    assert.equal(p.length, 12);
    assert.equal(validatePassword(p), null);
  }
});

test('change-password rejects a wrong current password', async () => {
  const { token } = await login('student2@pes.edu');
  const res = await change(token, 'not-my-password', 'Newpass123');
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /current password/i);
});

test('change-password rejects a weak new password and an unchanged one', async () => {
  const { token } = await login('student2@pes.edu');
  assert.equal((await change(token, PASSWORD, 'short1')).status, 400);
  assert.equal((await change(token, PASSWORD, 'lettersonly')).status, 400);
  assert.equal((await change(token, PASSWORD, PASSWORD)).status, 400);
});

test('change-password validates the request body and needs a token', async () => {
  const { token } = await login('student2@pes.edu');
  const res = await call('/api/auth/change-password', { method: 'POST', token, body: {} });
  assert.equal(res.status, 400);
  const anon = await call('/api/auth/change-password', { method: 'POST', body: { currentPassword: 'a', newPassword: 'b' } });
  assert.equal(anon.status, 401);
});

test('change-password works: old password stops working, new one works, session ends', async () => {
  const { token } = await login('counselor@pes.edu');
  const res = await change(token, PASSWORD, 'Fresh-pass-77');
  assert.equal(res.status, 200);
  assert.equal((await call('/api/auth/me', { token })).status, 401);
  assert.equal((await login('counselor@pes.edu', PASSWORD)).status, 401);
  assert.equal((await login('counselor@pes.edu', 'Fresh-pass-77')).status, 200);
});

test('admin reset issues a temporary password that works and clears a lockout', async () => {
  for (let i = 0; i < 5; i++) await login('student@pes.edu', 'wrong-password');
  assert.equal((await login('student@pes.edu')).status, 423);
  const { token: admin } = await login('admin@pes.edu');
  const users = await (await call('/api/users', { token: admin })).json();
  const student = users.users.find((u) => u.email === 'student@pes.edu');
  const res = await call(`/api/users/${student.id}/reset-password`, { method: 'POST', token: admin });
  assert.equal(res.status, 200);
  const { temporaryPassword } = await res.json();
  assert.equal(validatePassword(temporaryPassword), null);
  assert.equal((await login('student@pes.edu', PASSWORD)).status, 401);
  assert.equal((await login('student@pes.edu', temporaryPassword)).status, 200);
});

test('only admins can reset passwords', async () => {
  const { token: student } = await login('student2@pes.edu');
  assert.equal((await call('/api/users/1/reset-password', { method: 'POST', token: student })).status, 403);
  assert.equal((await call('/api/users/1/reset-password', { method: 'POST' })).status, 401);
});

test('admin reset: unknown user 404, bad id 400, own account 400', async () => {
  const { token: admin, user } = await login('admin@pes.edu');
  assert.equal((await call('/api/users/9999/reset-password', { method: 'POST', token: admin })).status, 404);
  assert.equal((await call('/api/users/abc/reset-password', { method: 'POST', token: admin })).status, 400);
  assert.equal((await call(`/api/users/${user.id}/reset-password`, { method: 'POST', token: admin })).status, 400);
});
