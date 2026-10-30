import { useEffect, useState } from 'react';
import { api, setToken, getToken } from './api.js';

const fmt = (ts) => new Date(ts * 1000).toLocaleString();

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const { token, user } = await api('/auth/login', { method: 'POST', body: { email, password } });
      setToken(token);
      onLogin(user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="narrow">
      <h1>Campus Wellness Portal</h1>
      <p className="muted">Check in on your stress and mood. Sign in with your campus account.</p>
      <form onSubmit={submit} className="panel stack">
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary">Sign in</button>
      </form>
    </main>
  );
}

function Assessment({ onDone }) {
  const [q, setQ] = useState(null);
  const [answers, setAnswers] = useState(Array(10).fill(null));
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api('/assessments/questions').then(setQ).catch((e) => setError(e.message)); }, []);
  if (result) {
    return (
      <div className="panel">
        <p className="muted">Your stress score</p>
        <p className="score">{result.score}<span> / 40</span></p>
        <p>Category: <b className={`tag ${result.category}`}>{result.category}</b></p>
        <button className="primary" onClick={() => { setResult(null); setAnswers(Array(10).fill(null)); onDone(); }}>Done</button>
      </div>
    );
  }
  if (!q) return <p className="muted">{error || 'Loading questions…'}</p>;

  const complete = answers.every((a) => a !== null);
  async function submit() {
    try { setResult(await api('/assessments', { method: 'POST', body: { answers } })); }
    catch (e) { setError(e.message); }
  }

  return (
    <div className="stack">
      {q.questions.map((text, i) => (
        <fieldset key={i} className="panel">
          <legend>{i + 1}. {text}</legend>
          <div className="scale">
            {q.scale.map((label, v) => (
              <label key={v} className={answers[i] === v ? 'pick on' : 'pick'}>
                <input type="radio" name={`q${i}`} checked={answers[i] === v}
                  onChange={() => setAnswers(answers.map((a, j) => (j === i ? v : a)))} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary" disabled={!complete} onClick={submit}>
        {complete ? 'See my score' : `Answer all questions (${answers.filter((a) => a !== null).length}/10)`}
      </button>
    </div>
  );
}

function Mood() {
  const [mood, setMood] = useState(3);
  const [note, setNote] = useState('');
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState('');
  const load = () => api('/mood/mine').then(setList);
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    await api('/mood', { method: 'POST', body: { mood, note: note || undefined } });
    setMsg('Check-in saved'); setNote(''); load();
  }
  const faces = ['Very low', 'Low', 'Okay', 'Good', 'Great'];
  return (
    <div className="stack">
      <form onSubmit={save} className="panel stack">
        <p>How are you feeling today?</p>
        <div className="scale">
          {faces.map((f, i) => (
            <label key={f} className={mood === i + 1 ? 'pick on' : 'pick'}>
              <input type="radio" name="mood" checked={mood === i + 1} onChange={() => setMood(i + 1)} />{f}
            </label>
          ))}
        </div>
        <label>Note (optional)<input maxLength={280} value={note} onChange={(e) => setNote(e.target.value)} /></label>
        <button className="primary">Save check-in</button>
        {msg && <p className="ok" role="status">{msg}</p>}
      </form>
      <table>
        <thead><tr><th>Day</th><th>Mood</th><th>Note</th></tr></thead>
        <tbody>
          {list.length === 0 && <tr><td colSpan="3" className="muted">No check-ins yet. Save your first one above.</td></tr>}
          {list.map((m) => <tr key={m.day}><td>{m.day}</td><td>{faces[m.mood - 1]}</td><td>{m.note}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}

function History() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api('/assessments/mine').then(setRows); }, []);
  return (
    <table>
      <thead><tr><th>Date</th><th>Score</th><th>Category</th></tr></thead>
      <tbody>
        {rows.length === 0 && <tr><td colSpan="3" className="muted">No assessments yet. Take one from the Assessment tab.</td></tr>}
        {rows.map((r) => <tr key={r.id}><td>{fmt(r.created_at)}</td><td>{r.score}</td><td><b className={`tag ${r.category}`}>{r.category}</b></td></tr>)}
      </tbody>
    </table>
  );
}

function Students() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('all');
  useEffect(() => { api('/assessments').then(setRows); }, []);
  const shown = rows.filter((r) => filter === 'all' || r.category === filter);
  return (
    <div className="stack">
      <label>Show<select value={filter} onChange={(e) => setFilter(e.target.value)}>
        {['all', 'high', 'moderate', 'low'].map((c) => <option key={c}>{c}</option>)}
      </select></label>
      <table>
        <thead><tr><th>Student</th><th>Date</th><th>Score</th><th>Category</th></tr></thead>
        <tbody>
          {shown.length === 0 && <tr><td colSpan="4" className="muted">No assessments match.</td></tr>}
          {shown.map((r) => <tr key={r.id}><td>{r.student}</td><td>{fmt(r.created_at)}</td><td>{r.score}</td><td><b className={`tag ${r.category}`}>{r.category}</b></td></tr>)}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!getToken());
  const [tab, setTab] = useState('assessment');
  const [bump, setBump] = useState(0);

  useEffect(() => {
    if (!getToken()) return;
    api('/auth/me').then(setUser).catch(() => setToken(null)).finally(() => setReady(true));
  }, []);

  async function logout() {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* token already invalid */ }
    setToken(null); setUser(null);
  }

  if (!ready) return null;
  if (!user) return <Login onLogin={(u) => { setUser(u); setTab('assessment'); }} />;

  const isStudent = user.role === 'student';
  const tabs = isStudent ? ['assessment', 'mood', 'history'] : ['students'];
  const active = tabs.includes(tab) ? tab : tabs[0];

  return (
    <>
      <header>
        <b>Campus Wellness Portal</b>
        <span className="who">{user.name} · {user.role}</span>
        <button onClick={logout}>Sign out</button>
      </header>
      <main>
        <nav>{tabs.map((t) => <button key={t} className={t === active ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>)}</nav>
        {active === 'assessment' && <Assessment onDone={() => { setBump(bump + 1); setTab('history'); }} />}
        {active === 'mood' && <Mood />}
        {active === 'history' && <History key={bump} />}
        {active === 'students' && <Students />}
      </main>
    </>
  );
}
