import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Home',      path: '/',         icon: '🏠' },
  { label: 'Calendar',  path: '/calendar', icon: '📅' },
  { label: 'Messages',  path: '/messages', icon: '✅' },
  { label: 'St. Pete',  path: '/st-pete',  icon: '🌴' },
  { label: 'Expenses',  path: '/expenses', icon: '💵' },
  { label: 'Grocery',   path: '/grocery',  icon: '🛒' },
];

export default function NavBar({ user, onSignOut }) {
  const { pathname } = useLocation();
  const isActive = (path) => (path === '/' ? pathname === '/' : pathname.startsWith(path));

  return (
    <>
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-white font-bold text-lg mr-4 shrink-0">
              Family Hub
            </span>
            {/* Desktop links — phones use the bottom tab bar below */}
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`hidden md:block px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {user && (
            <div className="flex items-center gap-3 shrink-0 pl-4">
              <img
                src={user.picture}
                alt={user.name}
                className="w-7 h-7 rounded-full"
              />
              <span className="text-gray-400 text-sm hidden sm:block">
                {user.name}
              </span>
              <button
                onClick={onSignOut}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors py-2"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </nav>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-gray-900 border-t border-gray-800 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-6">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 h-16 text-[10px] font-medium transition-colors ${
                isActive(item.path) ? 'text-blue-400' : 'text-gray-500 active:text-gray-300'
              }`}
            >
              <span className="text-xl leading-none" aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
