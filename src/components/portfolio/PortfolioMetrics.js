function fmt(n, d = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

export default function PortfolioMetrics({ totals }) {
  const isGain = totals.gainLoss >= 0;
  const sign = isGain ? '+' : '';
  const gainColor = isGain ? 'text-emerald-400' : 'text-red-400';

  const isDayGain = totals.dayChange >= 0;
  const daySign = isDayGain ? '+' : '';
  const dayColor = isDayGain ? 'text-emerald-400' : 'text-red-400';

  const metrics = [
    { label: 'Portfolio Value', value: `$${fmt(totals.value)}`, color: 'text-white' },
    { label: 'Cost Basis', value: `$${fmt(totals.cost)}`, color: 'text-white' },
    {
      label: "Today's Gain / Loss",
      value: `${daySign}$${fmt(Math.abs(totals.dayChange))}`,
      color: dayColor,
    },
    {
      label: 'Total Gain / Loss',
      value: `${sign}$${fmt(Math.abs(totals.gainLoss))}`,
      color: gainColor,
    },
    {
      label: 'Total Return',
      value: `${sign}${fmt(totals.returnPct)}%`,
      color: gainColor,
      sub: `on $${fmt(totals.cost)} invested`,
    },
  ];

  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl mb-4 overflow-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y lg:divide-y-0 divide-gray-700/50">
        {metrics.map((m) => (
          <div key={m.label} className="px-6 py-4">
            <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">
              {m.label}
            </div>
            <div className={`text-xl font-bold tabular-nums ${m.color}`}>{m.value}</div>
            {m.sub && <div className="text-xs text-gray-500 mt-0.5">{m.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
