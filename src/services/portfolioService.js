import { readRange } from './sheetsClient';

const FINNHUB_KEY = process.env.REACT_APP_FINNHUB_API_KEY;
const CACHE_KEY = 'fh_portfolio_price_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function fetchFinnhubPrice(ticker) {
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_KEY}`
  );
  if (!res.ok) throw new Error(`Finnhub error for ${ticker}`);
  const d = await res.json();
  return { current: d.c, prevClose: d.pc, change: d.d, changePct: d.dp };
}

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    if (Date.now() - cache.timestamp > CACHE_TTL_MS) return null;
    return cache;
  } catch {
    return null;
  }
}

function saveCache(prices) {
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({ timestamp: Date.now(), prices })
  );
}

export function getCacheTimestamp() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return new Date(JSON.parse(raw).timestamp);
  } catch {
    return null;
  }
}

export function clearPriceCache() {
  localStorage.removeItem(CACHE_KEY);
}

export async function getPortfolio(accessToken) {
  // Sheet tab "Portfolio" columns: A=ticker, B=shares, C=avgCost
  // Row 1 is assumed to be a header row
  const rows = await readRange('Portfolio!A2:C', accessToken);

  const positions = rows
    .map(([ticker, shares, avgCost]) => ({
      ticker: (ticker || '').toUpperCase().trim(),
      shares: parseFloat(shares) || 0,
      avgCost: parseFloat(avgCost) || 0,
    }))
    .filter((p) => p.ticker && p.shares > 0);

  const cache = loadCache();
  let prices = cache ? { ...cache.prices } : {};

  // Fetch prices for any ticker not yet in cache
  const missing = positions.filter((p) => !prices[p.ticker]);
  if (missing.length > 0) {
    const results = await Promise.allSettled(
      missing.map((p) =>
        fetchFinnhubPrice(p.ticker).then((price) => ({ ticker: p.ticker, price }))
      )
    );
    results.forEach((r) => {
      if (r.status === 'fulfilled') prices[r.value.ticker] = r.value.price;
    });
    saveCache(prices);
  }

  return positions.map((p) => {
    const price = prices[p.ticker] || {};
    const currentPrice = price.current || 0;
    const currentValue = currentPrice * p.shares;
    const costBasis = p.avgCost * p.shares;
    const gainLoss = currentValue - costBasis;
    const gainLossPct = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

    return {
      ...p,
      currentPrice,
      currentValue,
      costBasis,
      gainLoss,
      gainLossPct,
      dayChange: (price.change || 0) * p.shares,
      dayChangePct: price.changePct || 0,
    };
  });
}
