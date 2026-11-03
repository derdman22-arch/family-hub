import { useState, useEffect, useCallback } from 'react';
import { fetchEvents, createEvent, updateEvent, deleteEvent } from '../services/calendarService';
import { useLiveRefresh } from './useLiveRefresh';

function getWeekStart(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay()); // back to Sunday
  d.setHours(0, 0, 0, 0);
  return d;
}

// Calendar-day arithmetic, so weeks stay aligned across daylight-saving changes
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function useCalendar() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    const weekEnd = addDays(weekStart, 7);
    fetchEvents(weekStart, weekEnd)
      .then(setEvents)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [weekStart]);

  useEffect(() => { refetch(); }, [refetch]);
  useLiveRefresh(refetch);

  const prevWeek = useCallback(() => setWeekStart(d => addDays(d, -7)), []);
  const nextWeek = useCallback(() => setWeekStart(d => addDays(d, 7)), []);
  const goToToday = useCallback(() => setWeekStart(getWeekStart(new Date())), []);

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

  return { events, loading, error, weekStart, prevWeek, nextWeek, goToToday, addEvent, editEvent, removeEvent };
}
