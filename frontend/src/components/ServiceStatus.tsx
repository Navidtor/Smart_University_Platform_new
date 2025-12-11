import React, { useEffect, useState, useCallback } from 'react';

interface ServiceHealth {
  name: string;
  status: 'up' | 'down' | 'checking' | 'degraded';
  responseTime?: number;
  lastChecked?: Date;
  error?: string;
}

interface ServiceStatusProps {
  compact?: boolean;
  showResponseTime?: boolean;
  refreshInterval?: number;
}

export const ServiceStatus: React.FC<ServiceStatusProps> = ({ 
  compact = true,
  showResponseTime = true,
  refreshInterval = 30000 
}) => {
  const [services, setServices] = useState<ServiceHealth[]>([
    { name: 'Gateway', status: 'checking' },
    { name: 'Auth', status: 'checking' },
    { name: 'Booking', status: 'checking' },
    { name: 'Marketplace', status: 'checking' },
    { name: 'Exam', status: 'checking' },
    { name: 'Dashboard', status: 'checking' },
    { name: 'Payment', status: 'checking' },
    { name: 'Notification', status: 'checking' },
  ]);
  const [expanded, setExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const checkHealth = useCallback(async () => {
    setIsRefreshing(true);
    
    // Demo mode: when running in Tempo canvas or when backend is unreachable from cloud
    const isTempoCanvas = typeof window !== 'undefined' && 
      window.location.hostname.includes('canvases.tempo.build');
    
    if (isTempoCanvas) {
      // Show demo data in Tempo canvas since it can't reach localhost
      const demoServices: ServiceHealth[] = [
        { name: 'Gateway', status: 'up', responseTime: 45, lastChecked: new Date() },
        { name: 'Auth', status: 'up', responseTime: 62, lastChecked: new Date() },
        { name: 'Booking', status: 'up', responseTime: 58, lastChecked: new Date() },
        { name: 'Marketplace', status: 'up', responseTime: 71, lastChecked: new Date() },
        { name: 'Exam', status: 'up', responseTime: 55, lastChecked: new Date() },
        { name: 'Dashboard', status: 'up', responseTime: 48, lastChecked: new Date() },
        { name: 'Payment', status: 'up', responseTime: 52, lastChecked: new Date() },
        { name: 'Notification', status: 'up', responseTime: 67, lastChecked: new Date() },
      ];
      setServices(demoServices);
      setLastRefresh(new Date());
      setIsRefreshing(false);
      return;
    }
    
    const endpoints = [
      { name: 'Gateway', url: '/actuator/health' },
      { name: 'Auth', url: '/auth/actuator/health' },
      { name: 'Booking', url: '/booking/actuator/health' },
      { name: 'Marketplace', url: '/market/actuator/health' },
      { name: 'Exam', url: '/exam/actuator/health' },
      { name: 'Dashboard', url: '/dashboard/actuator/health' },
      { name: 'Payment', url: '/payment/actuator/health' },
      { name: 'Notification', url: '/notification/actuator/health' },
    ];

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    
    const results = await Promise.all(
      endpoints.map(async (ep) => {
        const startTime = performance.now();
        try {
          const res = await fetch(`${baseUrl}${ep.url}`, { 
            method: 'GET',
            signal: AbortSignal.timeout(5000)
          });
          const responseTime = Math.round(performance.now() - startTime);
          
          // Determine status based on response and response time
          let status: ServiceHealth['status'] = 'down';
          if (res.ok) {
            status = responseTime > 1000 ? 'degraded' : 'up';
          }
          
          return { 
            name: ep.name, 
            status,
            responseTime,
            lastChecked: new Date(),
          } as ServiceHealth;
        } catch (err) {
          return { 
            name: ep.name, 
            status: 'down',
            responseTime: Math.round(performance.now() - startTime),
            lastChecked: new Date(),
            error: err instanceof Error ? err.message : 'Connection failed',
          } as ServiceHealth;
        }
      })
    );
    
    setServices(results);
    setLastRefresh(new Date());
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, refreshInterval);
    return () => clearInterval(interval);
  }, [checkHealth, refreshInterval]);

  const healthyCount = services.filter(s => s.status === 'up').length;
  const degradedCount = services.filter(s => s.status === 'degraded').length;
  const totalCount = services.length;
  const allHealthy = healthyCount === totalCount;
  const allDown = services.every(s => s.status === 'down');
  const hasIssues = degradedCount > 0 || (healthyCount < totalCount && !allDown);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up': return '#10b981';
      case 'degraded': return '#f59e0b';
      case 'down': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'up': return '●';
      case 'degraded': return '◐';
      case 'down': return '○';
      default: return '◌';
    }
  };

  const getOverallStatus = () => {
    if (allDown) return { color: '#ef4444', text: 'Offline', bg: 'rgba(239, 68, 68, 0.15)' };
    if (allHealthy) return { color: '#10b981', text: 'All Systems Operational', bg: 'rgba(16, 185, 129, 0.15)' };
    if (hasIssues) return { color: '#f59e0b', text: 'Partial Outage', bg: 'rgba(245, 158, 11, 0.15)' };
    return { color: '#6b7280', text: 'Checking...', bg: 'rgba(107, 114, 128, 0.15)' };
  };

  const formatResponseTime = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 100) return `${ms}ms`;
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatLastRefresh = () => {
    if (!lastRefresh) return 'Never';
    const seconds = Math.floor((Date.now() - lastRefresh.getTime()) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  const overallStatus = getOverallStatus();

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: overallStatus.bg,
          border: `1px solid ${overallStatus.color}40`,
          borderRadius: '999px',
          padding: '0.3rem 0.85rem',
          cursor: 'pointer',
          color: '#e5e7eb',
          fontSize: '0.75rem',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = `${overallStatus.color}80`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = `${overallStatus.color}40`;
        }}
      >
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: overallStatus.color,
          animation: isRefreshing ? 'pulse 0.5s infinite' : (allHealthy ? 'none' : 'pulse 2s infinite'),
          boxShadow: `0 0 8px ${overallStatus.color}80`,
        }} />
        {compact ? (
          allDown ? 'Offline' : `${healthyCount}/${totalCount}`
        ) : (
          overallStatus.text
        )}
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '0.5rem',
          background: 'linear-gradient(to bottom right, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.95))',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          borderRadius: '12px',
          padding: '0',
          minWidth: '280px',
          zIndex: 100,
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease',
        }}>
          {/* Header */}
          <div style={{
            padding: '0.875rem 1rem',
            borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f9fafb' }}>
                Service Health
              </div>
              <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '2px' }}>
                Updated {formatLastRefresh()}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                checkHealth();
              }}
              disabled={isRefreshing}
              style={{
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '6px',
                padding: '0.35rem 0.6rem',
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                color: '#38bdf8',
                fontSize: '0.7rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s ease',
                opacity: isRefreshing ? 0.6 : 1,
              }}
            >
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                style={{
                  animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                }}
              >
                <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Status Banner */}
          <div style={{
            padding: '0.625rem 1rem',
            background: overallStatus.bg,
            borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: overallStatus.color,
              boxShadow: `0 0 8px ${overallStatus.color}60`,
            }} />
            <span style={{ fontSize: '0.8rem', color: overallStatus.color, fontWeight: 500 }}>
              {overallStatus.text}
            </span>
          </div>

          {/* Services List */}
          <div style={{ padding: '0.5rem 0' }}>
            {services.map((svc) => (
              <div 
                key={svc.name} 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 1rem',
                  fontSize: '0.8rem',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ 
                    color: getStatusColor(svc.status),
                    fontSize: '0.9rem',
                  }}>
                    {getStatusIcon(svc.status)}
                  </span>
                  <span style={{ color: '#e5e7eb' }}>{svc.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {showResponseTime && svc.responseTime !== undefined && (
                    <span style={{ 
                      color: '#6b7280', 
                      fontSize: '0.7rem',
                      fontFamily: 'monospace',
                    }}>
                      {formatResponseTime(svc.responseTime)}
                    </span>
                  )}
                  <span style={{
                    color: getStatusColor(svc.status),
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    minWidth: '50px',
                    textAlign: 'right',
                  }}>
                    {svc.status === 'checking' ? '...' : svc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            padding: '0.625rem 1rem',
            borderTop: '1px solid rgba(148, 163, 184, 0.15)',
            fontSize: '0.7rem',
            color: '#6b7280',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span>Auto-refresh: {refreshInterval / 1000}s</span>
            <span>{healthyCount} healthy • {degradedCount} degraded • {totalCount - healthyCount - degradedCount} down</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

// Full Page Service Dashboard Component
export const ServiceDashboard: React.FC = () => {
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const checkAllServices = useCallback(async () => {
    setIsLoading(true);
    
    // Demo mode: when running in Tempo canvas or when backend is unreachable from cloud
    const isTempoCanvas = typeof window !== 'undefined' && 
      window.location.hostname.includes('canvases.tempo.build');
    
    if (isTempoCanvas) {
      // Show demo data in Tempo canvas since it can't reach localhost
      const demoServices: ServiceHealth[] = [
        { name: 'API Gateway', status: 'up', responseTime: 45, lastChecked: new Date() },
        { name: 'Auth Service', status: 'up', responseTime: 62, lastChecked: new Date() },
        { name: 'Booking Service', status: 'up', responseTime: 58, lastChecked: new Date() },
        { name: 'Marketplace Service', status: 'up', responseTime: 71, lastChecked: new Date() },
        { name: 'Exam Service', status: 'up', responseTime: 55, lastChecked: new Date() },
        { name: 'Dashboard Service', status: 'up', responseTime: 48, lastChecked: new Date() },
        { name: 'Payment Service', status: 'up', responseTime: 52, lastChecked: new Date() },
        { name: 'Notification Service', status: 'up', responseTime: 67, lastChecked: new Date() },
      ];
      setServices(demoServices);
      setLastRefresh(new Date());
      setIsLoading(false);
      return;
    }
    
    const endpoints = [
      { name: 'API Gateway', url: '/actuator/health', description: 'Main entry point for all API requests' },
      { name: 'Auth Service', url: '/auth/actuator/health', description: 'Authentication and authorization' },
      { name: 'Booking Service', url: '/booking/actuator/health', description: 'Resource reservation management' },
      { name: 'Marketplace Service', url: '/market/actuator/health', description: 'Product catalog and orders' },
      { name: 'Exam Service', url: '/exam/actuator/health', description: 'Online examination system' },
      { name: 'Dashboard Service', url: '/dashboard/actuator/health', description: 'IoT sensor data aggregation' },
      { name: 'Payment Service', url: '/payment/actuator/health', description: 'Payment processing' },
      { name: 'Notification Service', url: '/notification/actuator/health', description: 'Event notifications' },
    ];

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    
    const results = await Promise.all(
      endpoints.map(async (ep) => {
        const startTime = performance.now();
        try {
          const res = await fetch(`${baseUrl}${ep.url}`, { 
            method: 'GET',
            signal: AbortSignal.timeout(5000)
          });
          const responseTime = Math.round(performance.now() - startTime);
          
          return { 
            name: ep.name, 
            status: res.ok ? (responseTime > 1000 ? 'degraded' : 'up') : 'down',
            responseTime,
            lastChecked: new Date(),
          } as ServiceHealth;
        } catch (err) {
          return { 
            name: ep.name, 
            status: 'down',
            responseTime: Math.round(performance.now() - startTime),
            lastChecked: new Date(),
            error: err instanceof Error ? err.message : 'Connection failed',
          } as ServiceHealth;
        }
      })
    );
    
    setServices(results);
    setLastRefresh(new Date());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkAllServices();
    const interval = setInterval(checkAllServices, 30000);
    return () => clearInterval(interval);
  }, [checkAllServices]);

  const healthyCount = services.filter(s => s.status === 'up').length;
  const degradedCount = services.filter(s => s.status === 'degraded').length;
  const downCount = services.filter(s => s.status === 'down').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up': return '#10b981';
      case 'degraded': return '#f59e0b';
      case 'down': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div className="card-header">
        <div>
          <div className="card-title">🏥 Service Health Dashboard</div>
          <div className="card-subtitle">
            Real-time status of all microservices
          </div>
        </div>
        <button 
          className="btn-ghost"
          onClick={checkAllServices}
          disabled={isLoading}
        >
          {isLoading ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.75rem',
        marginBottom: '1rem',
      }}>
        <div style={{
          padding: '0.75rem',
          borderRadius: '10px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
            {healthyCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Healthy</div>
        </div>
        <div style={{
          padding: '0.75rem',
          borderRadius: '10px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>
            {degradedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Degraded</div>
        </div>
        <div style={{
          padding: '0.75rem',
          borderRadius: '10px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>
            {downCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Down</div>
        </div>
      </div>

      {/* Services Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0.75rem',
      }}>
        {services.map((svc) => (
          <div 
            key={svc.name}
            style={{
              padding: '0.875rem',
              borderRadius: '10px',
              border: `1px solid ${getStatusColor(svc.status)}40`,
              background: `${getStatusColor(svc.status)}10`,
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '0.5rem',
            }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#e5e7eb' }}>
                {svc.name}
              </span>
              <span style={{
                padding: '0.15rem 0.5rem',
                borderRadius: '999px',
                fontSize: '0.65rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                background: `${getStatusColor(svc.status)}20`,
                color: getStatusColor(svc.status),
              }}>
                {svc.status}
              </span>
            </div>
            {svc.responseTime !== undefined && (
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                Response: {svc.responseTime}ms
              </div>
            )}
            {svc.error && (
              <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '0.25rem' }}>
                {svc.error}
              </div>
            )}
          </div>
        ))}
      </div>

      {lastRefresh && (
        <div style={{
          marginTop: '1rem',
          fontSize: '0.7rem',
          color: '#6b7280',
          textAlign: 'center',
        }}>
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};
