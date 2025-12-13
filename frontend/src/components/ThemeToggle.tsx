import React from 'react';
import { useTheme } from '../state/ThemeContext';

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  size = 'md',
  showLabel = false 
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  const sizes = {
    sm: { button: '28px', icon: 14 },
    md: { button: '36px', icon: 18 },
    lg: { button: '44px', icon: 22 },
  };

  const { button: buttonSize, icon: iconSize } = sizes[size];

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="theme-toggle"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        width: showLabel ? 'auto' : buttonSize,
        height: buttonSize,
        padding: showLabel ? '0 0.75rem' : '0',
        borderRadius: '999px',
        border: '1px solid var(--border)',
        background: 'var(--bg-elevated)',
        color: 'var(--text)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.3s ease, opacity 0.3s ease',
          transform: isDark ? 'rotate(0deg)' : 'rotate(-90deg)',
          opacity: isDark ? 1 : 0,
          position: isDark ? 'relative' : 'absolute',
        }}
      >
        {/* Moon Icon */}
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </span>
      
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.3s ease, opacity 0.3s ease',
          transform: isDark ? 'rotate(90deg)' : 'rotate(0deg)',
          opacity: isDark ? 0 : 1,
          position: isDark ? 'absolute' : 'relative',
        }}
      >
        {/* Sun Icon */}
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      </span>

      {showLabel && (
        <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}

      <style>{`
        .theme-toggle:hover {
          background: var(--bg-hover) !important;
          border-color: var(--border-hover) !important;
          transform: translateY(-1px);
        }
        .theme-toggle:active {
          transform: translateY(0);
        }
      `}</style>
    </button>
  );
};
