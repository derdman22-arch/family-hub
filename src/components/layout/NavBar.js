import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'To-dos',   path: '/',         icon: '✅' },
  { label: 'Calendar', path: '/calendar', icon: '📅' },
  { label: 'Grocery',  path: '/grocery',  icon: '🛒' },
  { label: 'Overview', path: '/overview', icon: '📊' },
];

export default function NavBar({ user, onSignOut }) {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = (path) => (path === '/' ? pathname === '/' : pathname.startsWith(path));

  return (
    <>
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40 pt-[env(safe-area-inset-top)]">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-1">
            <span className="text-white font-bold text-lg mr-4 shrink-0">Family Hub</span>
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

          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 py-1"
              aria-label="Account menu"
            >
              {user.picture
                ? <img src={user.picture} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                : <span className="w-8 h-8 rounded-full bg-blue-800 text-blue-100 flex items-center justify-center text-sm font-bold">{(user.name || '?')[0]}</span>}
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-2 z-50 w-56 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-2">
                  <div className="px-3 py-2 border-b border-gray-800 mb-1">
                    <div className="text-white text-sm font-medium truncate">{user.name}</div>
                    <div className="text-gray-500 text-xs truncate">{user.email}</div>
                  </div>
                  <button
                    onClick={() => { setMenuOpen(false); onSignOut(); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800"
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-gray-900 border-t border-gray-800 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 h-16 text-xs font-medium transition-colors ${
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
