import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchEvents, createEvent, updateEvent, deleteEvent } from '../services/calendarService';
import { addDays } from '../utils/dates';
import { useLiveRefresh } from './useLiveRefresh';

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekStart(date) {
  return addDays(startOfDay(date), -date.getDay()); // back to Sunday
}

// The span of time each view shows. Month covers whole weeks so the grid is full.
function getRange(view, anchor) {
  if (view === 'day') return { start: anchor, end: addDays(anchor, 1) };
  if (view === 'month') {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    return { start: getWeekStart(first), end: addDays(getWeekStart(last), 7) };
  }
  const start = getWeekStart(anchor);
  return { start, end: addDays(start, 7) };
}

// view: 'day' | 'week' | 'month'. anchor: any date inside the period shown.
export function useCalendar(initialView = 'week') {
  const [view, setView] = useState(initialView);
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { start, end } = useMemo(() => getRange(view, anchor), [view, anchor]);
  const startKey = start.getTime();
  const endKey = end.getTime();

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchEvents(new Date(startKey), new Date(endKey))
      .then(setEvents)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [startKey, endKey]);

  useEffect(() => { refetch(); }, [refetch]);
  useLiveRefresh(refetch);

  const step = useCallback((dir) => setAnchor((d) => {
    if (view === 'day') return addDays(d, dir);
    if (view === 'month') return new Date(d.getFullYear(), d.getMonth() + dir, 1);
    return addDays(d, 7 * dir);
  }), [view]);
  const prev = useCallback(() => step(-1), [step]);
  const next = useCallback(() => step(1), [step]);
  const goToToday = useCallback(() => setAnchor(startOfDay(new Date())), []);
  const goToDay = useCallback((date) => { setAnchor(startOfDay(date)); setView('day'); }, []);

  const addEvent = useCallback(async (eventBody) => {
    await createEvent(eventBody);
    refetch();
  }, [refetch]);

  const editEvent = useCallback(async (id, eventBody) => {
    await updateEvent(id, eventBody);
    refetch();
  }, [refetch]);

  const removeEvent = useCallback(async (id) => {
    await deleteEvent(id);
    refetch();
  }, [refetch]);

  return {
    events, loading, error, view, setView, anchor, rangeStart: start, rangeEnd: end,
    prev, next, goToToday, goToDay, addEvent, editEvent, removeEvent,
  };
}
