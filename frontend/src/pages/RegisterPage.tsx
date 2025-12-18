import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import { useAuth } from '@/state/AuthContext';
import { LoginBackground } from '@/components/LoginBackground';
import { KittenStyle4Cartoon } from '@/components/kittens/KittenStyle4Cartoon';

interface MousePosition {
  x: number;
  y: number;
}

export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [tenantId, setTenantId] = useState('engineering');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  
  // 3D card tilt state
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [mouseOnCard, setMouseOnCard] = useState(false);
  const [shinePos, setShinePos] = useState<MousePosition>({ x: 50, y: 50 });
  const [isVisible, setIsVisible] = useState(false);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // 3D tilt effect handler
  const handleCardMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    // Calculate rotation (max 8 degrees for larger card)
    const rotateY = (mouseX / (rect.width / 2)) * 8;
    const rotateX = -(mouseY / (rect.height / 2)) * 8;
    
    // Calculate shine position (0-100%)
    const shineX = ((e.clientX - rect.left) / rect.width) * 100;
    const shineY = ((e.clientY - rect.top) / rect.height) * 100;
    
    setTilt({ rotateX, rotateY });
    setShinePos({ x: shineX, y: shineY });
  }, []);

  const handleCardMouseEnter = () => setMouseOnCard(true);
  const handleCardMouseLeave = () => {
    setMouseOnCard(false);
    setTilt({ rotateX: 0, rotateY: 0 });
    setShinePos({ x: 50, y: 50 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Password confirmation check
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    
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
    <div className="register-page-wrapper">
      {/* Interactive Background */}
      <LoginBackground />
      
      {/* Cute Kittens - they close eyes when you type password */}
      <KittenStyle4Cartoon isPasswordFocused={isPasswordFocused} />
      
      {/* Register Card with 3D tilt */}
      <div
        ref={cardRef}
        className={`register-card-3d ${isVisible ? 'visible' : ''}`}
        onMouseMove={handleCardMouseMove}
        onMouseEnter={handleCardMouseEnter}
        onMouseLeave={handleCardMouseLeave}
        style={{
          transform: `
            perspective(1000px)
            rotateX(${tilt.rotateX}deg)
            rotateY(${tilt.rotateY}deg)
            translateZ(0)
            ${isVisible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)'}
          `,
          transition: mouseOnCard 
            ? 'transform 0.1s ease-out' 
            : 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
        }}
      >
        {/* Shine effect overlay */}
        <div
          className="register-card-shine"
          style={{
            background: `radial-gradient(
              circle at ${shinePos.x}% ${shinePos.y}%,
              rgba(255, 255, 255, ${mouseOnCard ? 0.15 : 0}) 0%,
              transparent 50%
            )`,
            opacity: mouseOnCard ? 1 : 0,
          }}
        />
        
        {/* Glow border effect */}
        <div
          className="register-card-glow"
          style={{
            background: `radial-gradient(
              circle at ${shinePos.x}% ${shinePos.y}%,
              var(--accent, #38bdf8) 0%,
              transparent 50%
            )`,
            opacity: mouseOnCard ? 0.6 : 0,
          }}
        />
        
        {/* Card content */}
        <div className="register-card-content">
          {/* Header with animated icon */}
          <div className="register-header">
            <div className="register-icon-wrapper">
              <div className="register-icon">✨</div>
              <div className="register-icon-ring" />
              <div className="register-icon-ring ring-2" />
            </div>
            <h1 className="register-title">Create an account</h1>
            <p className="register-subtitle">Join the Smart University platform and start your journey.</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            {/* Two-column layout for name fields */}
            <div className="register-row">
              <div className="form-field">
                <label className="form-label">
                  <span className="label-icon">👤</span>
                  Username
                </label>
                <input
                  className="form-input register-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  placeholder="Choose a username"
                  required
                />
              </div>
              
              <div className="form-field">
                <label className="form-label">
                  <span className="label-icon">🎭</span>
                  Role
                </label>
                <select
                  className="form-input register-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'STUDENT' | 'TEACHER')}
                >
                  <option value="STUDENT">🎓 Student</option>
                  <option value="TEACHER">👨‍🏫 Teacher</option>
                </select>
              </div>
            </div>
            
            <div className="form-field">
              <label className="form-label">
                <span className="label-icon">🏛️</span>
                Tenant / Faculty
              </label>
              <input
                className="form-input register-input"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                placeholder="e.g. engineering, science, arts"
                required
              />
            </div>
            
            {/* Password fields in a row */}
            <div className="register-row">
              <div className="form-field">
                <label className="form-label">
                  <span className="label-icon">🔒</span>
                  Password
                </label>
                <input
                  className="form-input register-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  autoComplete="new-password"
                  placeholder="Create password"
                  required
                />
              </div>
              
              <div className="form-field">
                <label className="form-label">
                  <span className="label-icon">🔐</span>
                  Confirm
                </label>
                <input
                  className="form-input register-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  autoComplete="new-password"
                  placeholder="Confirm password"
                  required
                />
              </div>
            </div>
            
            {/* Password match indicator */}
            {confirmPassword && (
              <div className={`password-match ${password === confirmPassword ? 'match' : 'no-match'}`}>
                <span className="match-icon">{password === confirmPassword ? '✓' : '✗'}</span>
                {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
              </div>
            )}
            
            {error && (
              <div className="register-error">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}
            
            <div className="register-footer">
              <button 
                type="submit" 
                className={`register-button ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                <span className="button-text">
                  {loading ? 'Creating account…' : 'Create account'}
                </span>
                <span className="button-icon">🚀</span>
                {loading && <span className="button-spinner" />}
              </button>
              
              <Link to="/login" className="register-link">
                <span>Already have an account?</span>
                <span className="link-highlight">Sign in</span>
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Register page styles */}
      <style>{`
        .register-page-wrapper {
          position: relative;
          height: calc(100vh - 70px);
          max-height: calc(100vh - 70px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          overflow: hidden;
          box-sizing: border-box;
        }

        .register-card-3d {
          position: relative;
          width: 100%;
          max-width: 520px;
          z-index: 10;
          transform-style: preserve-3d;
          will-change: transform;
          opacity: 0;
          transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .register-card-3d.visible {
          opacity: 1;
        }

        .register-card-shine {
          position: absolute;
          inset: 0;
          border-radius: var(--radius-xl, 24px);
          pointer-events: none;
          transition: opacity 0.3s ease;
          z-index: 2;
        }

        .register-card-glow {
          position: absolute;
          inset: -2px;
          border-radius: calc(var(--radius-xl, 24px) + 2px);
          pointer-events: none;
          transition: opacity 0.3s ease;
          z-index: -1;
          filter: blur(20px);
        }

        .register-card-content {
          position: relative;
          padding: 1.5rem 2rem;
          background: var(--bg-card, linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.85)));
          border: 1px solid var(--border, rgba(148, 163, 184, 0.2));
          border-radius: var(--radius-xl, 24px);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 
            var(--shadow-lg, 0 16px 48px rgba(0, 0, 0, 0.5)),
            0 0 0 1px rgba(255, 255, 255, 0.05) inset;
          overflow: hidden;
        }

        .register-card-content::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #8b5cf6, #6366f1, #0ea5e9);
        }

        .register-header {
          text-align: center;
          margin-bottom: 1rem;
        }

        .register-icon-wrapper {
          position: relative;
          width: 50px;
          height: 50px;
          margin: 0 auto 0.75rem;
        }

        .register-icon {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          border-radius: 18px;
          box-shadow: 
            0 8px 32px rgba(139, 92, 246, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset;
          animation: registerIconPulse 3s ease-in-out infinite;
          z-index: 2;
        }

        .register-icon-ring {
          position: absolute;
          inset: -5px;
          border: 2px solid #8b5cf6;
          border-radius: 18px;
          opacity: 0.3;
          animation: registerRingPulse 2s ease-in-out infinite;
        }

        .register-icon-ring.ring-2 {
          inset: -12px;
          border-radius: 22px;
          opacity: 0.15;
          animation-delay: 0.5s;
        }

        @keyframes registerIconPulse {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.05) rotate(5deg); }
        }

        @keyframes registerRingPulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.1; }
        }

        .register-title {
          font-size: 1.375rem;
          font-weight: 800;
          color: var(--text, #f1f5f9);
          margin: 0 0 0.25rem;
          letter-spacing: -0.02em;
        }

        .register-subtitle {
          font-size: 0.8rem;
          color: var(--muted, #94a3b8);
          margin: 0;
          line-height: 1.4;
        }

        .register-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .register-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        @media (max-width: 520px) {
          .register-row {
            grid-template-columns: 1fr;
          }
        }

        .register-form .form-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .register-form .form-field {
          margin-bottom: 0;
        }

        .label-icon {
          font-size: 0.875rem;
        }

        .register-input {
          padding: 0.5rem 0.875rem !important;
          font-size: 0.85rem !important;
          background: var(--bg-elevated, #1e293b) !important;
          border: 1px solid var(--border, rgba(148, 163, 184, 0.2)) !important;
          transition: all 0.3s ease !important;
        }

        .register-input:focus {
          border-color: #8b5cf6 !important;
          box-shadow: 
            0 0 0 3px rgba(139, 92, 246, 0.15),
            0 0 20px rgba(139, 92, 246, 0.1) !important;
        }

        .password-match {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius, 10px);
          font-size: 0.8rem;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .password-match.match {
          background: var(--success-soft, rgba(52, 211, 153, 0.15));
          color: var(--success, #34d399);
        }

        .password-match.no-match {
          background: var(--danger-soft, rgba(248, 113, 113, 0.15));
          color: var(--danger, #f87171);
        }

        .match-icon {
          font-size: 1rem;
        }

        .register-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: var(--danger-soft, rgba(248, 113, 113, 0.15));
          border: 1px solid var(--danger, #f87171);
          border-radius: var(--radius, 10px);
          color: var(--danger, #f87171);
          font-size: 0.875rem;
          font-weight: 500;
          animation: shakeError 0.5s ease;
        }

        @keyframes shakeError {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          50% { transform: translateX(8px); }
          75% { transform: translateX(-4px); }
        }

        .error-icon {
          font-size: 1.1rem;
        }

        .register-footer {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 0.25rem;
        }

        .register-button {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.6rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          border: none;
          border-radius: var(--radius, 10px);
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 
            0 8px 24px rgba(139, 92, 246, 0.35),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset;
        }

        .register-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 
            0 12px 32px rgba(139, 92, 246, 0.45),
            0 0 0 1px rgba(255, 255, 255, 0.15) inset;
        }

        .register-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .register-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .register-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s ease;
        }

        .register-button:hover::before {
          left: 100%;
        }

        .button-text {
          position: relative;
          z-index: 1;
        }

        .button-icon {
          position: relative;
          z-index: 1;
          transition: transform 0.3s ease;
        }

        .register-button:hover .button-icon {
          transform: translateX(4px) rotate(-15deg);
        }

        .button-spinner {
          position: absolute;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .register-button.loading .button-text,
        .register-button.loading .button-icon {
          opacity: 0;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .register-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: var(--muted, #94a3b8);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .register-link:hover {
          color: var(--text, #f1f5f9);
        }

        .link-highlight {
          color: #8b5cf6;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .register-link:hover .link-highlight {
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        /* Responsive adjustments */
        @media (max-width: 520px) {
          .register-page-wrapper {
            padding: 1rem;
          }

          .register-card-content {
            padding: 1.5rem;
          }

          .register-title {
            font-size: 1.375rem;
          }

          .register-icon-wrapper {
            width: 56px;
            height: 56px;
          }

          .register-icon {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};