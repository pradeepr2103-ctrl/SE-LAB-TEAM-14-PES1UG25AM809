const express = require('express');
const bcrypt = require('bcryptjs');
const { requireRole } = require('../auth');
const { generateTempPassword } = require('../password');

const ROLES = ['student', 'counselor', 'admin'];

module.exports = (db, auth) => {
  const router = express.Router();
  router.use(auth, requireRole('admin'));

  router.get('/', (_req, res) => {
    const users = db
      .prepare('SELECT id, email, name, role, created_at FROM users ORDER BY id')
      .all();
    res.json({ users });
  });

  router.patch('/:id/role', (req, res) => {
    const id = Number(req.params.id);
    const { role } = req.body || {};
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid user id' });
    if (!ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' });
    if (id === req.user.id) return res.status(400).json({ error: 'You cannot change your own role' });
    const info = db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
    if (info.changes === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ id, role });
  });

  // CWP-18: admin issues a temporary password (also clears a lockout). Shown once, never stored in plain text.
  router.post('/:id/reset-password', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid user id' });
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Use change password for your own account' });
    }
    const temporaryPassword = generateTempPassword();
    const info = db
      .prepare('UPDATE users SET password_hash = ?, failed_attempts = 0, locked_until = NULL WHERE id = ?')
      .run(bcrypt.hashSync(temporaryPassword, 10), id);
    if (info.changes === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ id, temporaryPassword });
  });

  return router;
};