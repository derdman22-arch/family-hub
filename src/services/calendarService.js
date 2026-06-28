const BASE = 'https://www.googleapis.com/calendar/v3';
const CALENDAR_ID = process.env.REACT_APP_GOOGLE_CALENDAR_ID || 'primary';

export async function createEvent(accessToken, eventBody) {
  const res = await fetch(`${BASE}/calendars/${encodeURIComponent(CALENDAR_ID)}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventBody),
  });

  if (res.status === 401) {
    const err = new Error('Google auth expired — please sign in again.');
    err.code = 'AUTH_EXPIRED';
    throw err;
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error?.message || `Calendar API error ${res.status}`);
  }

  return res.json();
}

export async function fetchWeekEvents(accessToken, weekStart) {
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const url = new URL(`${BASE}/calendars/${encodeURIComponent(CALENDAR_ID)}/events`);
  url.searchParams.set('timeMin', weekStart.toISOString());
  url.searchParams.set('timeMax', weekEnd.toISOString());
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '100');

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 401) {
    const err = new Error('Google auth expired — please sign in again.');
    err.code = 'AUTH_EXPIRED';
    throw err;
  }
  if (res.status === 403) {
    const err = new Error('Calendar access denied. Sign out and sign back in to grant calendar access.');
    err.code = 'PERMISSION_DENIED';
    throw err;
  }
  if (!res.ok) {
    throw new Error(`Calendar API error ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  return data.items || [];
}
