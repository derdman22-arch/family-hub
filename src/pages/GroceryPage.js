import { useState } from 'react';
import { useGrocery } from '../hooks/useGrocery';

export default function GroceryPage() {
  const { items, loading, error, add, toggle, remove, clearChecked } = useGrocery();
  const [text, setText] = useState('');
  const [addError, setAddError] = useState(null);

  async function handleAdd(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const value = text.trim();
    setText(''); // clear right away so several items can be typed in a row
    setAddError(null);
    try {
      await add(value);
    } catch (err) {
      setText(value);
      setAddError(err.message);
    }
  }

  const toBuy = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-5">
        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
          <input
            className="flex-1 min-w-0 bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 placeholder-gray-500"
            placeholder="Add an item…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            enterKeyHint="enter"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="shrink-0 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium px-4 rounded-xl"
          >
            Add
          </button>
        </form>
        {(addError || error) && <p className="text-red-400 text-sm mb-3">{addError || error}</p>}

        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-900 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <>
            {toBuy.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-8">The list is empty 🛒</p>
            )}
            {toBuy.length > 0 && (
              <ul className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800 overflow-hidden">
                {toBuy.map((item) => (
                  <GroceryRow key={item._id} item={item} onToggle={toggle} onRemove={remove} />
                ))}
              </ul>
            )}

            {checked.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">In the cart ({checked.length})</span>
                  <button onClick={clearChecked} className="text-sm text-blue-400 hover:text-blue-300">
                    Clear
                  </button>
                </div>
                <ul className="bg-gray-900/50 border border-gray-800 rounded-xl divide-y divide-gray-800 overflow-hidden">
                  {checked.map((item) => (
                    <GroceryRow key={item._id} item={item} onToggle={toggle} onRemove={remove} />
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function GroceryRow({ item, onToggle, onRemove }) {
  return (
    <li className="flex items-center">
      <button onClick={() => onToggle(item)} className="flex-1 min-w-0 flex items-center gap-3 px-4 py-3.5 text-left">
        <span
          className={`w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center ${
            item.checked ? 'bg-green-600 border-green-600 text-white' : 'border-gray-600'
          }`}
        >
          {item.checked && <span className="text-xs leading-none">✓</span>}
        </span>
        <span className={`break-words ${item.checked ? 'text-gray-500 line-through' : 'text-gray-100'}`}>
          {item.text}
        </span>
      </button>
      <button
        onClick={() => onRemove(item._id)}
        className="px-4 py-3.5 text-gray-600 hover:text-red-400"
        aria-label={`Remove ${item.text}`}
      >
        ✕
      </button>
    </li>
  );
}
