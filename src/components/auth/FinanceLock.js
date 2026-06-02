import { useState, useRef, useEffect } from 'react';

const STORAGE_KEY = 'fh_finance_unlocked';
const PIN = process.env.REACT_APP_FINANCE_PIN || '';

export function isFinanceUnlocked() {
  if (!PIN) return true;
  return sessionStorage.getItem(STORAGE_KEY) === '1';
}

export function lockFinance() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export default function FinanceLock({ onUnlock }) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const refs = [useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    refs[0].current?.focus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(index, value) {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError(false);

    if (value && index < 3) {
      refs[index + 1].current?.focus();
    }

    if (value && index === 3) {
      const entered = [...next.slice(0, 3), value].join('');
      submit(entered);
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  }

  function submit(entered) {
    if (entered === PIN) {
      sessionStorage.setItem(STORAGE_KEY, '1');
      onUnlock();
    } else {
      setShake(true);
      setDigits(['', '', '', '']);
      setError(true);
      setTimeout(() => {
        setShake(false);
        refs[0].current?.focus();
      }, 600);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-xs w-full">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-800 border border-gray-700 mb-4">
            <LockIcon />
          </div>
          <h2 className="text-xl font-bold text-white">Portfolio locked</h2>
          <p className="text-gray-500 text-sm mt-1">Enter your PIN to view financial data</p>
        </div>

        <div className={`flex justify-center gap-3 ${shake ? 'animate-shake' : ''}`}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border bg-gray-800 text-white outline-none transition-colors
                ${error ? 'border-red-500 bg-red-900/20' : d ? 'border-indigo-500' : 'border-gray-700'}
                focus:border-indigo-400`}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-sm mt-4">Incorrect PIN. Try again.</p>
        )}
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-gray-400">
      <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
    </svg>
  );
}
