const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const TOKEN_TTL = '2h';

function signToken(user, jti) {
  return jwt.sign({ sub: user.id, role: user.role, name: user.name }, SECRET, {
    expiresIn: TOKEN_TTL,
    jwtid: jti,
  });
}

function authenticate(db) {
  const revoked = db.prepare('SELECT 1 FROM revoked_tokens WHERE jti = ?');
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing token' });
    try {
      const p = jwt.verify(token, SECRET);
      if (revoked.get(p.jti)) return res.status(401).json({ error: 'Token revoked' });
      req.user = { id: p.sub, role: p.role, name: p.name, jti: p.jti, exp: p.exp };
      next();
    } catch {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

// Role-based access control: allow only the listed roles.
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden for your role' });
    next();
  };
}

module.exports = { signToken, authenticate, requireRole };
