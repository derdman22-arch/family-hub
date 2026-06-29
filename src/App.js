import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import NavBar from './components/layout/NavBar';
import GoogleSignIn from './components/auth/GoogleSignIn';
import HomePage from './pages/HomePage';
import CalendarPage from './pages/CalendarPage';
import StPetePage from './pages/StPetePage';
import MessagesPage from './pages/MessagesPage';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

function ComingSoon({ label }) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">
      <div className="text-center">
        <div className="text-4xl mb-3">🚧</div>
        <div className="text-lg font-medium">{label}</div>
        <div className="text-sm mt-1">Coming soon</div>
      </div>
    </div>
  );
}

function AppShell({ user, onSignOut }) {
  return (
    <>
      <NavBar user={user} onSignOut={onSignOut} />
      <Routes>
        <Route path="/" element={<HomePage user={user} />} />
<Route path="/dashboard" element={<ComingSoon label="Dashboard" />} />
        <Route path="/calendar" element={<CalendarPage accessToken={user.access_token} />} />
        <Route path="/expenses" element={<ComingSoon label="Expenses" />} />
        <Route path="/grocery" element={<ComingSoon label="Grocery List" />} />
        <Route path="/st-pete" element={<StPetePage />} />
        <Route path="/messages" element={<MessagesPage user={user} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function AuthenticatedApp() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('fh_user')) || null;
    } catch {
      return null;
    }
  });
  const [authError, setAuthError] = useState(null);

  async function handleSignIn(tokenResponse) {
    setAuthError(null);

    const profileResp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
    });
    const profile = await profileResp.json();

    // Verify the user is in the Atlas allowlist
    let jwtToken = null;
    try {
      const resp = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: tokenResponse.access_token }),
      });
      if (resp.status === 403) {
        setAuthError(`${profile.email} is not authorized to access Family Hub.`);
        return;
      }
      if (!resp.ok) {
        setAuthError('Sign-in failed. Please try again.');
        return;
      }
      const { token } = await resp.json();
      jwtToken = token;
    } catch {
      // Backend unreachable — allow access without JWT
    }

    const userData = {
      access_token: tokenResponse.access_token,
      name: profile.name,
      picture: profile.picture,
      email: profile.email,
      ...(jwtToken && { jwt_token: jwtToken }),
    };

    sessionStorage.setItem('fh_user', JSON.stringify(userData));
    setUser(userData);
  }

  function handleSignOut() {
    sessionStorage.removeItem('fh_user');
    setUser(null);
  }

  if (!user) return <GoogleSignIn onSuccess={handleSignIn} authError={authError} />;

  return (
    <BrowserRouter>
      <AppShell user={user} onSignOut={handleSignOut} />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthenticatedApp />
    </GoogleOAuthProvider>
  );
}
