const crypto = require('crypto');

const MIN_LENGTH = 8;
const MAX_LENGTH = 72; // bcrypt ignores anything beyond 72 bytes

// Returns an error message, or null when the password is acceptable.
function validatePassword(p) {
  if (typeof p !== 'string') return 'Password must be text';
  if (p.length < MIN_LENGTH) return `Password must be at least ${MIN_LENGTH} characters`;
  if (p.length > MAX_LENGTH) return `Password must be at most ${MAX_LENGTH} characters`;
  if (!/[A-Za-z]/.test(p) || !/[0-9]/.test(p)) return 'Password must contain a letter and a number';
  return null;
}

// 12 random characters without look-alikes (no 0/O, 1/l/I); always passes validatePassword.
function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  for (;;) {
    let out = '';
    for (let i = 0; i < 12; i++) out += chars[crypto.randomInt(chars.length)];
    if (!validatePassword(out)) return out;
  }
}

module.exports = { validatePassword, generateTempPassword, MIN_LENGTH };
