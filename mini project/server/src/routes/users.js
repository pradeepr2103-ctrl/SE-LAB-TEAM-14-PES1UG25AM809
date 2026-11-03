const express = require('express');
const { requireRole } = require('../auth');

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

  return router;
};