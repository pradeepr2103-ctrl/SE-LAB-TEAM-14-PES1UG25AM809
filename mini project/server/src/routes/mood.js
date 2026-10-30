const express = require('express');
const { requireRole } = require('../auth');

const today = () => new Date().toISOString().slice(0, 10);

module.exports = (db, auth) => {
  const r = express.Router();
  r.use(auth, requireRole('student'));

  // CWP-14: one check-in per day; posting again today updates it
  r.post('/', (req, res) => {
    const { mood, note } = req.body || {};
    if (!Number.isInteger(mood) || mood < 1 || mood > 5) {
      return res.status(400).json({ error: 'mood must be an integer from 1 to 5' });
    }
    if (note != null && (typeof note !== 'string' || note.length > 280)) {
      return res.status(400).json({ error: 'note must be text up to 280 characters' });
    }
    db.prepare(
      `INSERT INTO mood_checkins (user_id, mood, note, day) VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, day) DO UPDATE SET mood = excluded.mood, note = excluded.note`
    ).run(req.user.id, mood, note || null, today());
    res.status(201).json({ day: today(), mood, note: note || null });
  });

  r.get('/mine', (req, res) => {
    res.json(
      db.prepare('SELECT day, mood, note FROM mood_checkins WHERE user_id = ? ORDER BY day DESC LIMIT 30').all(req.user.id)
    );
  });

  return r;
};
