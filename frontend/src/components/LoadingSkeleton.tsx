import React from 'react';

interface LoadingSkeletonProps {
  count?: number;
  type?: 'card' | 'row' | 'text';
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  count = 3, 
  type = 'card' 
}) => {
  const skeletonStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, var(--card-bg, #1e1e2e) 25%, var(--border, #333) 50%, var(--card-bg, #1e1e2e) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: '8px',
  };

  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div style={{
            ...skeletonStyle,
            height: '120px',
            width: '100%',
          }} />
        );
      case 'row':
        return (
          <div style={{
            ...skeletonStyle,
            height: '48px',
            width: '100%',
          }} />
        );
      case 'text':
        return (
          <div style={{
            ...skeletonStyle,
            height: '16px',
            width: `${60 + Math.random() * 40}%`,
          }} />
        );
      default:
        return null;
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
