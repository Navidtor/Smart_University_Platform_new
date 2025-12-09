import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../state/AuthContext';

export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [tenantId, setTenantId] = useState('engineering');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { username, password, tenantId, role });
      const token = res.data.token as string;
      login(token, tenantId);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <div className="form-title">Create an account</div>
      <div className="form-subtitle">Students and staff can register per faculty / tenant.</div>
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
            autoComplete="new-password"
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
        <div className="form-field">
          <label className="form-label">Role</label>
          <select
            className="form-input"
            value={role}
            onChange={(e) => setRole(e.target.value as 'STUDENT' | 'TEACHER')}
          >
            <option value="STUDENT">Student</option>
            <option value="TEACHER">Teacher</option>
          </select>
        </div>
        {error && <div className="text-danger">{error}</div>}
        <div className="form-footer">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating…' : 'Create account'}
          </button>
          <Link to="/login" className="form-link">
            Already have an account? Sign in
          </Link>
        </div>
      </form>
    </div>
  );
};