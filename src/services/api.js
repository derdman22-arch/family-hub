// The signed-in session lives in localStorage so the home-screen app stays signed
// in between launches (the server's JWT lasts 60 days).
const SESSION_KEY = 'fh_session';

export function getSession() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY));
    return s?.token ? s : null;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// Calls the backend with the session JWT. A 401 means the session (or the
// server's Google access) is no longer valid, so the app signs out.
export async function api(path, { method = 'GET', body } = {}) {
  const session = getSession();
  const resp = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(session && { Authorization: `Bearer ${session.token}` }),
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    const message = data.error || `Request failed (${resp.status})`;
    if (resp.status === 401) {
      clearSession();
      window.dispatchEvent(new CustomEvent('fh:signedout', { detail: message }));
    }
    throw new Error(message);
  }
  return resp.status === 204 ? null : resp.json();
}
