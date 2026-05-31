import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import NavBar from './components/layout/NavBar';
import GoogleSignIn from './components/auth/GoogleSignIn';
import FinancePage from './pages/FinancePage';
import StPetePage from './pages/StPetePage';

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
        <Route path="/" element={<Navigate to="/finance" replace />} />
        <Route
          path="/finance"
          element={<FinancePage accessToken={user.access_token} />}
        />
        <Route path="/dashboard" element={<ComingSoon label="Dashboard" />} />
        <Route path="/calendar" element={<ComingSoon label="Calendar" />} />
        <Route path="/expenses" element={<ComingSoon label="Expenses" />} />
        <Route path="/grocery" element={<ComingSoon label="Grocery List" />} />
        <Route path="/st-pete" element={<StPetePage />} />
        <Route path="/messages" element={<ComingSoon label="Messages" />} />
        <Route path="*" element={<Navigate to="/finance" replace />} />
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

  function handleSignIn(tokenResponse) {
    // Fetch the user's profile using the access token
    fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
    })
      .then((r) => r.json())
      .then((profile) => {
        const userData = {
          access_token: tokenResponse.access_token,
          name: profile.name,
          picture: profile.picture,
          email: profile.email,
        };
        sessionStorage.setItem('fh_user', JSON.stringify(userData));
        setUser(userData);
      });
  }

  function handleSignOut() {
    sessionStorage.removeItem('fh_user');
    setUser(null);
  }

  if (!user) return <GoogleSignIn onSuccess={handleSignIn} />;

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
