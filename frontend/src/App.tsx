import React from 'react';
import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { useAuth, AuthProvider } from './state/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { BookingPage } from './pages/BookingPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { ExamsPage } from './pages/ExamsPage';
import { ToastProvider } from './components/Toast';
import { ServiceStatus } from './components/ServiceStatus';

const Protected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { token, role, tenantId, logout } = useAuth();

  return (
    <ToastProvider>
    <div className="app-shell">
      <header className="app-nav">
        <div className="app-nav-title">
          <div className="app-nav-orb" />
          <div>
            <div>Smart University</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Microservices platform</div>
          </div>
        </div>
        <nav className="app-nav-links">
          <NavLink to="/dashboard" className={({ isActive }) => 'app-nav-link' + (isActive ? ' app-nav-link-active' : '')}>
            Dashboard
          </NavLink>
          <NavLink to="/booking" className={({ isActive }) => 'app-nav-link' + (isActive ? ' app-nav-link-active' : '')}>
            Booking
          </NavLink>
          <NavLink to="/market" className={({ isActive }) => 'app-nav-link' + (isActive ? ' app-nav-link-active' : '')}>
            Marketplace
          </NavLink>
          <NavLink to="/exams" className={({ isActive }) => 'app-nav-link' + (isActive ? ' app-nav-link-active' : '')}>
            Exams
          </NavLink>
        </nav>
        <div className="app-nav-user">
          <ServiceStatus />
          {token ? (
            <>
              <div className="app-nav-pill">
                <span>{role ?? 'USER'}</span> · {tenantId ?? 'tenant'}
              </div>
              <button type="button" className="app-nav-logout" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <NavLink to="/login" className="app-nav-link app-nav-link-active">
              Sign in
            </NavLink>
          )}
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/dashboard"
            element={
              <Protected>
                <DashboardPage />
              </Protected>
            }
          />
          <Route
            path="/booking"
            element={
              <Protected>
                <BookingPage />
              </Protected>
            }
          />
          <Route
            path="/market"
            element={
              <Protected>
                <MarketplacePage />
              </Protected>
            }
          />
          <Route
            path="/exams"
            element={
              <Protected>
                <ExamsPage />
              </Protected>
            }
          />

          <Route path="/" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
    </ToastProvider>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};