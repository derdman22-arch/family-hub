import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTodos } from '../hooks/useTodos';
import { useCalendar } from '../hooks/useCalendar';
import { useLiveRefresh } from '../hooks/useLiveRefresh';
import { fetchTodoStats } from '../services/todosService';
import { toDateStr, addDays, todayStr, dueKey, daysUntil, dueInfo, DUE_TONE_CLASS, sortOpenTodos } from '../utils/dates';

// Each person keeps the same color everywhere (validated for contrast and
// color-blind separation on the dark card background)
const PERSON_COLORS = ['#3B82F6', '#D97706'];
const OTHER_COLOR = '#6B7280';

function firstName(user) {
  return (user?.name || user?.email || '?').split(' ')[0];
}

function formatDuration(ms) {
  const hours = ms / 3600000;
  if (hours < 1) return 'under an hour';
  if (hours < 36) return `${Math.round(hours)} hour${Math.round(hours) === 1 ? '' : 's'}`;
  return `${Math.round(hours / 24)} days`;
}

function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function useTodoStats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const load = useCallback(() => {
    fetchTodoStats().then(setStats).catch((err) => setError(err.message));
  }, []);
  useEffect(() => { load(); }, [load]);
  useLiveRefresh(load);
  return { stats, error, reload: load };
}

