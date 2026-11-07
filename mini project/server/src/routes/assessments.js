const express = require('express');
const { requireRole } = require('../auth');
const { QUESTIONS, scoreAssessment, ValidationError } = require('../scoring');
const { encrypt, decrypt } = require('../crypto');

module.exports = (db, auth) => {
  const r = express.Router();
  r.use(auth);

  r.get('/questions', (_req, res) => {
    res.json({ scale: ['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'], questions: QUESTIONS });
  });

  // CWP-11 / CWP-12: take assessment, get score + category
  r.post('/', requireRole('student'), (req, res) => {
    try {
      const { score, category } = scoreAssessment(req.body && req.body.answers);
      const info = db
        .prepare('INSERT INTO assessments (user_id, answers, score, category) VALUES (?, ?, ?, ?)')
        .run(req.user.id, JSON.stringify(req.body.answers), score, category);
      res.status(201).json({ id: info.lastInsertRowid, score, category });
    } catch (e) {
      if (e instanceof ValidationError) return res.status(400).json({ error: e.message });
      throw e;
    }
  });

  // CWP-13: own history
  r.get('/mine', requireRole('student'), (req, res) => {
    res.json(
      db.prepare('SELECT id, score, category, created_at FROM assessments WHERE user_id = ? ORDER BY id DESC').all(req.user.id)
    );
  });

  // CWP-8: counselors/admins see everyone
  r.get('/', requireRole('counselor', 'admin'), (_req, res) => {
    res.json(
      db
        .prepare(
          `SELECT a.id, u.name AS student, a.score, a.category, a.created_at
           FROM assessments a JOIN users u ON u.id = a.user_id ORDER BY a.id DESC`
        )
        .all()
    );
  });

  // CWP-21: private counselor notes on an assessment, encrypted at rest. Only counselors; each reads only their own.
  r.post('/:id/notes', requireRole('counselor'), (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid assessment id' });
    const { note } = req.body || {};
    if (typeof note !== 'string' || !note.trim() || note.length > 1000) {
      return res.status(400).json({ error: 'note must be text of 1 to 1000 characters' });
    }
    if (!db.prepare('SELECT 1 FROM assessments WHERE id = ?').get(id)) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    const info = db
      .prepare('INSERT INTO assessment_notes (assessment_id, counselor_id, note_enc) VALUES (?, ?, ?)')
      .run(id, req.user.id, encrypt(note.trim()));
    res.status(201).json({ id: info.lastInsertRowid });
  });

  r.get('/:id/notes', requireRole('counselor'), (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid assessment id' });
    const rows = db
      .prepare('SELECT id, note_enc, created_at FROM assessment_notes WHERE assessment_id = ? AND counselor_id = ? ORDER BY id DESC')
      .all(id, req.user.id);
    res.json(rows.map((n) => ({ id: n.id, note: decrypt(n.note_enc), created_at: n.created_at })));
  });

  return r;
};
