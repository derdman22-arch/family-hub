import { useState } from 'react';

// Mock data — will be replaced by MongoDB API calls
const INITIAL_TODOS = [
  {
    _id: '1',
    text: 'Buy groceries for the week',
    note: 'Milk, eggs, bread, butter, and vegetables',
    priority: 'high',
    completed: false,
    completedAt: null,
    completedBy: null,
    createdBy: { name: 'Dan', initials: 'D' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    _id: '2',
    text: 'Schedule dentist appointment for the kids',
    note: '',
    priority: 'medium',
    completed: false,
    completedAt: null,
    completedBy: null,
    createdBy: { name: 'Jaclyn', initials: 'D' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    _id: '3',
    text: 'Pay electric bill',
    note: 'Due by the 15th',
    priority: 'high',
    completed: false,
    completedAt: null,
    completedBy: null,
    createdBy: { name: 'Dan', initials: 'D' },
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    _id: '4',
    text: 'Research summer camps',
    note: 'Look into YMCA and art camp options',
    priority: 'low',
    completed: true,
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    completedBy: { name: 'Dan', initials: 'DE' },
    createdBy: { name: 'Jaclyn', initials: 'JE' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

const PRIORITY_CONFIG = {
  high:   { label: 'High',   color: 'text-red-400',    bg: 'bg-red-900/20 border-red-700/40',     accent: 'border-l-red-500' },
  medium: { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-900/10 border-yellow-700/30', accent: 'border-l-yellow-500' },
  low:    { label: 'Low',    color: 'text-gray-400',   bg: 'bg-gray-800/30 border-gray-700/30',   accent: 'border-l-gray-600' },
};

function formatRelativeTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function CheckIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TodoCard({ todo, onComplete, onUndo }) {
  const priority = PRIORITY_CONFIG[todo.priority];

  return (
    <div
      className={`rounded-xl border-l-4 shadow-lg transition-all ${
        todo.completed
          ? 'bg-gray-900 border border-gray-800 border-l-gray-700 shadow-black/20 opacity-50'
          : `bg-gray-900 border border-gray-800 ${priority.accent} shadow-black/40 hover:shadow-xl hover:shadow-black/50 hover:-translate-y-0.5`
      }`}
    >
      <div className="flex items-start gap-4 p-5">
        <button
          onClick={() => (todo.completed ? onUndo(todo._id) : onComplete(todo._id))}
          className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
            todo.completed
              ? 'bg-green-600 border-green-600 text-white'
              : 'border-gray-600 hover:border-green-500 hover:bg-green-900/20'
          }`}
          aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
        >
          {todo.completed && <CheckIcon />}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold leading-snug ${
              todo.completed ? 'line-through text-gray-500' : 'text-white'
            }`}
          >
            {todo.text}
          </p>
          {todo.note && (
            <p className={`text-xs mt-1.5 leading-relaxed ${todo.completed ? 'text-gray-600' : 'text-gray-400'}`}>
              {todo.note}
            </p>
          )}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-blue-800 text-blue-200 shrink-0">
              {todo.createdBy.initials}
            </div>
            <span className="text-xs text-gray-500">{todo.createdBy.name}</span>
            <span className="text-gray-700">·</span>
            <span className="text-xs text-gray-500">{formatRelativeTime(todo.createdAt)}</span>
            {!todo.completed && (
              <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full border ${priority.bg} ${priority.color}`}>
                {priority.label}
              </span>
            )}
            {todo.completed && todo.completedAt && (
              <>
                <span className="text-gray-700">·</span>
                <span className="text-xs text-green-700">
                  Done by {todo.completedBy?.name ?? 'unknown'} · {formatRelativeTime(todo.completedAt)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddTodoModal({ onClose, onAdd, userName }) {
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const [priority, setPriority] = useState('medium');

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd({ text: text.trim(), note: note.trim(), priority });
    onClose();
  }

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
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
            aria-label="Close"
          >
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

          <textarea
            placeholder="Add a note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
          />

          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">Priority</p>
            <div className="flex gap-2">
              {['low', 'medium', 'high'].map((p) => {
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

          {userName && (
            <p className="text-xs text-gray-600">Adding as {userName}</p>
          )}

          <button
            type="submit"
            disabled={!text.trim()}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            Add To-Do
          </button>
        </form>
      </div>
    </div>
  );
}

export default function MessagesPage({ user }) {
  const [todos, setTodos] = useState(INITIAL_TODOS);
  const [showModal, setShowModal] = useState(false);

  const activeTodos = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) => t.completed);

  function handleComplete(id) {
    const firstName = user?.name?.split(' ')[0] ?? 'You';
    const initials = firstName[0].toUpperCase();
    setTodos((prev) =>
      prev.map((t) =>
        t._id === id
          ? { ...t, completed: true, completedAt: new Date().toISOString(), completedBy: { name: firstName, initials } }
          : t
      )
    );
    // TODO: PATCH /api/todos/:id  { completed: true, completedAt, completedBy }
  }

  function handleUndo(id) {
    setTodos((prev) =>
      prev.map((t) =>
        t._id === id ? { ...t, completed: false, completedAt: null, completedBy: null } : t
      )
    );
    // TODO: PATCH /api/todos/:id  { completed: false, completedAt: null, completedBy: null }
  }

  function handleAdd({ text, note, priority }) {
    const firstName = user?.name?.split(' ')[0] ?? 'You';
    const initials = firstName[0].toUpperCase();
    const newTodo = {
      _id: Date.now().toString(),
      text,
      note,
      priority,
      completed: false,
      completedAt: null,
      completedBy: null,
      createdBy: { name: firstName, initials },
      createdAt: new Date().toISOString(),
    };
    setTodos((prev) => [newTodo, ...prev]);
    // TODO: POST /api/todos  { text, note, priority, createdBy }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">To-Do</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {activeTodos.length === 0
              ? 'All caught up'
              : `${activeTodos.length} item${activeTodos.length !== 1 ? 's' : ''} remaining`}
          </p>
        </div>

        {activeTodos.length === 0 && completedTodos.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm">No to-dos yet. Hit + to add one.</p>
          </div>
        )}

        {activeTodos.length === 0 && completedTodos.length > 0 && (
          <div className="text-center py-10 text-gray-600">
            <div className="text-3xl mb-2">✓</div>
            <p className="text-sm">All caught up!</p>
          </div>
        )}

        <div className="space-y-3">
          {activeTodos.map((todo) => (
            <TodoCard key={todo._id} todo={todo} onComplete={handleComplete} onUndo={handleUndo} />
          ))}
        </div>

        {completedTodos.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-3">
              Completed · {completedTodos.length}
            </h2>
            <div className="space-y-2">
              {completedTodos.map((todo) => (
                <TodoCard key={todo._id} todo={todo} onComplete={handleComplete} onUndo={handleUndo} />
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-xl flex items-center justify-center text-2xl font-light transition-all hover:scale-105 active:scale-95"
        aria-label="Add to-do"
      >
        +
      </button>

      {showModal && (
        <AddTodoModal
          onClose={() => setShowModal(false)}
          onAdd={handleAdd}
          userName={user?.name?.split(' ')[0]}
        />
      )}
    </div>
  );
}
