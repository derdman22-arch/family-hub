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
  return events.filter(ev => eventDateStr(ev) === dateStr);
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

// ─── Event Detail Modal ───────────────────────────────────────────────────────

function EventDetailModal({ event, onClose }) {
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

          {/* Open in Google Calendar */}
          {event.htmlLink && (
            <div className="pt-2 border-t border-gray-800">
              <a
                href={event.htmlLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
              >
                Open in Google Calendar ↗
              </a>
            </div>
          )}
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
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-5">
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

function WeekView({ events, weekStart, loading, error, onPrev, onNext, onToday, onSelectEvent }) {
  const days = getWeekDays(weekStart);
  const todayStr = toDateStr(new Date());
  const isCurrentWeek = days.some(d => toDateStr(d) === todayStr);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Navigation */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <button
          onClick={onPrev}
          className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          aria-label="Previous week"
        >
          ←
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-white font-semibold">{formatWeekRange(weekStart)}</h2>
          {!isCurrentWeek && (
            <button
              onClick={onToday}
              className="text-xs text-blue-400 hover:text-blue-300 bg-blue-900/30 border border-blue-700/40 px-2.5 py-1 rounded-lg transition-colors"
            >
              Today
            </button>
          )}
        </div>
        <button
          onClick={onNext}
          className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          aria-label="Next week"
        >
          →
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-900/40 border-b border-red-800 text-red-300 px-5 py-3 text-sm">
          {error.code === 'AUTH_EXPIRED' || error.code === 'PERMISSION_DENIED'
            ? error.message
            : `Error loading calendar: ${error.message}`}
        </div>
      )}

      {/* Day columns */}
      <div className="overflow-x-auto">
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CalendarPage({ accessToken }) {
  const { events, loading, error, weekStart, prevWeek, nextWeek, goToToday } =
    useCalendar(accessToken);
  const [selectedEvent, setSelectedEvent] = useState(null);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Calendar</h1>
        <WeekSummaryWidget
          events={events}
          weekStart={weekStart}
          loading={loading}
          onSelectEvent={setSelectedEvent}
        />
        <WeekView
          events={events}
          weekStart={weekStart}
          loading={loading}
          error={error}
          onPrev={prevWeek}
          onNext={nextWeek}
          onToday={goToToday}
          onSelectEvent={setSelectedEvent}
        />
      </div>
      {selectedEvent && (
        <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
