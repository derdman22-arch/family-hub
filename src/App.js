import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/layout/NavBar';
import SignInScreen from './components/auth/SignInScreen';
import TodosPage from './pages/TodosPage';
import CalendarPage from './pages/CalendarPage';
import GroceryPage from './pages/GroceryPage';
import OverviewPage from './pages/OverviewPage';
import { api, getSession, clearSession } from './services/api';
import { completeGoogleSignIn } from './services/authService';
import {
  registerServiceWorker, syncSubscription, disableNotifications, setBadge,
} from './services/pushService';

// Module-level so React StrictMode's double effect run can't redeem the code twice
let callbackHandled = false;

function AppShell({ session, onSignOut }) {
  const me = session.user;
  const [users, setUsers] = useState([me]);

  useEffect(() => {
    api('/users').then(setUsers).catch(() => {});
    syncSubscription();
  }, []);

  return (
    <>
      <NavBar user={me} onSignOut={onSignOut} />
      {/* Bottom padding clears the fixed tab bar on phones */}
      <div className="bg-gray-950 pb-[calc(4rem_+_env(safe-area-inset-bottom))] md:pb-0">
        <Routes>
          <Route path="/" element={<TodosPage me={me} users={users} />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/grocery" element={<GroceryPage />} />
          <Route path="/overview" element={<OverviewPage me={me} users={users} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  const [session, setSession] = useState(getSession);
  const [authError, setAuthError] = useState(null);
  const [completing, setCompleting] = useState(window.location.pathname === '/auth/callback');

  useEffect(() => { registerServiceWorker(); }, []);

  // api() fires this when the server rejects the session
  useEffect(() => {
    const onSignedOut = (e) => {
      setSession(null);
      setAuthError(e.detail || 'Please sign in again.');
    };
    window.addEventListener('fh:signedout', onSignedOut);
    return () => window.removeEventListener('fh:signedout', onSignedOut);
  }, []);

  // Google redirects back to /auth/callback?code=…
  useEffect(() => {
    if (window.location.pathname !== '/auth/callback' || callbackHandled) return;
    callbackHandled = true;
    completeGoogleSignIn(window.location.search)
      .then((s) => {
        if (!s) return; // redirecting to Google's consent screen
        window.history.replaceState(null, '', '/');
        setSession(s);
        setCompleting(false);
      })
      .catch((err) => {
        window.history.replaceState(null, '', '/');
        setAuthError(err.message);
        setCompleting(false);
      });
  }, []);

  async function handleSignOut() {
    await disableNotifications();
    setBadge(0);
    clearSession();
    setSession(null);
  }

  if (!session || completing) {
    return <SignInScreen authError={authError} signingIn={completing} />;
  }

  return (
    <BrowserRouter>
      <AppShell session={session} onSignOut={handleSignOut} />
    </BrowserRouter>
  );
}
