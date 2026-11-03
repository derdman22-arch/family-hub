import { useState } from 'react';
import { useTodos } from '../hooks/useTodos';
import NotificationsBanner from '../components/NotificationsBanner';
import {
  toDateStr, addDays, todayStr, dueKey, dueInfo, DUE_TONE_CLASS, sortOpenTodos,
} from '../utils/dates';

function firstName(user) {
  return (user?.name || user?.email || '?').split(' ')[0];
}

function timeAgo(isoString) {
  const mins = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const chipClass = (active) => `px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
  active ? 'bg-blue-600 border-blue-500 text-white' : 'border-gray-700 text-gray-400 hover:text-white'
}`;

function PersonChips({ people, value, onChange, me }) {
  return (
    <div className="flex gap-1.5">
      {people.map((p) => (
        <button key={p.id} type="button" onClick={() => onChange(p.id)} className={chipClass(value === p.id)}>
          {p.id === me.id ? 'Me' : firstName(p)}
        </button>
      ))}
    </div>
  );
}

// Quick picks for a complete-by date, plus a full date picker
function DueDatePicker({ value, onChange }) {
  const today = todayStr();
  const tomorrow = toDateStr(addDays(new Date(), 1));
  const custom = value && value !== today && value !== tomorrow;
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button type="button" onClick={() => onChange(today)} className={chipClass(value === today)}>Today</button>
      <button type="button" onClick={() => onChange(tomorrow)} className={chipClass(value === tomorrow)}>Tomorrow</button>
      {/* The native date input sits invisibly on top so a tap opens the iOS picker */}
      <label className={`${chipClass(custom)} relative cursor-pointer`}>
        {custom ? new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Pick date'}
        <input
          type="date"
          aria-label="Pick a complete-by date"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          value={value || ''}
          min={today}
          onChange={(e) => onChange(e.target.value || null)}
        />
      </label>
      {value && (
        <button type="button" onClick={() => onChange(null)} className="text-xs text-gray-500 hover:text-gray-300 px-1">
          No date
        </button>
      )}
    </div>
  );
}

function TodoItem({ todo, me, people, showOwner, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(todo.text);
  const done = !!todo.completedAt;
  const owner = people.find((p) => p.id === todo.assignedTo);
  const fromSomeoneElse = todo.createdBy?.userId && todo.createdBy.userId !== todo.assignedTo;
  const due = !done && dueInfo(todo.dueDate);

  function save(e) {
    e.preventDefault();
    if (text.trim() && text.trim() !== todo.text) onUpdate(todo._id, { text: text.trim() });
    setEditing(false);
  }

  const meta = done
    ? `Done${todo.completedBy?.name ? ` by ${firstName(todo.completedBy)}` : ''} · ${timeAgo(todo.completedAt)}`
    : [
        showOwner && owner && (owner.id === me.id ? 'Mine' : `${firstName(owner)}'s`),
        fromSomeoneElse && `from ${firstName(todo.createdBy)}`,
        timeAgo(todo.createdAt),
      ].filter(Boolean).join(' · ');

  if (editing) {
    return (
      <form onSubmit={save} className="bg-gray-900 border border-blue-700/50 rounded-xl p-3 space-y-3">
        <input
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />
        <div className="flex items-center gap-2 text-xs text-gray-500">
          Complete by
          <DueDatePicker value={dueKey(todo.dueDate)} onChange={(d) => onUpdate(todo._id, { dueDate: d })} />
        </div>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {people.length > 1 ? (
            <PersonChips
              people={people}
              me={me}
              value={todo.assignedTo}
              onChange={(id) => onUpdate(todo._id, { assignedTo: id })}
            />
          ) : <span />}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { if (window.confirm('Delete this to-do?')) onRemove(todo._id); }}
              className="px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-950"
            >
              Delete
            </button>
            <button type="submit" className="px-3 py-1.5 rounded-lg text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium">
              Done
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div className={`flex items-start gap-3 bg-gray-900 border rounded-xl px-3 py-3 ${
      due?.tone === 'overdue' ? 'border-red-900/70' : 'border-gray-800'
    }`}>
      <button
        onClick={() => onUpdate(todo._id, { completed: !done })}
        className={`mt-0.5 w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
          done ? 'bg-green-600 border-green-600 text-white' : 'border-gray-600 hover:border-blue-400'
        }`}
        aria-label={done ? 'Mark not done' : 'Mark done'}
      >
        {done && <span className="text-xs leading-none">✓</span>}
      </button>
      <button onClick={() => { setText(todo.text); setEditing(true); }} className="flex-1 min-w-0 text-left">
        <div className={`break-words ${done ? 'text-gray-500 line-through' : 'text-gray-100'}`}>{todo.text}</div>
        <div className="text-xs text-gray-500 mt-0.5">
          {due && <span className={`font-medium ${DUE_TONE_CLASS[due.tone]}`}>{due.label}{meta && ' · '}</span>}
          {meta}
        </div>
      </button>
    </div>
  );
}

export default function TodosPage({ me, users }) {
  const { todos, loading, error, add, update, remove } = useTodos(me.id);
  // Me first, then everyone else
  const people = [users.find((u) => u.id === me.id) || me, ...users.filter((u) => u.id !== me.id)];
  const [view, setView] = useState(me.id); // a user id, or 'all'
  const [text, setText] = useState('');
  const [assignee, setAssignee] = useState(me.id);
  const [dueDate, setDueDate] = useState(null);
  const [showDate, setShowDate] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);
  const [showDone, setShowDone] = useState(false);

  function changeView(v) {
    setView(v);
    setAssignee(v === 'all' ? me.id : v);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      await add(text.trim(), assignee, dueDate);
      setText('');
      // Back to a quick, undated add for the next one
      setDueDate(null);
      setShowDate(false);
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  }

  const inView = todos.filter((t) => view === 'all' || t.assignedTo === view);
  const open = sortOpenTodos(inView.filter((t) => !t.completedAt));
  const done = inView
    .filter((t) => t.completedAt)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  const openCount = (id) => todos.filter((t) => !t.completedAt && t.assignedTo === id).length;

  const tabs = [
    ...people.map((p) => ({ id: p.id, label: p.id === me.id ? 'Mine' : firstName(p), count: openCount(p.id) })),
    ...(people.length > 1 ? [{ id: 'all', label: 'All', count: todos.filter((t) => !t.completedAt).length }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-5">
        <NotificationsBanner />

        <form onSubmit={handleAdd} className="mb-4">
          <div className="flex gap-2">
            <input
              className="flex-1 min-w-0 bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 placeholder-gray-500"
              placeholder="Add a to-do…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              enterKeyHint="done"
            />
            <button
              type="submit"
              disabled={adding || !text.trim()}
              className="shrink-0 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium px-4 rounded-xl"
            >
              Add
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 flex-wrap">
            {people.length > 1 && (
              <>
                For
                <PersonChips people={people} me={me} value={assignee} onChange={setAssignee} />
              </>
            )}
            {!showDate && (
              <button type="button" onClick={() => setShowDate(true)} className={`${chipClass(false)} ml-auto`}>
                + Complete by
              </button>
            )}
          </div>
          {showDate && (
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              Complete by
              <DueDatePicker
                value={dueDate}
                onChange={(d) => { setDueDate(d); if (!d) setShowDate(false); }}
              />
            </div>
          )}
          {addError && <p className="text-red-400 text-sm mt-2">{addError}</p>}
        </form>

        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => changeView(t.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === t.id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t.label}{t.count > 0 && <span className="ml-1 text-gray-400">{t.count}</span>}
            </button>
          ))}
        </div>

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-900 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <>
            {open.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-8">Nothing to do here 🎉</p>
            )}
            <div className="space-y-2">
              {open.map((t) => (
                <TodoItem
                  key={t._id}
                  todo={t}
                  me={me}
                  people={people}
                  showOwner={view === 'all'}
                  onUpdate={update}
                  onRemove={remove}
                />
              ))}
            </div>

            {done.length > 0 && (
              <div className="mt-6">
                <button
                  onClick={() => setShowDone((s) => !s)}
                  className="text-sm text-gray-500 hover:text-gray-300 mb-2"
                >
                  {showDone ? '▾' : '▸'} Completed ({done.length})
                </button>
                {showDone && (
                  <div className="space-y-2">
                    {done.map((t) => (
                      <TodoItem
                        key={t._id}
                        todo={t}
                        me={me}
                        people={people}
                        showOwner={view === 'all'}
                        onUpdate={update}
                        onRemove={remove}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
