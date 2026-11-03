import { api } from './api';

// Calendar requests go through the backend, which holds each user's Google
// refresh token, so access doesn't expire after an hour.

export function fetchEvents(timeMin, timeMax) {
  const params = new URLSearchParams({ timeMin: timeMin.toISOString(), timeMax: timeMax.toISOString() });
  return api(`/calendar/events?${params}`).then((data) => data.items || []);
}

export function createEvent(eventBody) {
  return api('/calendar/events', { method: 'POST', body: eventBody });
}

export function updateEvent(id, eventBody) {
  return api(`/calendar/events/${encodeURIComponent(id)}`, { method: 'PATCH', body: eventBody });
}

export function deleteEvent(id) {
  return api(`/calendar/events/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
