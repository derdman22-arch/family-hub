import { usePortfolio } from '../hooks/usePortfolio';
import PortfolioMetrics from '../components/portfolio/PortfolioMetrics';
import PortfolioTable from '../components/portfolio/PortfolioTable';
import PortfolioChart from '../components/portfolio/PortfolioChart';

const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1nln0UH69uKDCvPDmlHPUnQcLWacV7hzoiciFeWlWpG0/edit';

function formatTime(date) {
  if (!date) return null;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function FinancePage({ accessToken }) {
  const { holdings, loading, error, lastUpdated, refresh, totals } =
    usePortfolio(accessToken);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Portfolio</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {lastUpdated
                ? `Prices as of ${formatTime(lastUpdated)} · refreshes daily`
                : 'Loading prices…'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              disabled={loading}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshIcon spinning={loading} />
              {loading ? 'Updating…' : 'Refresh'}
            </button>
            <a
              href={SHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              <SheetsIcon />
              Open Sheet
            </a>
          </div>
        </div>

        {/* Error state */}
        {error && !loading && (
          <div className="bg-red-900/40 border border-red-800 text-red-300 rounded-xl px-4 py-3 mb-6 text-sm">
            {error.code === 'AUTH_EXPIRED'
              ? 'Your Google session expired. Sign out and sign back in.'
              : `Error loading portfolio: ${error.message}`}
          </div>
        )}

        {/* Skeleton while loading first time */}
        {loading && holdings.length === 0 ? (
          <LoadingSkeleton />
        ) : (
          <>
            <PortfolioMetrics totals={totals} />
            <PortfolioTable holdings={holdings} />
            {holdings.length > 0 && (
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <PortfolioChart holdings={holdings} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function RefreshIcon({ spinning }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`}
    >
      <path
        fillRule="evenodd"
        d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SheetsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3h2v2h-2V6zm-4 0h2v2H8V6zm8 10H8v-2h8v2zm0-4H8v-2h8v2zm0-4h-2V6h2v2z" />
    </svg>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-800 rounded-xl h-20" />
        ))}
      </div>
      <div className="bg-gray-800 rounded-xl h-64" />
    </div>
  );
}
