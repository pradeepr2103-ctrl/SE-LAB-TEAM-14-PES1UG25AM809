import { useEffect, useState } from 'react';
import { api } from './api.js';

const fmt = (ts) => new Date(ts * 1000).toLocaleString();

// CWP-21: private notes a counselor keeps on one assessment (encrypted on the server).
export default function Notes({ assessmentId }) {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => api(`/assessments/${assessmentId}/notes`).then(setNotes).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [assessmentId]);

  async function save(e) {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      await api(`/assessments/${assessmentId}/notes`, { method: 'POST', body: { note: text } });
      setText('');
      setMsg('Note saved');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="panel stack" aria-label={`Notes for assessment ${assessmentId}`}>
      <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Private notes (only you can read these)</h2>
      <form onSubmit={save} className="stack">
        <label>New note
          <textarea rows="3" maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} required />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        {msg && <p className="ok" role="status">{msg}</p>}
        <button className="primary" disabled={!text.trim()}>Save note</button>
      </form>
      {notes.length === 0 && <p className="muted">No notes yet for this assessment.</p>}
      {notes.map((n) => (
        <p key={n.id} style={{ margin: 0 }}>
          <span className="muted">{fmt(n.created_at)}</span><br />{n.note}
        </p>
      ))}
    </section>
  );
}
