function fmt(n, d = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function GainBadge({ value, pct }) {
  const pos = value >= 0;
  const sign = pos ? '+' : '';
  const cls = pos
    ? 'text-emerald-400 bg-emerald-400/10'
    : 'text-red-400 bg-red-400/10';
  return (
    <div className={`inline-flex flex-col items-end rounded-lg px-2.5 py-1 ${cls}`}>
      <span className="font-semibold text-sm tabular-nums">
        {sign}${fmt(Math.abs(value))}
      </span>
      <span className="text-xs opacity-75 tabular-nums">
        {sign}{fmt(pct)}%
      </span>
    </div>
  );
}

function DayChange({ change, pct }) {
  if (change == null || change === 0) return <span className="text-gray-600">—</span>;
  const pos = change >= 0;
  const sign = pos ? '+' : '';
  const cls = pos ? 'text-emerald-400' : 'text-red-400';
  return (
    <div className={cls}>
      <div className="text-sm font-medium tabular-nums">{sign}{fmt(pct)}%</div>
      <div className="text-xs opacity-70 tabular-nums">{sign}${fmt(Math.abs(change))}</div>
    </div>
  );
}

function AllocBar({ pct }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="w-14 bg-gray-700/60 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-indigo-400 rounded-full"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-gray-400 text-xs w-9 text-right tabular-nums">{fmt(pct, 1)}%</span>
    </div>
  );
}

export default function PortfolioTable({ holdings }) {
  if (!holdings.length) {
    return (
      <div className="text-center py-16 text-gray-500 bg-gray-800/40 border border-gray-700/50 rounded-2xl">
        No holdings found. Make sure your Google Sheet has a{' '}
        <strong className="text-gray-400">Portfolio</strong> tab with columns: Ticker, Shares, Avg Cost.
      </div>
    );
  }

  const total = holdings.reduce((s, h) => s + h.currentValue, 0);

  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-900/60">
              {[
                { label: 'Symbol', align: 'left', cls: 'pl-5 pr-4' },
                { label: 'Qty', align: 'right', cls: 'px-4' },
                { label: 'Avg Cost', align: 'right', cls: 'px-4' },
                { label: 'Last Price', align: 'right', cls: 'px-4' },
                { label: 'Day Chg', align: 'right', cls: 'px-4' },
                { label: 'Market Value', align: 'right', cls: 'px-4' },
                { label: 'Gain / Loss', align: 'right', cls: 'px-4' },
                { label: 'Allocation', align: 'right', cls: 'pl-4 pr-5' },
              ].map((col) => (
                <th
                  key={col.label}
                  className={`${col.cls} py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-${col.align} whitespace-nowrap`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {holdings.map((h) => {
              const alloc = total > 0 ? (h.currentValue / total) * 100 : 0;
              return (
                <tr
                  key={h.ticker}
                  className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors"
                >
                  <td className="pl-5 pr-4 py-3.5">
                    <span className="font-bold text-white text-base tracking-wide">{h.ticker}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right text-gray-300 tabular-nums">
                    {fmt(h.shares, 4).replace(/\.?0+$/, '')}
                  </td>
                  <td className="px-4 py-3.5 text-right text-gray-300 tabular-nums">
                    ${fmt(h.avgCost)}
                  </td>
                  <td className="px-4 py-3.5 text-right text-white font-semibold tabular-nums">
                    {h.currentPrice ? `$${fmt(h.currentPrice)}` : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <DayChange change={h.dayChange} pct={h.dayChangePct} />
                  </td>
                  <td className="px-4 py-3.5 text-right text-white font-semibold tabular-nums">
                    {h.currentValue ? `$${fmt(h.currentValue)}` : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <GainBadge value={h.gainLoss} pct={h.gainLossPct} />
                  </td>
                  <td className="pl-4 pr-5 py-3.5">
                    <AllocBar pct={alloc} />
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr className="border-t border-gray-700 bg-gray-900/40">
              <td className="pl-5 pr-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Total
              </td>
              <td colSpan={4} />
              <td className="px-4 py-3 text-right text-white font-bold tabular-nums">
                ${fmt(total)}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
