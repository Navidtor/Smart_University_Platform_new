import React from 'react';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = ''
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'circular':
        return {
          borderRadius: '50%',
          width: width || 40,
          height: height || 40,
        };
      case 'rectangular':
        return {
          borderRadius: 'var(--radius, 8px)',
          width: width || '100%',
          height: height || 100,
        };
      case 'card':
        return {
          borderRadius: 'var(--radius-lg, 16px)',
          width: width || '100%',
          height: height || 200,
        };
      case 'text':
      default:
        return {
          borderRadius: '4px',
          width: width || '100%',
          height: height || 16,
        };
    }
  };

  return (
    <>
      <div 
        className={`skeleton ${className}`} 
        style={getVariantStyles()}
      />
      <style>{`
        .skeleton {
          background: linear-gradient(
            90deg,
            var(--bg-elevated, #1e293b) 25%,
            var(--border, rgba(148, 163, 184, 0.3)) 50%,
            var(--bg-elevated, #1e293b) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  );
};

// Preset skeleton layouts
export const CardSkeleton: React.FC = () => (
  <div className="card-skeleton">
    <Skeleton variant="rectangular" height={120} />
    <div style={{ padding: '1rem' }}>
      <Skeleton variant="text" width="60%" style={{ marginBottom: '0.5rem' }} />
      <Skeleton variant="text" width="40%" />
    </div>
    <style>{`
      .card-skeleton {
        border-radius: var(--radius-lg, 16px);
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        overflow: hidden;
      }
    `}</style>
  </div>
);

export const ListItemSkeleton: React.FC = () => (
  <div className="list-item-skeleton">
    <Skeleton variant="circular" width={40} height={40} />
    <div style={{ flex: 1 }}>
      <Skeleton variant="text" width="70%" style={{ marginBottom: '0.25rem' }} />
      <Skeleton variant="text" width="40%" height={12} />
    </div>
    <style>{`
      .list-item-skeleton {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem;
      }
    `}</style>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="table-skeleton">
    <div className="table-skeleton-header">
      {[1, 2, 3, 4].map(i => (
        <Skeleton key={i} variant="text" width={`${20 + Math.random() * 10}%`} />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, idx) => (
      <div key={idx} className="table-skeleton-row">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} variant="text" width={`${30 + Math.random() * 20}%`} />
        ))}
      </div>
    ))}
    <style>{`
      .table-skeleton {
        border: 1px solid var(--border);
        border-radius: var(--radius);
        overflow: hidden;
      }
      .table-skeleton-header {
        display: flex;
        gap: 1rem;
        padding: 0.75rem 1rem;
        background: var(--bg-surface);
        border-bottom: 1px solid var(--border);
      }
      .table-skeleton-row {
        display: flex;
        gap: 1rem;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--border);
      }
      .table-skeleton-row:last-child {
        border-bottom: none;
      }
    `}</style>
  </div>
);
