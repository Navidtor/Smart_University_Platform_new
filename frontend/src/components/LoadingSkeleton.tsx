import React from 'react';

type SkeletonType = 'card' | 'row' | 'text' | 'avatar' | 'button' | 'metric' | 'sensor' | 'table' | 'form';

interface LoadingSkeletonProps {
  count?: number;
  type?: SkeletonType;
  width?: string | number;
  height?: string | number;
  className?: string;
}

// Base shimmer animation style
const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, var(--bg-elevated, rgba(15, 23, 42, 0.8)) 25%, var(--accent-soft, rgba(56, 189, 248, 0.08)) 50%, var(--bg-elevated, rgba(15, 23, 42, 0.8)) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite ease-in-out',
  borderRadius: 'var(--radius, 8px)',
};

// Skeleton Line Component
const SkeletonLine: React.FC<{ 
  width?: string | number; 
  height?: string | number;
  style?: React.CSSProperties;
}> = ({ width = '100%', height = '16px', style }) => (
  <div style={{
    ...shimmerStyle,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style,
  }} />
);

// Card Skeleton
const CardSkeleton: React.FC = () => (
  <div style={{
    borderRadius: 'var(--radius-lg, 16px)',
    border: '1px solid var(--border, rgba(148, 163, 184, 0.2))',
    background: 'var(--bg-card, linear-gradient(to bottom right, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.95)))',
    padding: '1.5rem',
    boxShadow: 'var(--shadow-md, 0 24px 60px rgba(15, 23, 42, 0.95))',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <SkeletonLine width="40%" height="20px" />
      <SkeletonLine width="60px" height="24px" style={{ borderRadius: '999px' }} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <SkeletonLine width="100%" height="14px" />
      <SkeletonLine width="80%" height="14px" />
      <SkeletonLine width="60%" height="14px" />
    </div>
  </div>
);

// Row Skeleton
const RowSkeleton: React.FC = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius, 10px)',
    border: '1px solid var(--border, rgba(148, 163, 184, 0.15))',
    background: 'var(--bg-elevated, rgba(15, 23, 42, 0.6))',
  }}>
    <SkeletonLine width="40px" height="40px" style={{ borderRadius: '50%' }} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <SkeletonLine width="60%" height="14px" />
      <SkeletonLine width="40%" height="12px" />
    </div>
    <SkeletonLine width="80px" height="32px" style={{ borderRadius: '999px' }} />
  </div>
);

// Text Skeleton
const TextSkeleton: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    <SkeletonLine width="100%" height="14px" />
    <SkeletonLine width="90%" height="14px" />
    <SkeletonLine width="75%" height="14px" />
  </div>
);

// Avatar Skeleton
const AvatarSkeleton: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
    <SkeletonLine width="48px" height="48px" style={{ borderRadius: '50%' }} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <SkeletonLine width="120px" height="16px" />
      <SkeletonLine width="80px" height="12px" />
    </div>
  </div>
);

// Button Skeleton
const ButtonSkeleton: React.FC = () => (
  <SkeletonLine width="120px" height="40px" style={{ borderRadius: '999px' }} />
);

// Metric Skeleton (for dashboard metrics)
const MetricSkeleton: React.FC = () => (
  <div style={{
    padding: '1rem',
    borderRadius: 'var(--radius, 10px)',
    border: '1px solid var(--border, rgba(148, 163, 184, 0.2))',
    background: 'var(--bg-elevated, rgba(15, 23, 42, 0.6))',
  }}>
    <SkeletonLine width="60%" height="12px" style={{ marginBottom: '0.5rem' }} />
    <SkeletonLine width="80px" height="28px" style={{ marginBottom: '0.25rem' }} />
    <SkeletonLine width="40%" height="10px" />
  </div>
);

// Sensor Card Skeleton
const SensorSkeleton: React.FC = () => (
  <div style={{
    padding: '1rem 1.25rem',
    borderRadius: 'var(--radius, 10px)',
    border: '1px solid var(--border, rgba(148, 163, 184, 0.25))',
    background: 'var(--bg-elevated, radial-gradient(circle at top, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.96)))',
  }}>
    <SkeletonLine width="70%" height="12px" style={{ marginBottom: '0.35rem' }} />
    <SkeletonLine width="50%" height="20px" style={{ marginBottom: '0.25rem' }} />
    <SkeletonLine width="40%" height="10px" />
  </div>
);

