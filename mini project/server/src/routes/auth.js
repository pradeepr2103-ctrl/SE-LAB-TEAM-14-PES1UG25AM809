const express = require('express');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const { signToken } = require('../auth');

const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 15 * 60;
const now = () => Math.floor(Date.now() / 1000);

module.exports = (db, auth) => {
  const r = express.Router();

  r.post('/login', (req, res) => {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    if (user.locked_until && user.locked_until > now()) {
      const mins = Math.ceil((user.locked_until - now()) / 60);
      return res.status(423).json({ error: `Account locked. Try again in ${mins} min.` });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      const attempts = user.failed_attempts + 1;
      if (attempts >= MAX_ATTEMPTS) {
        db.prepare('UPDATE users SET failed_attempts = 0, locked_until = ? WHERE id = ?').run(now() + LOCK_SECONDS, user.id);
        return res.status(423).json({ error: 'Too many failed attempts. Account locked for 15 minutes.' });
      }
      db.prepare('UPDATE users SET failed_attempts = ? WHERE id = ?').run(attempts, user.id);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    db.prepare('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);
    const token = signToken(user, randomUUID());
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });

  r.post('/logout', auth, (req, res) => {
    db.prepare('INSERT OR IGNORE INTO revoked_tokens (jti, expires_at) VALUES (?, ?)').run(req.user.jti, req.user.exp);
    db.prepare('DELETE FROM revoked_tokens WHERE expires_at < ?').run(now());
    res.status(204).end();
  });

  r.get('/me', auth, (req, res) => res.json({ id: req.user.id, name: req.user.name, role: req.user.role }));

  return r;
};
