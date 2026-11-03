import { useState, useEffect, useCallback } from 'react';
import {
  fetchGrocery, addGroceryItem, patchGroceryItem, deleteGroceryItem, clearCheckedGrocery,
} from '../services/groceryService';
import { useLiveRefresh } from './useLiveRefresh';

export function useGrocery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setItems(await fetchGrocery());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useLiveRefresh(load);

  // Each change is applied locally first so the list feels instant in the store
  async function run(optimistic, request) {
    setItems(optimistic);
    try {
      await request();
    } catch (err) {
      setError(err.message);
      load();
    }
  }

  async function add(text) {
    const item = await addGroceryItem(text);
    setItems((prev) => [...prev, item]);
  }

  const toggle = (item) => run(
    (prev) => prev.map((i) => (i._id === item._id ? { ...i, checked: !i.checked } : i)),
    () => patchGroceryItem(item._id, { checked: !item.checked })
  );

  const remove = (id) => run(
    (prev) => prev.filter((i) => i._id !== id),
    () => deleteGroceryItem(id)
  );

  const clearChecked = () => run(
    (prev) => prev.filter((i) => !i.checked),
    () => clearCheckedGrocery()
  );

  return { items, loading, error, add, toggle, remove, clearChecked };
}