// Table Skeleton
const TableSkeleton: React.FC = () => (
  <div style={{
    borderRadius: 'var(--radius, 10px)',
    border: '1px solid var(--border, rgba(148, 163, 184, 0.2))',
    overflow: 'hidden',
  }}>
    {/* Header */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr 100px',
      gap: '1rem',
      padding: '0.75rem 1rem',
      background: 'var(--bg-elevated, rgba(15, 23, 42, 0.8))',
      borderBottom: '1px solid var(--border, rgba(148, 163, 184, 0.2))',
    }}>
      <SkeletonLine width="80%" height="14px" />
      <SkeletonLine width="60%" height="14px" />
      <SkeletonLine width="70%" height="14px" />
      <SkeletonLine width="100%" height="14px" />
    </div>
    {/* Rows */}
    {[1, 2, 3].map((i) => (
      <div key={i} style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 100px',
        gap: '1rem',
        padding: '0.75rem 1rem',
        borderBottom: i < 3 ? '1px solid rgba(148, 163, 184, 0.1)' : 'none',
      }}>
        <SkeletonLine width="90%" height="14px" />
        <SkeletonLine width="70%" height="14px" />
        <SkeletonLine width="80%" height="14px" />
        <SkeletonLine width="60px" height="28px" style={{ borderRadius: '999px' }} />
      </div>
    ))}
  </div>
);

// Form Skeleton
const FormSkeleton: React.FC = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '2rem',
    borderRadius: 'var(--radius-lg, 16px)',
    border: '1px solid var(--border, rgba(148, 163, 184, 0.2))',
    background: 'var(--bg-card, linear-gradient(to bottom right, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.95)))',
  }}>
    <SkeletonLine width="40%" height="24px" style={{ marginBottom: '0.5rem' }} />
    {[1, 2, 3].map((i) => (
      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <SkeletonLine width="80px" height="12px" />
        <SkeletonLine width="100%" height="40px" style={{ borderRadius: '999px' }} />
      </div>
    ))}
    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
      <SkeletonLine width="120px" height="40px" style={{ borderRadius: '999px' }} />
      <SkeletonLine width="100px" height="40px" style={{ borderRadius: '999px' }} />
    </div>
  </div>
);

// Page Loading Skeleton
export const PageLoadingSkeleton: React.FC<{ title?: string }> = ({ title }) => (
  <div style={{ padding: '1.5rem' }}>
    {title && (
      <div style={{ marginBottom: '1.5rem' }}>
        <SkeletonLine width="200px" height="28px" />
      </div>
    )}
    <div style={{ display: 'grid', gap: '1rem' }}>
      <CardSkeleton />
      <CardSkeleton />
    </div>
  </div>
);

// Dashboard Loading Skeleton
export const DashboardLoadingSkeleton: React.FC = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.7rem' }}>
    {[1, 2, 3, 4].map((i) => (
      <SensorSkeleton key={i} />
    ))}
  </div>
);

// List Loading Skeleton
export const ListLoadingSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
    {Array.from({ length: count }).map((_, i) => (
      <RowSkeleton key={i} />
    ))}
  </div>
);

// Inline Loading Spinner
export const InlineSpinner: React.FC<{ size?: number; color?: string }> = ({ 
  size = 20, 
  color 
}) => (
  <>
    <div style={{
      width: size,
      height: size,
      border: `2px solid var(--accent-soft, rgba(56, 189, 248, 0.2))`,
      borderTopColor: color || 'var(--accent, #38bdf8)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      display: 'inline-block',
    }} />
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </>
);

// Full Page Loading Overlay
export const LoadingOverlay: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div style={{
    position: 'fixed',
    inset: 0,
    background: 'var(--bg, rgba(2, 6, 23, 0.85))',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  }}>
    <div style={{
      width: '48px',
      height: '48px',
      border: '3px solid var(--accent-soft, rgba(56, 189, 248, 0.2))',
      borderTopColor: 'var(--accent, #38bdf8)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      marginBottom: '1rem',
    }} />
    <p style={{ color: 'var(--muted, #9ca3af)', fontSize: '0.9rem', fontWeight: 500 }}>{message}</p>
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Main LoadingSkeleton Component
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  count = 3, 
  type = 'card',
  width,
  height,
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return <CardSkeleton />;
      case 'row':
        return <RowSkeleton />;
      case 'text':
        return <TextSkeleton />;
      case 'avatar':
        return <AvatarSkeleton />;
      case 'button':
        return <ButtonSkeleton />;
      case 'metric':
        return <MetricSkeleton />;
      case 'sensor':
        return <SensorSkeleton />;
      case 'table':
        return <TableSkeleton />;
      case 'form':
        return <FormSkeleton />;
      default:
        return (
          <SkeletonLine 
            width={width || '100%'} 
            height={height || '120px'} 
          />
        );
    }
  };

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i}>{renderSkeleton()}</div>
        ))}
      </div>
    </>
  );
};
