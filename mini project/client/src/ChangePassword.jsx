import { useState } from 'react';
import { api } from './api.js';

// CWP-18: change own password. The server ends the session, so we sign out afterwards.
export default function ChangePassword({ onChanged }) {
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirm) return setError('New passwords do not match');
    setBusy(true);
    try {
      await api('/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } });
      onChanged();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="panel stack" style={{ maxWidth: 420 }}>
      <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Change password</h2>
      <p className="muted" style={{ margin: 0 }}>
        At least 8 characters with a letter and a number. You will be signed out afterwards.
      </p>
      <label>Current password
        <input type="password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} required autoComplete="current-password" />
      </label>
      <label>New password
        <input type="password" value={newPassword} onChange={(e) => setNew(e.target.value)} required autoComplete="new-password" />
      </label>
      <label>Confirm new password
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary" disabled={busy}>Change password</button>
    </form>
  );
}
