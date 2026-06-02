import { useState, useEffect, useCallback } from 'react';
import { fetchWeekEvents } from '../services/calendarService';

function getWeekStart(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay()); // back to Sunday
  d.setHours(0, 0, 0, 0);
  return d;
}

export function useCalendar(accessToken) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    fetchWeekEvents(accessToken, weekStart)
      .then(setEvents)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [accessToken, weekStart]);

  const prevWeek = useCallback(
    () => setWeekStart(d => new Date(d.getTime() - 7 * 86400000)),
    []
  );
  const nextWeek = useCallback(
    () => setWeekStart(d => new Date(d.getTime() + 7 * 86400000)),
    []
  );
  const goToToday = useCallback(() => setWeekStart(getWeekStart(new Date())), []);

  return { events, loading, error, weekStart, prevWeek, nextWeek, goToToday };
}
