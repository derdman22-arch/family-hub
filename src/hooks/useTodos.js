import { useState, useEffect, useCallback } from 'react';
import { fetchNotes, createNote, patchNote } from '../services/todosService';

export function useNotes(jwtToken) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchNotes(jwtToken);
      setNotes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [jwtToken]);

  useEffect(() => { load(); }, [load]);

  async function add(payload) {
    const note = await createNote(jwtToken, payload);
    setNotes((prev) => [note, ...prev]);
  }

  async function update(id, patch) {
    const updated = await patchNote(jwtToken, id, patch);
    setNotes((prev) => prev.map((n) => (n._id === updated._id ? updated : n)));
  }

  return { notes, loading, error, add, update };
}
