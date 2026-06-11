import { Link } from 'react-router-dom';

const SECTIONS = [
  { label: 'Finance',   path: '/finance',   icon: '📈', desc: 'Portfolio & holdings',    available: true  },
  { label: 'Calendar',  path: '/calendar',  icon: '📅', desc: 'Family schedule',          available: true  },
  { label: 'Messages',  path: '/messages',  icon: '💬', desc: 'Family to-dos',            available: true  },
  { label: 'St. Pete',  path: '/st-pete',   icon: '🌴', desc: 'Local guide & weather',    available: true  },
  { label: 'Expenses',  path: '/expenses',  icon: '💰', desc: 'Expense tracking',         available: false },
  { label: 'Grocery',   path: '/grocery',   icon: '🛒', desc: 'Grocery lists',            available: false },
  { label: 'Dashboard', path: '/dashboard', icon: '📊', desc: 'Family overview',          available: false },
];

export default function HomePage({ user }) {
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Welcome back, {firstName}</h1>
          <p className="text-gray-400 mt-1 text-sm">What would you like to do today?</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {SECTIONS.map((section) =>
            section.available ? (
              <Link
                key={section.path}
                to={section.path}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-blue-600 hover:bg-gray-800 transition-all group"
              >
                <div className="text-3xl mb-3">{section.icon}</div>
                <div className="text-white font-semibold text-base group-hover:text-blue-400 transition-colors">
                  {section.label}
                </div>
                <div className="text-gray-400 text-xs mt-0.5">{section.desc}</div>
              </Link>
            ) : (
              <div
                key={section.path}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 opacity-40 cursor-not-allowed"
              >
                <div className="text-3xl mb-3">{section.icon}</div>
                <div className="text-gray-500 font-semibold text-base">{section.label}</div>
                <div className="text-gray-600 text-xs mt-0.5">Coming soon</div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
