const crypto = require('crypto');

// CWP-21: counselor notes are encrypted at rest with AES-256-GCM.
// Set NOTES_KEY in production; notes cannot be read without the same key.
const KEY = crypto.scryptSync(process.env.NOTES_KEY || 'dev-notes-key-change-me', 'cwp-notes-salt', 32);

// Returns "iv.tag.ciphertext" (each part base64).
function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString('base64')).join('.');
}

// Throws if the payload was altered or the key is different.
function decrypt(payload) {
  const [iv, tag, enc] = payload.split('.').map((p) => Buffer.from(p, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

module.exports = { encrypt, decrypt };
