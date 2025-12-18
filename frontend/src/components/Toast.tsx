import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  title?: string;
  duration: number;
  createdAt: number;
  isExiting?: boolean;
}

interface ToastOptions {
  type?: ToastType;
  title?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, typeOrOptions?: ToastType | ToastOptions) => void;
  dismissToast: (id: number) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastId = 0;

// Individual Toast Item Component with progress bar
const ToastItem: React.FC<{
  toast: Toast;
  onDismiss: (id: number) => void;
}> = ({ toast, onDismiss }) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (toast.isExiting || isPaused) return;

    const elapsed = Date.now() - toast.createdAt;
    const remaining = Math.max(0, toast.duration - elapsed);
    const startProgress = (remaining / toast.duration) * 100;
    setProgress(startProgress);

    const interval = setInterval(() => {
      setProgress(prev => {
        const decrement = (100 / toast.duration) * 50; // Update every 50ms
        const newProgress = prev - decrement;
        if (newProgress <= 0) {
          clearInterval(interval);
          return 0;
        }
        return newProgress;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [toast.duration, toast.createdAt, toast.isExiting, isPaused]);

  const getToastColors = (type: ToastType) => {
    const colors = {
      success: { 
        bg: 'var(--success-soft, rgba(16, 185, 129, 0.15))', 
        border: 'var(--success, #10b981)',
        icon: 'var(--success, #34d399)',
        progress: 'var(--success, #10b981)'
      },
      error: { 
        bg: 'var(--danger-soft, rgba(239, 68, 68, 0.15))', 
        border: 'var(--danger, #ef4444)',
        icon: 'var(--danger, #f87171)',
        progress: 'var(--danger, #ef4444)'
      },
      warning: { 
        bg: 'var(--warning-soft, rgba(245, 158, 11, 0.15))', 
        border: 'var(--warning, #f59e0b)',
        icon: 'var(--warning, #fbbf24)',
        progress: 'var(--warning, #f59e0b)'
      },
      info: { 
        bg: 'var(--info-soft, rgba(56, 189, 248, 0.15))', 
        border: 'var(--accent, #38bdf8)',
        icon: 'var(--accent, #7dd3fc)',
        progress: 'var(--accent, #38bdf8)'
      },
    };
    return colors[type];
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      default: return 'ℹ';
    }
  };

  const getTitle = (type: ToastType) => {
    switch (type) {
      case 'success': return 'Success';
      case 'error': return 'Error';
      case 'warning': return 'Warning';
      default: return 'Info';
    }
  };

  const colors = getToastColors(toast.type);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        backgroundColor: colors.bg,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${colors.border}`,
        borderLeft: `4px solid ${colors.border}`,
        color: 'var(--text, #e5e7eb)',
        padding: '0',
        borderRadius: 'var(--radius-lg, 16px)',
        minWidth: '340px',
        maxWidth: '440px',
        boxShadow: 'var(--shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.4))',
        animation: toast.isExiting ? 'slideOut 0.3s ease-in forwards' : 'slideIn 0.3s ease-out',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
      }}>
        {/* Icon */}
        <span style={{ 
          fontWeight: 'bold', 
          fontSize: '1.1rem',
          color: colors.icon,
          marginTop: '2px',
        }}>
          {getIcon(toast.type)}
        </span>
        
        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            fontWeight: 700, 
            fontSize: '0.9rem',
            marginBottom: '4px',
            color: 'var(--text, #f9fafb)',
          }}>
            {toast.title || getTitle(toast.type)}
          </div>
          <div style={{ 
            fontSize: '0.85rem',
            color: 'var(--muted, #9ca3af)',
            lineHeight: 1.5,
            wordBreak: 'break-word',
          }}>
            {toast.message}
          </div>
        </div>
        
        {/* Close Button */}
        <button
          onClick={() => onDismiss(toast.id)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--muted, #6b7280)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: 'var(--radius, 6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            marginTop: '-2px',
            marginRight: '-4px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text, #e5e7eb)';
            e.currentTarget.style.backgroundColor = 'var(--bg-hover, rgba(255, 255, 255, 0.1))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--muted, #6b7280)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="Dismiss notification"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Progress Bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '3px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      }}>
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: colors.progress,
            transition: isPaused ? 'none' : 'width 50ms linear',
            borderRadius: '0 2px 2px 0',
          }}
        />
      </div>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: number) => {
    // Mark as exiting for animation
    setToasts(prev => prev.map(t => 
      t.id === id ? { ...t, isExiting: true } : t
    ));
    // Remove after animation
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  const showToast = useCallback((message: string, typeOrOptions?: ToastType | ToastOptions) => {
    const id = ++toastId;
    
    let type: ToastType = 'info';
    let title: string | undefined;
    let duration = 4000;

    if (typeof typeOrOptions === 'string') {
      type = typeOrOptions;
    } else if (typeOrOptions) {
      type = typeOrOptions.type || 'info';
      title = typeOrOptions.title;
      duration = typeOrOptions.duration || 4000;
    }

    const newToast: Toast = {
      id,
      message,
      type,
      title,
      duration,
      createdAt: Date.now(),
    };

    setToasts(prev => {
      // Limit to 5 toasts max
      const updated = [...prev, newToast];
      if (updated.length > 5) {
        return updated.slice(-5);
      }
      return updated;
    });

    // Auto dismiss
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  }, [dismissToast]);

  const clearAllToasts = useCallback(() => {
    setToasts(prev => prev.map(t => ({ ...t, isExiting: true })));
    setTimeout(() => {
      setToasts([]);
    }, 300);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast, clearAllToasts }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '1.25rem',
        right: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
        zIndex: 9999,
        pointerEvents: 'none',
      }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={toast} onDismiss={dismissToast} />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
