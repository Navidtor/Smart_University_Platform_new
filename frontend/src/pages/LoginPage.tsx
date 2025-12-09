import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { api } from '../api/client';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [tenantId, setTenantId] = useState('engineering');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password, tenantId });
      const token = res.data.token as string;
      login(token, tenantId);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <div className="form-title">Welcome back</div>
      <div className="form-subtitle">Sign in to manage bookings, exams, and campus activity.</div>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label className="form-label">Username</label>
          <input
            className="form-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="form-field">
          <label className="form-label">Password</label>
          <input
            className="form-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <div className="form-field">
          <label className="form-label">Tenant / Faculty</label>
          <input
            className="form-input"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            placeholder="e.g. engineering"
            required
          />
        </div>
        {error && <div className="text-danger">{error}</div>}
        <div className="form-footer">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <Link to="/register" className="form-link">
            New here? Create account
          </Link>
        </div>
      </form>
    </div>
  );
};