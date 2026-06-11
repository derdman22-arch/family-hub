import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Home',      path: '/'          },
  { label: 'Finance',   path: '/finance'   },
  { label: 'Calendar',  path: '/calendar'  },
  { label: 'Messages',  path: '/messages'  },
  { label: 'St. Pete',  path: '/st-pete'   },
  { label: 'Expenses',  path: '/expenses'  },
  { label: 'Grocery',   path: '/grocery'   },
];

export default function NavBar({ user, onSignOut }) {
  const { pathname } = useLocation();

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">36
        <div className="flex items-center gap-1 overflow-x-auto">
          <span className="text-white font-bold text-lg mr-4 shrink-0">
            Family Hub
          </span>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap transition-colors ${
                (item.path === '/' ? pathname === '/' : pathname.startsWith(item.path))
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
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
