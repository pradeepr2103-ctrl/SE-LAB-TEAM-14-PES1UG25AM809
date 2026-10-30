let token = sessionStorage.getItem('cwp_token');

export function setToken(t) {
  token = t;
  if (t) sessionStorage.setItem('cwp_token', t);
  else sessionStorage.removeItem('cwp_token');
}
export const getToken = () => token;

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
