import { useState, useEffect, useCallback } from 'react';
import {
  getPortfolio,
  getCacheTimestamp,
  clearPriceCache,
} from '../services/portfolioService';

export function usePortfolio(accessToken) {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(
    async (forceRefresh = false) => {
      if (!accessToken) return;
      if (forceRefresh) clearPriceCache();
      setLoading(true);
      setError(null);
      try {
        const data = await getPortfolio(accessToken);
        setHoldings(data);
        setLastUpdated(getCacheTimestamp() || new Date());
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  const totals = holdings.reduce(
    (acc, h) => ({
      value: acc.value + h.currentValue,
      cost: acc.cost + h.costBasis,
      gainLoss: acc.gainLoss + h.gainLoss,
    }),
    { value: 0, cost: 0, gainLoss: 0 }
  );
  totals.returnPct =
    totals.cost > 0 ? (totals.gainLoss / totals.cost) * 100 : 0;

  return { holdings, loading, error, lastUpdated, refresh, totals };
}
