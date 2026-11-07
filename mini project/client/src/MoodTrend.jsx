import { useEffect, useState } from 'react';
import { api } from './api.js';

const FACES = ['Very low', 'Low', 'Okay', 'Good', 'Great'];
const DAY = 86400000;

// CWP-19: line chart of the last N days of mood check-ins (1 = very low, 5 = great).
export default function MoodTrend({ days = 30 }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/mood/trend?days=${days}`).then(setData).catch((e) => setError(e.message));
  }, [days]);

  if (error) return <p className="error" role="alert">{error}</p>;
  if (!data) return <p className="muted">Loading mood trend…</p>;

  const W = 640, H = 230, L = 74, R = 16, T = 16, B = 30;
  const t0 = Date.parse(`${data.since}T00:00:00Z`);
  const x = (day) => L + ((Date.parse(`${day}T00:00:00Z`) - t0) / ((days - 1) * DAY)) * (W - L - R);
  const y = (m) => T + ((5 - m) / 4) * (H - T - B);
  const pts = data.points.map((p) => ({ ...p, cx: x(p.day), cy: y(p.mood) }));
  const label = (d) => d.slice(5);

  return (
    <section className="panel stack" aria-label="Mood trend">
      <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Mood trend, last {days} days</h2>
      {pts.length === 0 ? (
        <p className="muted">No check-ins in this period. Save one from the Mood tab to start your trend.</p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} role="img" style={{ width: '100%', height: 'auto' }}
          aria-label={`Mood over the last ${days} days: ${pts.map((p) => `${p.day} ${FACES[p.mood - 1]}`).join(', ')}`}>
          {[1, 2, 3, 4, 5].map((m) => (
            <g key={m}>
              <line x1={L} x2={W - R} y1={y(m)} y2={y(m)} stroke="var(--line)" />
              <text x={L - 8} y={y(m) + 4} textAnchor="end" fontSize="12" fill="currentColor">{FACES[m - 1]}</text>
            </g>
          ))}
          <text x={L} y={H - 8} fontSize="12" fill="currentColor">{label(data.since)}</text>
          <text x={W - R} y={H - 8} textAnchor="end" fontSize="12" fill="currentColor">
            {label(new Date(t0 + (days - 1) * DAY).toISOString().slice(0, 10))}
          </text>
          <polyline fill="none" stroke="var(--accent)" strokeWidth="2.5"
            points={pts.map((p) => `${p.cx},${p.cy}`).join(' ')} />
          {pts.map((p) => (
            <circle key={p.day} cx={p.cx} cy={p.cy} r="4.5" fill="var(--accent)">
              <title>{`${p.day}: ${FACES[p.mood - 1]}`}</title>
            </circle>
          ))}
        </svg>
      )}
    </section>
  );
}
