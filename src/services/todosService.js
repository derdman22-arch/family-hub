const BASE = '/api/notes';

function authHeaders(jwtToken) {
  return {
    'Content-Type': 'application/json',
    ...(jwtToken && { Authorization: `Bearer ${jwtToken}` }),
  };
}

export async function fetchNotes(jwtToken) {
  const resp = await fetch(BASE, { headers: authHeaders(jwtToken) });
  if (!resp.ok) throw new Error('Failed to fetch notes');
  return resp.json();
}

export async function createNote(jwtToken, payload) {
  const resp = await fetch(BASE, {
    method: 'POST',
    headers: authHeaders(jwtToken),
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error('Failed to create note');
  return resp.json();
}

export async function patchNote(jwtToken, id, patch) {
  const resp = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: authHeaders(jwtToken),
    body: JSON.stringify(patch),
  });
  if (!resp.ok) throw new Error('Failed to update note');
  return resp.json();
}