function Card({ title, action, children }) {
  return (
    <section className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Tile({ label, value, tone }) {
  return (
    <Link to="/" className="flex-1 bg-gray-800/60 rounded-xl px-3 py-3 text-center active:bg-gray-800">
      <div className={`text-2xl font-bold ${value > 0 ? tone : 'text-gray-500'}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </Link>
  );
}

function PersonDot({ color }) {
  return <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />;
}

// Stacked bars: completions per day for the last 14 days, one color per person.
// Tapping a day shows its breakdown underneath (works on touch, unlike hover).
function CompletionsChart({ days, people, colorOf }) {
  const [selected, setSelected] = useState(days.length - 1);
  const max = Math.max(1, ...days.map((d) => d.total));
  const day = days[selected];

  return (
    <div>
      <div className="flex items-end gap-1 h-28 border-b border-gray-800" role="list" aria-label="To-dos completed per day, last 14 days">
        {days.map((d, i) => (
          <button
            key={d.key}
            role="listitem"
            onClick={() => setSelected(i)}
            aria-label={`${d.label}: ${d.total} completed`}
            className={`flex-1 h-full flex flex-col-reverse gap-[2px] rounded-t ${i === selected ? 'bg-gray-800/60' : ''}`}
          >
            {people.map((p) => {
              const n = d.byPerson[p.id] || 0;
              if (!n) return null;
              return (
                <div
                  key={p.id}
                  className="w-full last:rounded-t"
                  style={{ height: `${(n / max) * 100}%`, background: colorOf(p.id), minHeight: 3 }}
                />
              );
            })}
          </button>
        ))}
      </div>
      <div className="flex gap-1 mt-1">
        {days.map((d, i) => (
          <div
            key={d.key}
            className={`flex-1 text-center text-[11px] ${d.isToday ? 'text-white font-semibold' : i === selected ? 'text-gray-300' : 'text-gray-600'}`}
          >
            {d.initial}
          </div>
        ))}
      </div>
      <div className="mt-3 text-sm text-gray-300 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-gray-400">{day.label}:</span>
        {day.total === 0 && <span className="text-gray-500">nothing completed</span>}
        {people.map((p) => (day.byPerson[p.id] ? (
          <span key={p.id} className="inline-flex items-center gap-1.5">
            <PersonDot color={colorOf(p.id)} />{firstName(p)} {day.byPerson[p.id]}
          </span>
        ) : null))}
      </div>
    </div>
  );
}

export default function OverviewPage({ me, users }) {
  const { todos, loading, update } = useTodos(me.id);
  const { events, loading: calLoading, error: calError } = useCalendar();
  const { stats, error: statsError, reload: reloadStats } = useTodoStats();
  const people = users.length ? users : [me];
  const colorOf = (id) => {
    const i = people.findIndex((p) => p.id === id);
    return PERSON_COLORS[i] || OTHER_COLOR;
  };
  const nameOf = (id) => firstName(people.find((p) => p.id === id));

  // ── Needs attention ──
  const open = todos.filter((t) => !t.completedAt);
  const overdue = open.filter((t) => daysUntil(t.dueDate) < 0);
  const dueToday = open.filter((t) => daysUntil(t.dueDate) === 0);
  const dueThisWeek = open.filter((t) => { const d = daysUntil(t.dueDate); return d !== null && d >= 0 && d < 7; });
  const urgent = sortOpenTodos([...overdue, ...dueToday]);

  async function complete(todo) {
    await update(todo._id, { completed: true });
    reloadStats();
  }

  // ── Today's calendar ──
  const today = todayStr();
  const todaysEvents = events
    .filter((ev) => (ev.start.date ? ev.start.date <= today && ev.end.date > today : toDateStr(new Date(ev.start.dateTime)) === today))
    .sort((a, b) => (a.start.dateTime || '').localeCompare(b.start.dateTime || ''));

  // ── Done together ──
  const now = new Date();
  const weekStart = toDateStr(addDays(now, -now.getDay()));
  const lastWeekStart = toDateStr(addDays(now, -now.getDay() - 7));
  const completions = (stats?.completions || []).map((c) => ({ ...c, day: toDateStr(new Date(c.completedAt)) }));
  const thisWeek = completions.filter((c) => c.day >= weekStart);
  const lastWeek = completions.filter((c) => c.day >= lastWeekStart && c.day < weekStart);
  const countBy = (list, id) => list.filter((c) => c.completedBy === id).length;

  const days = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(now, i - 13);
    const key = toDateStr(date);
    const onDay = completions.filter((c) => c.day === key);
    return {
      key,
      isToday: key === today,
      initial: date.toLocaleDateString('en-US', { weekday: 'narrow' }),
      label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      total: onDay.length,
      byPerson: Object.fromEntries(people.map((p) => [p.id, countBy(onDay, p.id)])),
    };
  });

  const monthAgo = toDateStr(addDays(now, -30));
  const lastMonth = completions.filter((c) => c.day >= monthAgo);
  const dated = lastMonth.filter((c) => c.dueDate);
  const onTime = dated.filter((c) => c.day <= dueKey(c.dueDate)).length;
  const typicalFinish = median(lastMonth.map((c) => new Date(c.completedAt) - new Date(c.createdAt)));

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-5">
        <h1 className="text-xl font-bold mb-4">
          {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h1>

        <Card title="Needs attention">
          <div className="flex gap-2 mb-3">
            <Tile label="Overdue" value={overdue.length} tone="text-red-400" />
            <Tile label="Due today" value={dueToday.length} tone="text-amber-400" />
            <Tile label="Next 7 days" value={dueThisWeek.length} tone="text-blue-300" />
          </div>
          {loading ? (
            <div className="h-10 bg-gray-800/50 rounded-lg animate-pulse" />
          ) : urgent.length === 0 ? (
            <p className="text-sm text-gray-500">Nothing overdue or due today.</p>
          ) : (
            <ul className="divide-y divide-gray-800">
              {urgent.map((t) => {
                const due = dueInfo(t.dueDate);
                return (
                  <li key={t._id} className="flex items-center gap-3 py-2.5">
                    <button
                      onClick={() => complete(t)}
                      className="w-6 h-6 shrink-0 rounded-full border-2 border-gray-600 hover:border-green-500"
                      aria-label={`Mark "${t.text}" done`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-100 truncate">{t.text}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1.5">
                        <PersonDot color={colorOf(t.assignedTo)} />
                        {nameOf(t.assignedTo)} · <span className={DUE_TONE_CLASS[due.tone]}>{due.label}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="On the calendar today" action={<Link to="/calendar" className="text-xs text-blue-400">Week →</Link>}>
          {calLoading ? (
            <div className="h-10 bg-gray-800/50 rounded-lg animate-pulse" />
          ) : calError ? (
            <p className="text-sm text-gray-500">Calendar unavailable right now.</p>
          ) : todaysEvents.length === 0 ? (
            <p className="text-sm text-gray-500">Nothing scheduled today.</p>
          ) : (
            <ul className="space-y-2">
              {todaysEvents.map((ev) => (
                <li key={ev.id} className="flex gap-3 text-sm">
                  <span className="w-16 shrink-0 text-gray-400">
                    {ev.start.dateTime
                      ? new Date(ev.start.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                      : 'All day'}
                  </span>
                  <span className="text-gray-100 truncate">{ev.summary || '(No title)'}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Done together">
          {statsError ? (
            <p className="text-sm text-gray-500">{statsError}</p>
          ) : !stats ? (
            <div className="h-40 bg-gray-800/50 rounded-lg animate-pulse" />
          ) : (
            <>
              <div className="flex items-end justify-between mb-1">
                <div>
                  <div className="text-3xl font-bold">{thisWeek.length}</div>
                  <div className="text-xs text-gray-400">
                    this week{lastWeek.length > 0 && ` · ${lastWeek.length} last week`}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  {people.map((p) => (
                    <div key={p.id} className="flex items-center justify-end gap-1.5 text-sm text-gray-300">
                      <PersonDot color={colorOf(p.id)} />
                      {firstName(p)} <span className="text-white font-semibold w-5 text-right">{countBy(thisWeek, p.id)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <CompletionsChart days={days} people={people} colorOf={colorOf} />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-gray-800/60 rounded-xl px-3 py-2.5">
                  <div className="text-lg font-semibold">
                    {dated.length ? `${Math.round((onTime / dated.length) * 100)}%` : '–'}
                  </div>
                  <div className="text-xs text-gray-400">done by the due date (30 days)</div>
                </div>
                <div className="bg-gray-800/60 rounded-xl px-3 py-2.5">
                  <div className="text-lg font-semibold">{typicalFinish === null ? '–' : formatDuration(typicalFinish)}</div>
                  <div className="text-xs text-gray-400">typical time to finish</div>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-3">
                All time:{' '}
                {people.map((p, i) => `${i ? ' · ' : ''}${firstName(p)} ${stats.totals[p.id] || 0}`)}
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
