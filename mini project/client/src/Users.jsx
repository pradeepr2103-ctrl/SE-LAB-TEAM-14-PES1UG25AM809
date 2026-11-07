import { useEffect, useState } from 'react';
import { api } from './api.js';

const ROLES = ['student', 'counselor', 'admin'];

export default function Users({ me }) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [temp, setTemp] = useState(null);

  const load = () =>
    api('/users')
      .then((d) => setUsers(d.users))
      .catch((e) => setError(e.message));

  useEffect(() => { load(); }, []);

  async function changeRole(id, role) {
    setError('');
    setMsg('');
    try {
      await api(`/users/${id}/role`, { method: 'PATCH', body: { role } });
      setMsg('Role updated');
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function resetPassword(u) {
    if (!window.confirm(`Issue a temporary password for ${u.email}?`)) return;
    setError('');
    setMsg('');
    try {
      const { temporaryPassword } = await api(`/users/${u.id}/reset-password`, { method: 'POST' });
      setTemp({ email: u.email, password: temporaryPassword });
    } catch (e) {
      setTemp(null);
      setError(e.message);
    }
  }

  return (
    <div className="stack">
      {temp && (
        <p className="panel ok" role="status" style={{ margin: 0 }}>
          Temporary password for {temp.email}: <b>{temp.password}</b><br />
          <span className="muted">Shown once. Share it securely; they should change it after signing in.</span>
        </p>
      )}
      {error && <p className="error" role="alert">{error}</p>}
      {msg && <p className="ok" role="status">{msg}</p>}
      <table>
        <thead>
          <tr><th>Name</th><th>Email</th><th>Role</th><th>Password</th></tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr><td colSpan="4" className="muted">No users found.</td></tr>
          )}
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                <select
                  value={u.role}
                  disabled={u.id === me}
                  aria-label={`Role for ${u.email}`}
                  onChange={(e) => changeRole(u.id, e.target.value)}
                >
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </td>
              <td>
                <button disabled={u.id === me} onClick={() => resetPassword(u)}>Reset password</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}