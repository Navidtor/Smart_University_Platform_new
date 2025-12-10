import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
}

const MAX_AUTO_RETRIES = 2;
const RETRY_DELAY = 1500;

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    retryCount: 0,
    isRetrying: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call optional error callback
    this.props.onError?.(error, errorInfo);

    // Auto-retry logic for transient errors
    if (this.state.retryCount < MAX_AUTO_RETRIES && this.isTransientError(error)) {
      this.scheduleAutoRetry();
    }
  }

  private isTransientError(error: Error): boolean {
    // Detect network/fetch errors that might be transient
    const transientPatterns = [
      'network',
      'fetch',
      'timeout',
      'ECONNREFUSED',
      'Failed to fetch',
      'NetworkError',
      'Load failed',
    ];
    const errorMessage = error.message.toLowerCase();
    return transientPatterns.some(pattern => 
      errorMessage.includes(pattern.toLowerCase())
    );
  }

  private scheduleAutoRetry = () => {
    this.setState({ isRetrying: true });
    setTimeout(() => {
      this.handleRetry();
    }, RETRY_DELAY);
  };

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      isRetrying: false,
    }));
    this.props.onReset?.();
  };

  private handleManualReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
    });
    this.props.onReset?.();
  };

  private copyErrorToClipboard = () => {
    const errorText = `Error: ${this.state.error?.message}\n\nStack: ${this.state.error?.stack}\n\nComponent Stack: ${this.state.errorInfo?.componentStack}`;
    navigator.clipboard.writeText(errorText).catch(() => {
      // Fallback for older browsers
      console.log('Failed to copy error to clipboard');
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, retryCount, isRetrying } = this.state;
      const isTransient = error && this.isTransientError(error);

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{
            background: 'radial-gradient(circle at top left, rgba(239, 68, 68, 0.1), transparent 55%), linear-gradient(to bottom right, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.95))',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '14px',
            padding: '2rem',
            maxWidth: '520px',
            boxShadow: '0 24px 60px rgba(15, 23, 42, 0.95), 0 0 0 1px rgba(15, 23, 42, 0.6)',
          }}>
            {/* Error Icon */}
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h2 style={{ 
              color: '#f87171', 
              marginBottom: '0.5rem',
              fontSize: '1.25rem',
              fontWeight: 600,
            }}>
              {isRetrying ? 'Retrying...' : 'Something went wrong'}
            </h2>
            
            <p style={{ 
              color: '#9ca3af', 
              marginBottom: '1rem',
              fontSize: '0.875rem',
              lineHeight: 1.5,
            }}>
              {error?.message || 'An unexpected error occurred'}
            </p>

            {/* Retry Status */}
            {isTransient && retryCount > 0 && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                marginBottom: '1rem',
                fontSize: '0.75rem',
                color: '#fbbf24',
              }}>
                {isRetrying 
                  ? `Auto-retry attempt ${retryCount + 1}/${MAX_AUTO_RETRIES + 1}...`
                  : `Retry attempts: ${retryCount}/${MAX_AUTO_RETRIES}`
                }
              </div>
            )}

            {/* Loading spinner during retry */}
            {isRetrying && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '2px solid rgba(56, 189, 248, 0.2)',
                  borderTopColor: '#38bdf8',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
              </div>
            )}

            {/* Action Buttons */}
            {!isRetrying && (
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}>
                <button
                  onClick={this.handleManualReset}
                  style={{
                    background: 'linear-gradient(to right, #0ea5e9, #6366f1)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '0.6rem 1.25rem',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    boxShadow: '0 12px 30px rgba(37, 99, 235, 0.5)',
                    transition: 'transform 0.12s ease, box-shadow 0.12s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 18px 40px rgba(37, 99, 235, 0.7)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(37, 99, 235, 0.5)';
                  }}
                >
                  Try Again
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: '#9ca3af',
                    border: '1px solid rgba(148, 163, 184, 0.4)',
                    borderRadius: '999px',
                    padding: '0.6rem 1.25rem',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    transition: 'background-color 0.15s ease, color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(30, 64, 175, 0.7)';
                    e.currentTarget.style.color = '#e5e7eb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)';
                    e.currentTarget.style.color = '#9ca3af';
                  }}
                >
                  Reload Page
                </button>

                <button
                  onClick={this.copyErrorToClipboard}
                  title="Copy error details"
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: '#6b7280',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    borderRadius: '999px',
                    padding: '0.6rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.15s ease, color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(30, 64, 175, 0.5)';
                    e.currentTarget.style.color = '#9ca3af';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)';
                    e.currentTarget.style.color = '#6b7280';
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}
