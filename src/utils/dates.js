// Local calendar-day helpers. Due dates travel as "YYYY-MM-DD" (the server
// stores them at noon UTC), so comparing day strings avoids timezone drift.

export function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function todayStr() {
  return toDateStr(new Date());
}

// "2026-11-05" from either "2026-11-05" or "2026-11-05T12:00:00.000Z"
export function dueKey(dueDate) {
  return dueDate ? String(dueDate).slice(0, 10) : null;
}

export function daysUntil(dueDate) {
  const key = dueKey(dueDate);
  if (!key) return null;
  return Math.round((new Date(`${key}T12:00:00`) - new Date(`${todayStr()}T12:00:00`)) / 86400000);
}

// Label and tone for an open to-do's due date
export function dueInfo(dueDate) {
  const days = daysUntil(dueDate);
  if (days === null) return null;
  if (days < 0) return { label: days === -1 ? 'Overdue · yesterday' : `Overdue · ${-days} days`, tone: 'overdue' };
  if (days === 0) return { label: 'Due today', tone: 'today' };
  if (days === 1) return { label: 'Due tomorrow', tone: 'soon' };
  const date = new Date(`${dueKey(dueDate)}T12:00:00`);
  const opts = days < 7 ? { weekday: 'long' } : { month: 'short', day: 'numeric' };
  return { label: `Due ${date.toLocaleDateString('en-US', opts)}`, tone: days < 7 ? 'soon' : 'later' };
}

export const DUE_TONE_CLASS = {
  overdue: 'text-red-400',
  today: 'text-amber-400',
  soon: 'text-blue-300',
  later: 'text-gray-400',
};

// Open to-dos: dated ones first (soonest/overdue on top), then undated newest first
export function sortOpenTodos(todos) {
  return [...todos].sort((a, b) => {
    const da = dueKey(a.dueDate);
    const db = dueKey(b.dueDate);
    if (da && db) return da.localeCompare(db);
    if (da) return -1;
    if (db) return 1;
    return String(b.createdAt).localeCompare(String(a.createdAt));
  });
}
