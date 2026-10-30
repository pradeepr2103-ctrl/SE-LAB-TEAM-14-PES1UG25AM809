const bcrypt = require('bcryptjs');
const { openDb } = require('./db');

const PASSWORD = process.env.SEED_PASSWORD || 'Passw0rd!';
const USERS = [
  { email: 'admin@pes.edu', name: 'Admin', role: 'admin' },
  { email: 'counselor@pes.edu', name: 'Dr. Rao', role: 'counselor' },
  { email: 'student@pes.edu', name: 'Sachin', role: 'student' },
  { email: 'student2@pes.edu', name: 'Asha', role: 'student' },
];

function seed(db) {
  const hash = bcrypt.hashSync(PASSWORD, 10);
  const stmt = db.prepare(
    `INSERT INTO users (email, name, password_hash, role) VALUES (@email, @name, @hash, @role)
     ON CONFLICT(email) DO UPDATE SET name=excluded.name, role=excluded.role,
       password_hash=excluded.password_hash, failed_attempts=0, locked_until=NULL`
  );
  db.transaction(() => USERS.forEach((u) => stmt.run({ ...u, hash })))();
  return USERS.length;
}

module.exports = { seed, USERS, PASSWORD };

if (require.main === module) {
  const db = openDb();
  console.log(`Seeded ${seed(db)} users (password: ${PASSWORD})`);
}
