import { useState } from 'react';
import { useNotes } from '../hooks/useTodos';

const PRIORITY_CONFIG = {
  High:   { label: 'High',   color: 'text-red-400',    bg: 'bg-red-900/20 border-red-700/40',      accent: 'border-l-red-500',    pill: 'bg-red-900/30 border-red-700/50 text-red-400' },
  Medium: { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-900/10 border-yellow-700/30', accent: 'border-l-yellow-500', pill: 'bg-yellow-900/20 border-yellow-700/40 text-yellow-400' },
  Low:    { label: 'Low',    color: 'text-gray-400',   bg: 'bg-gray-800/30 border-gray-700/30',    accent: 'border-l-gray-600',   pill: 'bg-gray-800/40 border-gray-700/40 text-gray-400' },
};

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function formatRelativeTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDueDate(isoString) {
  const date = new Date(isoString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(date);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / 86400000);
  if (diff < 0) return { label: `Overdue by ${Math.abs(diff)}d`, overdue: true };
  if (diff === 0) return { label: 'Due today', overdue: false };
  if (diff === 1) return { label: 'Due tomorrow', overdue: false };
  return { label: `Due ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, overdue: false };
}

function getInitials(user) {
  if (!user) return '?';
  if (user.name) return user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (user.username ?? user.email ?? '?')[0].toUpperCase();
}

function UserAvatar({ user, size = 'sm' }) {
  const dim = size === 'sm' ? 'w-5 h-5 text-xs' : 'w-6 h-6 text-xs';
  if (user?.picture) {
    return <img src={user.picture} alt={user.name ?? user.username} className={`${dim} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div className={`${dim} rounded-full flex items-center justify-center font-bold bg-blue-800 text-blue-200 shrink-0`}>
      {getInitials(user)}
    </div>
  );
}

function UserAvatarWithInitials({ user }) {
  return (
    <span className="inline-flex items-center gap-1.5 shrink-0">
      <UserAvatar user={user} size="sm" />
      <span className="text-xs font-semibold text-gray-400">{getInitials(user)}</span>
    </span>
  );
}

function displayName(user) {
  return user?.name ?? user?.username ?? user?.email ?? null;
}

function CompletionTracker({ notes }) {
  const completed = notes.filter((n) => n.completedAt && n.completedBy);
  if (completed.length === 0) return null;

  const byUser = {};
  completed.forEach((n) => {
    const uid = n.completedBy.userId ?? n.completedBy.username;
    if (!byUser[uid]) byUser[uid] = { user: n.completedBy, count: 0 };
    byUser[uid].count++;
  });

  const ranked = Object.values(byUser).sort((a, b) => b.count - a.count);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Completion Tracker</h2>
      <div className="flex flex-col gap-2">
        {ranked.map(({ user, count }) => {
          const uid = user.userId ?? user.username;
          const pct = Math.round((count / completed.length) * 100);
          return (
            <div key={uid} className="flex items-center gap-3">
              <UserAvatarWithInitials user={user} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-300 font-medium truncate">{displayName(user)}</span>
                  <span className="text-xs font-bold text-green-400 ml-2 shrink-0">{count} done</span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PrioritySummary({ notes }) {
  const active = notes.filter((n) => !n.completedAt);
  if (active.length === 0) return null;
  const counts = { High: 0, Medium: 0, Low: 0 };
  active.forEach((n) => { if (counts[n.priority] !== undefined) counts[n.priority]++; });
  return (
    <div className="flex gap-2 mb-6 flex-wrap">
      {Object.entries(counts).map(([p, count]) => {
        if (count === 0) return null;
        const cfg = PRIORITY_CONFIG[p];
        return (
          <span key={p} className={`text-xs font-semibold px-3 py-1 rounded-full border ${cfg.pill}`}>
            {count} {cfg.label}
          </span>
        );
      })}
    </div>
  );
}


function NoteCard({ note, onComplete, onUndo }) {
  const completed = !!note.completedAt;
  const priority = PRIORITY_CONFIG[note.priority] ?? PRIORITY_CONFIG.Medium;
  const due = !completed && note.dueDate ? formatDueDate(note.dueDate) : null;

  return (
    <div
      className={`rounded-xl border-l-4 shadow-lg transition-all ${
        completed
          ? 'bg-gray-900 border border-gray-800 border-l-gray-700 shadow-black/20 opacity-50'
          : `bg-gray-900 border border-gray-800 ${priority.accent} shadow-black/40 hover:shadow-xl hover:shadow-black/50 hover:-translate-y-0.5`
      }`}
    >
      <div className="flex items-start gap-4 p-5">
        <button
          onClick={() => (completed ? onUndo(note._id) : onComplete(note._id))}
          className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
            completed
              ? 'bg-green-600 border-green-600 text-white'
              : 'border-gray-600 hover:border-green-500 hover:bg-green-900/20'
          }`}
          aria-label={completed ? 'Re-open' : 'Mark complete'}
        >
          {completed && <CheckIcon />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold leading-snug ${completed ? 'line-through text-gray-500' : 'text-white'}`}>
            {note.text}
          </p>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <UserAvatar user={note.createdBy} />
            <span className="text-xs text-gray-500">{displayName(note.createdBy)}</span>
            <span className="text-gray-700">·</span>
            <span className="text-xs text-gray-500">{formatRelativeTime(note.createdAt)}</span>

            {!completed && (
              <>
                {due && (
                  <span className={`text-xs font-medium ${due.overdue ? 'text-red-400' : 'text-gray-500'}`}>
                    · {due.label}
                  </span>
                )}
                <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full border ${priority.bg} ${priority.color}`}>
                  {priority.label}
                </span>
              </>
            )}

            {completed && note.completedAt && note.completedBy && (
              <>
                <span className="text-gray-700">·</span>
                <UserAvatarWithInitials user={note.completedBy} />
                <span className="text-xs text-green-700">
                  {formatRelativeTime(note.completedAt)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddNoteModal({ onClose, onAdd, userName }) {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    try {
      await onAdd({ text: text.trim(), priority, dueDate: dueDate || null });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-800">
          <h2 className="text-white font-bold">New To-Do</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors" aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          <input
            autoFocus
            type="text"
            placeholder="What needs to be done?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />

          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">Priority</p>
            <div className="flex gap-2">
              {['Low', 'Medium', 'High'].map((p) => {
                const cfg = PRIORITY_CONFIG[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                      priority === p
                        ? `${cfg.bg} ${cfg.color}`
                        : 'bg-gray-800 text-gray-500 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">Complete by (optional)</p>
            <input
              type="date"
              min={today}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
            />
          </div>

          {userName && <p className="text-xs text-gray-600">Adding as {userName}</p>}

          <button
            type="submit"
            disabled={!text.trim() || saving}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {saving ? 'Adding…' : 'Add To-Do'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function MessagesPage({ user }) {
  const { notes, loading, error, add, update } = useNotes(user?.jwt_token);
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const activeNotes = notes.filter((n) => !n.completedAt);
  const completedNotes = notes.filter((n) => !!n.completedAt);

  const cutoff = Date.now() - ONE_WEEK_MS;
  const recentCompleted = completedNotes.filter((n) => new Date(n.completedAt).getTime() >= cutoff);
  const historicalCompleted = completedNotes.filter((n) => new Date(n.completedAt).getTime() < cutoff);

  async function handleComplete(id) {
    await update(id, { completed: true });
  }

  async function handleUndo(id) {
    await update(id, { completed: false });
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">To-Do</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading
              ? 'Loading…'
              : activeNotes.length === 0
              ? 'All caught up'
              : `${activeNotes.length} item${activeNotes.length !== 1 ? 's' : ''} remaining`}
          </p>
        </div>

        {!loading && <PrioritySummary notes={notes} />}
        {!loading && <CompletionTracker notes={notes} />}

        {error && (
          <div className="bg-red-950 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {!loading && !error && activeNotes.length === 0 && completedNotes.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm">No to-dos yet. Hit + to add one.</p>
          </div>
        )}

        {!loading && !error && activeNotes.length === 0 && completedNotes.length > 0 && (
          <div className="text-center py-10 text-gray-600">
            <div className="text-3xl mb-2">✓</div>
            <p className="text-sm">All caught up!</p>
          </div>
        )}

        <div className="space-y-3">
          {activeNotes.map((note) => (
            <NoteCard key={note._id} note={note} onComplete={handleComplete} onUndo={handleUndo} />
          ))}
        </div>

        {recentCompleted.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-3">
              Completed · {recentCompleted.length}
            </h2>
            <div className="space-y-2">
              {recentCompleted.map((note) => (
                <NoteCard key={note._id} note={note} onComplete={handleComplete} onUndo={handleUndo} />
              ))}
            </div>
          </div>
        )}

        {historicalCompleted.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-widest hover:text-gray-400 transition-colors w-full mb-3"
            >
              <span>{showHistory ? '▾' : '▸'}</span>
              <span>History · {historicalCompleted.length}</span>
            </button>
            {showHistory && (
              <div className="space-y-2">
                {historicalCompleted.map((note) => (
                  <NoteCard key={note._id} note={note} onComplete={handleComplete} onUndo={handleUndo} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-[calc(5rem_+_env(safe-area-inset-bottom))] md:bottom-6 right-4 md:right-6 w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-xl flex items-center justify-center text-2xl font-light transition-all hover:scale-105 active:scale-95"
        aria-label="Add to-do"
      >
        +
      </button>

      {showModal && (
        <AddNoteModal
          onClose={() => setShowModal(false)}
          onAdd={add}
          userName={user?.name?.split(' ')[0]}
        />
      )}
    </div>
  );
}
