import { useState, useEffect } from 'react';
import { fetchActivities } from '../services/placesService';

export function useActivities() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActivities()
      .then(setPlaces)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { places, loading, error };
}
