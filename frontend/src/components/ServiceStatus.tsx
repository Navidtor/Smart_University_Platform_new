import React, { useEffect, useState } from 'react';

interface ServiceHealth {
  name: string;
  status: 'up' | 'down' | 'checking';
}

export const ServiceStatus: React.FC = () => {
  const [services, setServices] = useState<ServiceHealth[]>([
    { name: 'Gateway', status: 'checking' },
    { name: 'Auth', status: 'checking' },
    { name: 'Booking', status: 'checking' },
    { name: 'Marketplace', status: 'checking' },
    { name: 'Exam', status: 'checking' },
    { name: 'Dashboard', status: 'checking' },
  ]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      const endpoints = [
        { name: 'Gateway', url: '/actuator/health' },
        { name: 'Auth', url: '/auth/actuator/health' },
        { name: 'Booking', url: '/booking/actuator/health' },
        { name: 'Marketplace', url: '/market/actuator/health' },
        { name: 'Exam', url: '/exam/actuator/health' },
        { name: 'Dashboard', url: '/dashboard/actuator/health' },
      ];

      const baseUrl = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
      
      const results = await Promise.all(
        endpoints.map(async (ep) => {
          try {
            const res = await fetch(`${baseUrl}${ep.url}`, { 
              method: 'GET',
              signal: AbortSignal.timeout(5000)
            });
            return { name: ep.name, status: res.ok ? 'up' : 'down' } as ServiceHealth;
          } catch {
            return { name: ep.name, status: 'down' } as ServiceHealth;
          }
        })
      );
      setServices(results);
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const healthyCount = services.filter(s => s.status === 'up').length;
  const totalCount = services.length;
  const allHealthy = healthyCount === totalCount;
  const allDown = healthyCount === 0 && services.every(s => s.status === 'down');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up': return '#10b981';
      case 'down': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'transparent',
          border: '1px solid var(--border, #333)',
          borderRadius: '20px',
          padding: '0.25rem 0.75rem',
          cursor: 'pointer',
          color: 'var(--text, #fff)',
          fontSize: '0.75rem',
        }}
      >
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: allHealthy ? '#10b981' : allDown ? '#ef4444' : '#f59e0b',
          animation: allHealthy ? 'none' : 'pulse 2s infinite',
        }} />
        {allDown ? 'Offline' : `${healthyCount}/${totalCount} Services`}
      </button>

      {expanded && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '0.5rem',
          background: 'var(--card-bg, #1e1e2e)',
          border: '1px solid var(--border, #333)',
          borderRadius: '8px',
          padding: '0.75rem',
          minWidth: '200px',
          zIndex: 100,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
            Service Health
          </div>
          {services.map((svc) => (
            <div key={svc.name} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.25rem 0',
              fontSize: '0.8rem',
            }}>
              <span>{svc.name}</span>
              <span style={{
                color: getStatusColor(svc.status),
                fontWeight: 'bold',
              }}>
                {svc.status === 'checking' ? '...' : svc.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};
