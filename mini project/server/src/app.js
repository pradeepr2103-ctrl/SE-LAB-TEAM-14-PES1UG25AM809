const express = require('express');
const cors = require('cors');
const { authenticate } = require('./auth');

function createApp(db) {
  const app = express();
  const auth = authenticate(db);
  app.use(cors());
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', require('./routes/auth')(db, auth));
  app.use('/api/assessments', require('./routes/assessments')(db, auth));
  app.use('/api/mood', require('./routes/mood')(db, auth));

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}

module.exports = { createApp };
