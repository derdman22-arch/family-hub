import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts';

const COLORS = [
  '#818cf8', '#a78bfa', '#c084fc', '#e879f9',
  '#f472b6', '#fb923c', '#fbbf24', '#4ade80',
  '#34d399', '#22d3ee', '#60a5fa', '#f87171',
];

function fmt(n, d = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function fmtCompact(n) {
  if (n >= 1_000_000) return `$${fmt(n / 1_000_000, 1)}M`;
  if (n >= 1_000) return `$${fmt(n / 1_000, 1)}K`;
  return `$${fmt(n)}`;
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: 10, padding: '10px 14px' }}>
      <div style={{ color: 'white', fontWeight: 700, marginBottom: 2 }}>{d.name}</div>
      <div style={{ color: '#d1d5db', fontSize: 13 }}>${fmt(d.value)}</div>
      <div style={{ color: '#9ca3af', fontSize: 12 }}>{fmt(d.pct, 1)}% of portfolio</div>
    </div>
  );
}

function CenterLabel({ viewBox, total }) {
  const { cx, cy } = viewBox;
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#6b7280" fontSize={11} letterSpacing={1}>
        TOTAL
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="white" fontSize={22} fontWeight="700">
        {fmtCompact(total)}
      </text>
    </g>
  );
}

export default function PortfolioChart({ holdings }) {
  if (!holdings.length) return null;

  const total = holdings.reduce((s, h) => s + h.currentValue, 0);
  const data = holdings
    .filter((h) => h.currentValue > 0)
    .map((h, i) => ({
      name: h.ticker,
      value: h.currentValue,
      pct: total > 0 ? (h.currentValue / total) * 100 : 0,
      color: COLORS[i % COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6 h-full flex flex-col">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
        Allocation
      </h2>

      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
            <Label content={<CenterLabel total={total} />} position="center" />
          </Pie>
          <Tooltip content={<CustomTooltip />} cursor={false} />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-3 space-y-2.5 flex-1">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-gray-300 text-sm font-medium flex-1">{d.name}</span>
            <span className="text-gray-500 text-xs w-10 text-right">{fmt(d.pct, 1)}%</span>
            <span className="text-white text-sm font-semibold w-20 text-right">
              ${fmt(d.value, 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
