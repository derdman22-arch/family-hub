const express = require('express');
const requireAuth = require('../middleware/auth');
const { calendarFetch, GoogleReauthError } = require('../lib/google');

const router = express.Router();

router.use(requireAuth);

// Trimmed because a value pasted into a hosting dashboard can carry a stray
// space or newline, which Google treats as a different (unknown) calendar.
const CALENDAR_ID = (process.env.GOOGLE_CALENDAR_ID || 'primary').trim().replace(/^["']|["']$/g, '');

function eventsPath(eventId) {
  const calendarId = encodeURIComponent(CALENDAR_ID);
  return `/calendars/${calendarId}/events${eventId ? `/${encodeURIComponent(eventId)}` : ''}`;
}

// Only the fields the app edits are forwarded to Google
function eventBody(body) {
  const { summary, location, description, start, end } = body || {};
  return JSON.stringify({ summary, location, description, start, end });
}

// Wraps a handler so Google errors turn into sensible responses
const handle = (fn) => async (req, res) => {
  try {
    const resp = await fn(req);
    if (resp.status === 204) return res.status(204).end();
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      // The ID's shape (not its value) helps tell a bad setting from missing access
      console.error(`Calendar API ${resp.status} for user ${req.user.userId}: ${data?.error?.message} `
        + `(calendar ID ${CALENDAR_ID.length} chars, ends "${CALENDAR_ID.slice(-27)}")`);
      return res.status(resp.status).json({ error: data?.error?.message || `Calendar API error ${resp.status}` });
    }
    res.status(resp.status).json(data);
  } catch (err) {
    if (err instanceof GoogleReauthError) {
      return res.status(401).json({ error: err.message, code: err.code });
    }
    console.error('Calendar error:', err.message);
    res.status(502).json({ error: 'Could not reach Google Calendar' });
  }
};

// GET /api/calendar/events?timeMin=ISO&timeMax=ISO
router.get('/events', handle((req) => {
  const params = new URLSearchParams({
    timeMin: String(req.query.timeMin || new Date().toISOString()),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  });
  if (req.query.timeMax) params.set('timeMax', String(req.query.timeMax));
  return calendarFetch(req.user.userId, `${eventsPath()}?${params}`);
}));

router.post('/events', handle((req) =>
  calendarFetch(req.user.userId, eventsPath(), { method: 'POST', body: eventBody(req.body) })
));

router.patch('/events/:id', handle((req) =>
  calendarFetch(req.user.userId, eventsPath(req.params.id), { method: 'PATCH', body: eventBody(req.body) })
));

router.delete('/events/:id', handle((req) =>
  calendarFetch(req.user.userId, eventsPath(req.params.id), { method: 'DELETE' })
));

module.exports = router;
