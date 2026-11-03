import { useState, useEffect, useCallback } from 'react';
import { fetchTodos, createTodo, patchTodo, deleteTodo } from '../services/todosService';
import { setBadge } from '../services/pushService';
import { useLiveRefresh } from './useLiveRefresh';

export function useTodos(myId) {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setTodos(await fetchTodos());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useLiveRefresh(load);

  // Home-screen badge = my open to-dos
  useEffect(() => {
    if (!loading) setBadge(todos.filter((t) => !t.completedAt && t.assignedTo === myId).length);
  }, [todos, loading, myId]);

  const replace = (updated) => setTodos((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));

  async function add(text, assignedTo, dueDate = null) {
    const todo = await createTodo({ text, assignedTo, dueDate });
    setTodos((prev) => [todo, ...prev]);
  }

  // Optimistic so checking off feels instant; reloads if the server disagrees
  async function update(id, patch) {
    setTodos((prev) => prev.map((t) => (t._id === id
      ? { ...t, ...patch, ...('completed' in patch && { completedAt: patch.completed ? new Date().toISOString() : null }) }
      : t)));
    try {
      replace(await patchTodo(id, patch));
    } catch (err) {
      setError(err.message);
      load();
    }
  }

  async function remove(id) {
    setTodos((prev) => prev.filter((t) => t._id !== id));
    try {
      await deleteTodo(id);
    } catch (err) {
      setError(err.message);
      load();
    }
  }

  return { todos, loading, error, add, update, remove };
}
