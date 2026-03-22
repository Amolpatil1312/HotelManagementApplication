import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { RestaurantConfigProvider, useRestaurantConfig } from './hooks/useRestaurantConfig'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { isServerConfigured, getApiBase } from './config'
import Dashboard from './pages/Dashboard'
import TableOrder from './pages/TableOrder'
import Kitchen from './pages/Kitchen'
import Admin from './pages/Admin'
import SetupWizard from './pages/SetupWizard'
import ServerConnect from './pages/ServerConnect'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'
import './styles.css'

function AppRoutes() {
  const { config, loading } = useRestaurantConfig();
  const { user, loading: authLoading } = useAuth();

  if (loading || authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  // Not logged in — show login/register
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Logged in but setup not complete — go to setup wizard
  if (config && !config.setupComplete) {
    return (
      <Routes>
        <Route path="/setup" element={<SetupWizard />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/table/:tableId" element={<ProtectedRoute><TableOrder /></ProtectedRoute>} />
      <Route path="/kitchen" element={<ProtectedRoute><Kitchen /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><Admin /></ProtectedRoute>} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
      <Route path="/setup" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    fetch(url, { signal: controller.signal })
      .then(res => { clearTimeout(timer); resolve(res); })
      .catch(err => { clearTimeout(timer); reject(err); });
  });
}

function App() {
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const isJsonResponse = async (res: Response): Promise<boolean> => {
      try {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) return true;
        const text = await res.clone().text();
        JSON.parse(text);
        return true;
      } catch {
        return false;
      }
    };

    const check = async () => {
      // Use has-admin endpoint for connectivity check (it's always public)
      try {
        const res = await fetchWithTimeout('/api/auth/has-admin', 3000);
        if (res.ok && await isJsonResponse(res)) {
          setConnected(true);
          setChecking(false);
          return;
        }
      } catch {}

      if (isServerConfigured()) {
        try {
          const res = await fetchWithTimeout(`${getApiBase()}/api/auth/has-admin`, 3000);
          if (res.ok && await isJsonResponse(res)) {
            setConnected(true);
            setChecking(false);
            return;
          }
        } catch {}
      }

      setConnected(false);
      setChecking(false);
    };
    check();
  }, []);

  if (checking) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Connecting...</p>
      </div>
    );
  }

  if (!connected) {
    return <ServerConnect onConnected={() => setConnected(true)} />;
  }

  return (
    <AuthProvider>
      <RestaurantConfigProvider>
        <AppRoutes />
      </RestaurantConfigProvider>
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
