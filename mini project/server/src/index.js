const { openDb } = require('./db');
const { createApp } = require('./app');

const port = process.env.PORT || 4000;
createApp(openDb()).listen(port, () => console.log(`CWP API on http://localhost:${port}`));
