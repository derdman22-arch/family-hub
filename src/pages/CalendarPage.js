import { useState, useEffect } from 'react';
import { useCalendar } from '../hooks/useCalendar';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekDays(weekStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function eventDateStr(ev) {
  if (ev.start.date) return ev.start.date;
  const d = new Date(ev.start.dateTime);
  return toDateStr(d);
}

function eventsForDay(events, date) {
  const dateStr = toDateStr(date);
  return events.filter(ev => (ev.start.date
    ? ev.start.date <= dateStr && dateStr < ev.end.date // end.date is exclusive
    : eventDateStr(ev) === dateStr));
}

function formatEventTime(ev) {
  if (ev.start.date) return 'All day';
  const d = new Date(ev.start.dateTime);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatWeekRange(weekStart) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const start = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const end = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${start} – ${end}`;
}

function busyBarColor(count) {
  if (count === 0) return 'bg-gray-800';
  if (count <= 2) return 'bg-blue-700/50';
  if (count <= 4) return 'bg-blue-600/70';
  return 'bg-blue-500';
}

function formatDateRange(ev) {
  if (ev.start.date) {
    const start = new Date(ev.start.date + 'T12:00:00');
    // end.date on all-day events is exclusive (next day), so subtract one
    const end = new Date(ev.end.date + 'T12:00:00');
    end.setDate(end.getDate() - 1);
    const opts = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    if (toDateStr(start) === toDateStr(end)) {
      return { date: start.toLocaleDateString('en-US', opts), time: 'All day' };
    }
    return {
      date: `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      time: 'All day',
    };
  }
  const start = new Date(ev.start.dateTime);
  const end = new Date(ev.end.dateTime);
  return {
    date: start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    time: `${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} – ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
  };
}

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

const RSVP = {
  accepted:    { label: 'Accepted',  dot: 'bg-green-500' },
  declined:    { label: 'Declined',  dot: 'bg-red-500' },
  tentative:   { label: 'Maybe',     dot: 'bg-yellow-500' },
  needsAction: { label: 'Invited',   dot: 'bg-gray-600' },
};

function todayStr() {
  return toDateStr(new Date());
}

function shiftDateStr(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

function toTimeStr(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// Form values for an existing event (edit) or a blank one (add)
function formDefaults(event, defaultDate) {
  const blank = { title: '', date: defaultDate || todayStr(), allDay: false, startTime: '09:00', endTime: '10:00', allDaySpan: 1, location: '', description: '' };
  if (!event) return blank;
  const base = {
    ...blank,
    title: event.summary || '',
    location: event.location || '',
    description: event.description ? stripHtml(event.description) : '',
  };
  if (event.start.date) {
    const days = (new Date(event.end.date + 'T12:00:00') - new Date(event.start.date + 'T12:00:00')) / 86400000;
    return { ...base, date: event.start.date, allDay: true, allDaySpan: Math.max(1, Math.round(days)) };
  }
  const start = new Date(event.start.dateTime);
  return {
    ...base,
    date: toDateStr(start),
    startTime: toTimeStr(start),
    endTime: toTimeStr(new Date(event.end.dateTime)),
  };
}

// ─── Add / Edit Event Modal ───────────────────────────────────────────────────

function EventFormModal({ event, defaultDate, onClose, onSave }) {
  const [defaults] = useState(() => formDefaults(event, defaultDate));
  const [title, setTitle] = useState(defaults.title);
  const [date, setDate] = useState(defaults.date);
  const [allDay, setAllDay] = useState(defaults.allDay);
  const [startTime, setStartTime] = useState(defaults.startTime);
  const [endTime, setEndTime] = useState(defaults.endTime);
  const [location, setLocation] = useState(defaults.location);
  const [description, setDescription] = useState(defaults.description);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // An end time at or before the start means the event runs past midnight
    const endDate = endTime <= startTime ? shiftDateStr(date, 1) : date;

    const body = {
      summary: title.trim(),
      // Empty strings rather than omitting, so editing can clear these fields
      location: location.trim(),
      description: description.trim(),
      ...(allDay
        ? { start: { date }, end: { date: shiftDateStr(date, defaults.allDaySpan) } }
        : {
            start: { dateTime: `${date}T${startTime}:00`, timeZone },
            end: { dateTime: `${endDate}T${endTime}:00`, timeZone },
          }),
    };

    setSaving(true);
    setError(null);
    try {
      await onSave(body);
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const inputClass =
    'w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-600';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-white font-bold text-lg">{event ? 'Edit Event' : 'Add Event'}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <input
            className={inputClass}
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />

          <div className="flex items-center gap-3">
            <input
              type="date"
              className={inputClass}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <label className="flex items-center gap-2 text-sm text-gray-400 whitespace-nowrap cursor-pointer">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="accent-blue-500"
              />
              All day
            </label>
          </div>

          {!allDay && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Start</label>
                <input
                  type="time"
                  className={inputClass}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">End</label>
                <input
                  type="time"
                  className={inputClass}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <input
            className={inputClass}
            placeholder="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <textarea
            className={`${inputClass} resize-none h-20`}
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {saving ? 'Saving…' : event ? 'Save' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Event Detail Modal ───────────────────────────────────────────────────────

function EventDetailModal({ event, onClose, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  async function handleDelete() {
    if (!window.confirm(`Delete "${event.summary || 'this event'}" from the calendar?`)) return;
    setDeleting(true);
    setError(null);
    try {
      await onDelete(event.id);
      onClose();
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const { date, time } = formatDateRange(event);
  const description = event.description ? stripHtml(event.description) : null;
  const attendees = event.attendees || [];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <h2 className="text-white font-bold text-lg leading-snug">
            {event.summary || '(No title)'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors shrink-0 mt-0.5"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 pb-6 space-y-4">
          {/* Date & time */}
          <div className="flex gap-3">
            <span className="text-gray-500 text-sm w-4 mt-0.5">📅</span>
            <div>
              <p className="text-white text-sm">{date}</p>
              <p className="text-gray-400 text-sm">{time}</p>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex gap-3">
              <span className="text-gray-500 text-sm w-4 mt-0.5">📍</span>
              <p className="text-gray-300 text-sm">{event.location}</p>
            </div>
          )}

          {/* Description */}
          {description && (
            <div className="flex gap-3">
              <span className="text-gray-500 text-sm w-4 mt-0.5">📝</span>
              <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                {description}
              </p>
            </div>
          )}

          {/* Attendees */}
          {attendees.length > 0 && (
            <div className="flex gap-3">
              <span className="text-gray-500 text-sm w-4 mt-0.5">👥</span>
              <div className="flex-1">
                <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">
                  {attendees.length} attendee{attendees.length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-1.5">
                  {attendees.map((a, i) => {
                    const rsvp = RSVP[a.responseStatus] || RSVP.needsAction;
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${rsvp.dot}`} />
                        <span className="text-gray-300 text-sm truncate">
                          {a.displayName || a.email}
                        </span>
                        <span className="text-gray-600 text-xs ml-auto shrink-0">
                          {rsvp.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Google Meet */}
          {event.hangoutLink && (
            <div className="flex gap-3">
              <span className="text-gray-500 text-sm w-4 mt-0.5">🎥</span>
              <a
                href={event.hangoutLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
              >
                Join Google Meet
              </a>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex items-center gap-2 pt-3 border-t border-gray-800">
            {event.htmlLink && (
              <a
                href={event.htmlLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
              >
                Open in Google Calendar ↗
              </a>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="ml-auto px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-950 disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
            <button
              onClick={() => onEdit(event)}
              className="px-3 py-1.5 rounded-lg text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Week Summary Widget ──────────────────────────────────────────────────────

function WeekSummaryWidget({ events, weekStart, loading, onSelectEvent }) {
  const days = getWeekDays(weekStart);
  const todayStr = toDateStr(new Date());

  const nextEvent = events
    .filter(ev => ev.start.dateTime && new Date(ev.start.dateTime) >= new Date())
    .sort((a, b) => a.start.dateTime.localeCompare(b.start.dateTime))[0];

  const sortedEvents = [...events].sort((a, b) => {
    const aKey = a.start.dateTime || a.start.date;
    const bKey = b.start.dateTime || b.start.date;
    return aKey.localeCompare(bKey);
  });

  return (
    <div className="hidden md:block bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Week at a Glance
        </h2>
        {nextEvent && !loading && (
          <p className="text-sm text-gray-400">
            Next:{' '}
            <span className="text-white font-medium">{nextEvent.summary || '(No title)'}</span>
            <span className="text-gray-500 ml-1">· {formatEventTime(nextEvent)}</span>
          </p>
        )}
      </div>

      {/* Day indicators */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {days.map((day, i) => {
          const isToday = toDateStr(day) === todayStr;
          const count = loading ? 0 : eventsForDay(events, day).length;
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span className={`text-xs font-medium ${isToday ? 'text-blue-400' : 'text-gray-500'}`}>
                {DAY_NAMES[i]}
              </span>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  isToday ? 'bg-blue-600 text-white' : 'text-gray-300'
                }`}
              >
                {day.getDate()}
              </div>
              <div
                className={`w-full h-1.5 rounded-full transition-colors ${
                  loading ? 'bg-gray-800 animate-pulse' : busyBarColor(count)
                }`}
              />
              <span className={`text-xs ${count === 0 || loading ? 'text-gray-700' : 'text-gray-400'}`}>
                {loading || count === 0 ? '–' : `${count}`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Event list */}
      <div className="border-t border-gray-800 pt-4">
        {loading && (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-5 bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        )}
        {!loading && sortedEvents.length === 0 && (
          <p className="text-sm text-gray-600 text-center py-1">No events this week</p>
        )}
        {!loading && sortedEvents.length > 0 && (
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {sortedEvents.map((ev, i) => {
              const start = ev.start.dateTime
                ? new Date(ev.start.dateTime)
                : new Date(ev.start.date + 'T12:00:00');
              return (
                <button
                  key={i}
                  onClick={() => onSelectEvent(ev)}
                  className="w-full flex items-center gap-3 text-sm text-left rounded-lg px-2 py-1 -mx-2 hover:bg-gray-800 transition-colors"
                >
                  <span className="text-gray-500 text-xs w-20 shrink-0">
                    {start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-gray-300 truncate flex-1">{ev.summary || '(No title)'}</span>
                  {ev.start.dateTime && (
                    <span className="text-gray-600 text-xs shrink-0">{formatEventTime(ev)}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────

function EventCard({ event, onSelect }) {
  const isAllDay = !!event.start.date;
  return (
    <button
      onClick={() => onSelect(event)}
      className={`w-full text-left rounded-lg px-2.5 py-2 mb-1.5 text-xs transition-opacity hover:opacity-80 ${
        isAllDay
          ? 'bg-blue-900/30 border border-blue-700/30 text-blue-300'
          : 'bg-gray-800/60 border border-gray-700/40 text-gray-200'
      }`}
    >
      <div className="font-medium truncate">{event.summary || '(No title)'}</div>
      <div className={`mt-0.5 ${isAllDay ? 'text-blue-400/70' : 'text-gray-500'}`}>
        {formatEventTime(event)}
      </div>
    </button>
  );
}

function WeekView({ events, weekStart, loading, onSelectEvent }) {
  const days = getWeekDays(weekStart);
  const todayStr = toDateStr(new Date());

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Phone: one section per day instead of a 7-column grid */}
      <div className="md:hidden divide-y divide-gray-800">
        {days.map((day, i) => {
          const isToday = toDateStr(day) === todayStr;
          const dayEvents = loading ? [] : eventsForDay(events, day);

          return (
            <div key={i} className={`px-4 py-3 ${isToday ? 'bg-blue-950/20' : ''}`}>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-blue-600 text-white' : 'text-gray-300'
                  }`}
                >
                  {day.getDate()}
                </span>
                <span className={`text-xs font-medium ${isToday ? 'text-blue-400' : 'text-gray-500'}`}>
                  {DAY_NAMES[i]}
                </span>
              </div>
              {loading && <div className="h-9 bg-gray-800/50 rounded-lg animate-pulse" />}
              {!loading && dayEvents.length === 0 && (
                <div className="text-xs text-gray-600 pl-9">No events</div>
              )}
              {!loading && dayEvents.map((ev, j) => (
                <EventCard key={j} event={ev} onSelect={onSelectEvent} />
              ))}
            </div>
          );
        })}
      </div>

      {/* Day columns */}
      <div className="hidden md:block overflow-x-auto">
        <div className="grid grid-cols-7 divide-x divide-gray-800 min-w-[600px] min-h-[360px]">
          {days.map((day, i) => {
            const isToday = toDateStr(day) === todayStr;
            const dayEvents = loading ? [] : eventsForDay(events, day);

            return (
              <div key={i} className={isToday ? 'bg-blue-950/20' : ''}>
                {/* Column header */}
                <div
                  className={`px-2 py-3 text-center border-b border-gray-800 ${
                    isToday ? 'bg-blue-950/30' : ''
                  }`}
                >
                  <div
                    className={`text-xs font-medium mb-1 ${
                      isToday ? 'text-blue-400' : 'text-gray-500'
                    }`}
                  >
                    {DAY_NAMES[i]}
                  </div>
                  <div
                    className={`text-lg font-bold mx-auto w-8 h-8 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-blue-600 text-white' : 'text-gray-300'
                    }`}
                  >
                    {day.getDate()}
                  </div>
                </div>

                {/* Events */}
                <div className="p-2">
                  {loading && (
                    <div className={`h-9 bg-gray-800/50 rounded-lg animate-pulse ${i % 3 !== 0 ? 'opacity-0' : ''}`} />
                  )}
                  {!loading && dayEvents.map((ev, j) => (
                    <EventCard key={j} event={ev} onSelect={onSelectEvent} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Day View ─────────────────────────────────────────────────────────────────

function DayView({ events, day, loading, onSelectEvent }) {
  const dayEvents = eventsForDay(events, day)
    .sort((a, b) => (a.start.dateTime || '').localeCompare(b.start.dateTime || ''));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {loading && (
        <div className="p-4 space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-800/50 rounded-lg animate-pulse" />)}
        </div>
      )}
      {!loading && dayEvents.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-10">Nothing scheduled</p>
      )}
      {!loading && dayEvents.length > 0 && (
        <ul className="divide-y divide-gray-800">
          {dayEvents.map((ev) => (
            <li key={ev.id}>
              <button
                onClick={() => onSelectEvent(ev)}
                className="w-full flex gap-4 px-4 py-3.5 text-left hover:bg-gray-800/50 transition-colors"
              >
                <span className={`w-20 shrink-0 text-sm ${ev.start.date ? 'text-blue-300' : 'text-gray-400'}`}>
                  {formatEventTime(ev)}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-gray-100 font-medium truncate">{ev.summary || '(No title)'}</span>
                  {ev.start.dateTime && (
                    <span className="block text-xs text-gray-500">
                      until {new Date(ev.end.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      {ev.location && ` · ${ev.location}`}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Month View ───────────────────────────────────────────────────────────────

function MonthView({ events, anchor, rangeStart, rangeEnd, loading, onSelectDay, onSelectEvent }) {
  const todayStr = toDateStr(new Date());
  const days = [];
  for (let d = new Date(rangeStart); d < rangeEnd; d.setDate(d.getDate() + 1)) days.push(new Date(d));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-800">
        {DAY_NAMES.map((name) => (
          <div key={name} className="py-2 text-center text-xs font-medium text-gray-500">
            <span className="md:hidden">{name[0]}</span>
            <span className="hidden md:inline">{name}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const key = toDateStr(day);
          const inMonth = day.getMonth() === anchor.getMonth();
          const isToday = key === todayStr;
          const dayEvents = loading ? [] : eventsForDay(events, day);
          return (
            <div
              key={key}
              className={`min-h-[56px] md:min-h-[104px] border-gray-800 ${i % 7 ? 'border-l' : ''} ${i >= 7 ? 'border-t' : ''} ${inMonth ? '' : 'bg-gray-950/40'}`}
            >
              {/* Tapping a day opens it in Day view */}
              <button
                onClick={() => onSelectDay(day)}
                className="w-full h-full flex flex-col items-center md:items-stretch p-1 md:p-1.5 text-left hover:bg-gray-800/40 transition-colors"
                aria-label={`${day.toDateString()}: ${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'}`}
              >
                <span
                  className={`text-xs md:text-sm font-semibold w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-blue-600 text-white' : inMonth ? 'text-gray-200' : 'text-gray-600'
                  }`}
                >
                  {day.getDate()}
                </span>
                {/* Phone: dots. Desktop: titles. */}
                {dayEvents.length > 0 && (
                  <span className="md:hidden flex gap-0.5 mt-1">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <span key={ev.id} className={`w-1.5 h-1.5 rounded-full ${ev.start.date ? 'bg-blue-300' : 'bg-gray-400'}`} />
                    ))}
                  </span>
                )}
                <span className="hidden md:block mt-1 space-y-0.5 w-full">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <span
                      key={ev.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); onSelectEvent(ev); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onSelectEvent(ev); } }}
                      className={`block truncate text-xs rounded px-1 py-0.5 ${
                        ev.start.date ? 'bg-blue-900/40 text-blue-200' : 'text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      {ev.start.dateTime && <span className="text-gray-500 mr-1">{formatEventTime(ev).replace(':00', '')}</span>}
                      {ev.summary || '(No title)'}
                    </span>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="block text-xs text-gray-500 px-1">+{dayEvents.length - 3} more</span>
                  )}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

const VIEWS = [['day', 'Day'], ['week', 'Week'], ['month', 'Month']];

function viewTitle(view, anchor, rangeStart) {
  if (view === 'day') return anchor.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  if (view === 'month') return anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return formatWeekRange(rangeStart);
}

function CalendarToolbar({ view, anchor, rangeStart, rangeEnd, onView, onPrev, onNext, onToday }) {
  const now = new Date();
  const showsToday = now >= rangeStart && now < rangeEnd;
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
      <div className="flex items-center gap-2 flex-1">
        <button onClick={onPrev} className="text-gray-400 hover:text-white w-9 h-9 rounded-lg hover:bg-gray-800" aria-label={`Previous ${view}`}>←</button>
        <h2 className="text-white font-semibold text-center flex-1 md:flex-none md:min-w-[200px]">{viewTitle(view, anchor, rangeStart)}</h2>
        <button onClick={onNext} className="text-gray-400 hover:text-white w-9 h-9 rounded-lg hover:bg-gray-800" aria-label={`Next ${view}`}>→</button>
        <button
          onClick={onToday}
          className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
            showsToday ? 'invisible' : 'text-blue-400 bg-blue-900/30 border-blue-700/40 hover:text-blue-300'
          }`}
        >
          Today
        </button>
      </div>
      <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1" role="tablist" aria-label="Calendar view">
        {VIEWS.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={view === id}
            onClick={() => onView(id)}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const VIEW_KEY = 'fh_calendar_view';

function savedView() {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    return VIEWS.some(([id]) => id === v) ? v : 'week';
  } catch {
    return 'week';
  }
}

export default function CalendarPage() {
  const {
    events, loading, error, view, setView, anchor, rangeStart, rangeEnd,
    prev, next, goToToday, goToDay, addEvent, editEvent, removeEvent,
  } = useCalendar(savedView());

  function changeView(v) {
    setView(v);
    try { localStorage.setItem(VIEW_KEY, v); } catch {}
  }
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-5 md:py-8">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h1 className="text-2xl font-bold">Calendar</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <span className="text-base leading-none">+</span> Add Event
          </button>
        </div>
        <CalendarToolbar
          view={view}
          anchor={anchor}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onView={changeView}
          onPrev={prev}
          onNext={next}
          onToday={goToToday}
        />
        {error && (
          <div className="bg-red-900/40 border border-red-800 text-red-300 rounded-xl px-4 py-3 text-sm mb-4">
            Error loading calendar: {error.message}
          </div>
        )}
        {view === 'day' && (
          <DayView events={events} day={anchor} loading={loading} onSelectEvent={setSelectedEvent} />
        )}
        {view === 'week' && (
          <>
            <WeekSummaryWidget
              events={events}
              weekStart={rangeStart}
              loading={loading}
              onSelectEvent={setSelectedEvent}
            />
            <WeekView events={events} weekStart={rangeStart} loading={loading} onSelectEvent={setSelectedEvent} />
          </>
        )}
        {view === 'month' && (
          <MonthView
            events={events}
            anchor={anchor}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            loading={loading}
            onSelectDay={goToDay}
            onSelectEvent={setSelectedEvent}
          />
        )}
      </div>
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={(ev) => { setSelectedEvent(null); setEditingEvent(ev); }}
          onDelete={removeEvent}
        />
      )}
      {showAddModal && (
        <EventFormModal
          defaultDate={view === 'day' ? toDateStr(anchor) : undefined}
          onClose={() => setShowAddModal(false)}
          onSave={addEvent}
        />
      )}
      {editingEvent && (
        <EventFormModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSave={(body) => editEvent(editingEvent.id, body)}
        />
      )}
    </div>
  );
}
