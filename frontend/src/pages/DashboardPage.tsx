import React, { useEffect, useMemo, useState } from 'react';
import { useConfiguredApi } from '../api/client';

type Sensor = {
  id: string;
  type: string;
  label: string;
  value: number;
  unit: string;
  updatedAt: string;
};

type Shuttle = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
};

// Sensor configuration with icons and thresholds
const SENSOR_CONFIG: Record<string, {
  icon: string;
  thresholds: { low: number; high: number };
  labels: { low: string; normal: string; high: string };
}> = {
  TEMPERATURE: {
    icon: '🌡️',
    thresholds: { low: 18, high: 24 },
    labels: { low: 'Cold', normal: 'Comfortable', high: 'Warm' }
  },
  HUMIDITY: {
    icon: '💧',
    thresholds: { low: 30, high: 60 },
    labels: { low: 'Dry', normal: 'Optimal', high: 'Humid' }
  },
  CO2: {
    icon: '🌬️',
    thresholds: { low: 0, high: 800 },
    labels: { low: 'Fresh', normal: 'Good', high: 'Ventilate!' }
  },
  ENERGY_USAGE: {
    icon: '⚡',
    thresholds: { low: 0, high: 200 },
    labels: { low: 'Low', normal: 'Normal', high: 'High' }
  }
};

// Get sensor status based on value
const getSensorStatus = (type: string, value: number): { 
  status: 'low' | 'normal' | 'high'; 
  color: string; 
  label: string;
  percentage: number;
} => {
  const config = SENSOR_CONFIG[type] || {
    thresholds: { low: 0, high: 100 },
    labels: { low: 'Low', normal: 'Normal', high: 'High' }
  };
  
  const { thresholds, labels } = config;
  
  // Calculate percentage for progress bar (0-100)
  const range = thresholds.high - thresholds.low;
  const percentage = Math.min(100, Math.max(0, ((value - thresholds.low) / range) * 100));
  
  if (type === 'CO2') {
    // For CO2, lower is better
    if (value <= 600) return { status: 'low', color: 'var(--success)', label: labels.low, percentage };
    if (value <= 800) return { status: 'normal', color: 'var(--warning)', label: labels.normal, percentage };
    return { status: 'high', color: 'var(--danger)', label: labels.high, percentage };
  }
  
  if (value < thresholds.low) {
    return { status: 'low', color: 'var(--info)', label: labels.low, percentage: 20 };
  }
  if (value <= thresholds.high) {
    return { status: 'normal', color: 'var(--success)', label: labels.normal, percentage };
  }
  return { status: 'high', color: 'var(--warning)', label: labels.high, percentage: 100 };
};

// Get icon for sensor type
const getSensorIcon = (type: string): string => {
  return SENSOR_CONFIG[type]?.icon || '📊';
};

// Format time ago
const formatTimeAgo = (dateStr: string): string => {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
};

export const DashboardPage: React.FC = () => {
  const api = useConfiguredApi();
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [shuttles, setShuttles] = useState<Shuttle[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      const [sensorsRes, shuttlesRes] = await Promise.all([
        api.get<Sensor[]>('/dashboard/sensors'),
        api.get<Shuttle[]>('/dashboard/shuttles')
      ]);
      setSensors(sensorsRes.data);
      setShuttles(shuttlesRes.data);
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer: number | undefined;
    const loop = async () => {
      await fetchData();
      timer = window.setTimeout(loop, 6000);
    };
    loop();
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  const shuttle = shuttles[0];

  const shuttlePosition = useMemo(() => {
    if (!shuttle) {
      return null;
    }
    const baseLat = shuttle.latitude - 0.001;
    const baseLon = shuttle.longitude - 0.001;
    const maxLat = baseLat + 0.002;
    const maxLon = baseLon + 0.002;
    const x = ((shuttle.longitude - baseLon) / (maxLon - baseLon)) * 100;
    const y = ((maxLat - shuttle.latitude) / (maxLat - baseLat)) * 100;
    return { x: Math.max(10, Math.min(90, x)), y: Math.max(10, Math.min(90, y)) };
  }, [shuttle]);

  return (
    <div className="app-grid">
      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <span className="title-icon">📡</span>
              Campus Sensors
            </div>
            <div className="card-subtitle">Live readings from IoT devices across campus</div>
          </div>
          <div className="header-right">
            <div className="chip chip-live">
              <span className="live-dot" />
              LIVE
            </div>
            {lastUpdate && (
              <div className="last-update">
                Updated {formatTimeAgo(lastUpdate.toISOString())}
              </div>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="skeleton-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-icon" />
                <div className="skeleton-text" />
                <div className="skeleton-value" />
              </div>
            ))}
          </div>
        ) : (
          <div className="sensors-grid">
            {sensors.map((s) => {
              const status = getSensorStatus(s.type, s.value);
              const icon = getSensorIcon(s.type);
              
              return (
                <div key={s.id} className="sensor-card-enhanced">
                  <div className="sensor-header">
                    <span className="sensor-icon">{icon}</span>
                    <span className="sensor-label">{s.label}</span>
                  </div>
                  
                  <div className="sensor-value-row">
                    <span className="sensor-value" style={{ color: status.color }}>
                      {s.value.toFixed(1)}
                    </span>
                    <span className="sensor-unit">{s.unit}</span>
                  </div>
                  
                  <div className="sensor-progress">
                    <div 
                      className="sensor-progress-bar" 
                      style={{ 
                        width: `${status.percentage}%`,
                        backgroundColor: status.color 
                      }} 
                    />
                  </div>
                  
                  <div className="sensor-footer">
                    <span 
                      className="sensor-status" 
                      style={{ 
                        color: status.color,
                        backgroundColor: `${status.color}20`
                      }}
                    >
                      {status.label}
                    </span>
                    <span className="sensor-time">{formatTimeAgo(s.updatedAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <span className="title-icon">🚌</span>
              Shuttle Tracking
            </div>
            <div className="card-subtitle">Real-time campus shuttle location</div>
          </div>
          <div className="chip">Auto-updating</div>
        </div>
        
        <div className="shuttle-map-enhanced">
          {/* Campus background illustration */}
          <svg className="campus-bg" viewBox="0 0 200 150" preserveAspectRatio="none">
            {/* Roads */}
            <path d="M0,75 L200,75" stroke="var(--border)" strokeWidth="8" strokeDasharray="4,4" />
            <path d="M100,0 L100,150" stroke="var(--border)" strokeWidth="8" strokeDasharray="4,4" />
            
            {/* Buildings */}
            <rect x="20" y="20" width="30" height="25" rx="3" fill="var(--bg-elevated)" stroke="var(--border)" />
            <text x="35" y="36" textAnchor="middle" fill="var(--muted)" fontSize="6">Library</text>
            
            <rect x="150" y="20" width="35" height="30" rx="3" fill="var(--bg-elevated)" stroke="var(--border)" />
            <text x="167" y="38" textAnchor="middle" fill="var(--muted)" fontSize="6">Science</text>
            
            <rect x="20" y="100" width="40" height="30" rx="3" fill="var(--bg-elevated)" stroke="var(--border)" />
            <text x="40" y="118" textAnchor="middle" fill="var(--muted)" fontSize="6">Engineering</text>
            
            <rect x="140" y="100" width="45" height="35" rx="3" fill="var(--bg-elevated)" stroke="var(--border)" />
            <text x="162" y="120" textAnchor="middle" fill="var(--muted)" fontSize="6">Student Center</text>
            
            {/* Shuttle stops */}
            <circle cx="50" cy="75" r="5" fill="var(--accent)" opacity="0.3" />
            <circle cx="100" cy="75" r="5" fill="var(--accent)" opacity="0.3" />
            <circle cx="150" cy="75" r="5" fill="var(--accent)" opacity="0.3" />
          </svg>
          
          {shuttle && shuttlePosition && (
            <div
              className="shuttle-marker"
              style={{ left: `${shuttlePosition.x}%`, top: `${shuttlePosition.y}%` }}
            >
              <div className="shuttle-icon">🚌</div>
              <div className="shuttle-pulse" />
              <div className="shuttle-pulse delay" />
            </div>
          )}
          
          {shuttle && (
            <div className="shuttle-info">
              <span className="shuttle-name">{shuttle.name}</span>
              <span className="shuttle-coords">
                {shuttle.latitude.toFixed(4)}, {shuttle.longitude.toFixed(4)}
              </span>
            </div>
          )}
        </div>
        
        {/* Shuttle schedule hint */}
        <div className="shuttle-schedule">
          <span className="schedule-icon">🕐</span>
          <span>Next stops: Library → Science → Student Center</span>
        </div>
      </section>

      <style>{`
        .title-icon {
          margin-right: 0.5rem;
        }

        .header-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
        }

        .chip-live {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--success);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        .last-update {
          font-size: 0.7rem;
          color: var(--muted);
        }

        /* Skeleton loading */
        .skeleton-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
        }

        .skeleton-card {
          padding: 1rem;
          border-radius: var(--radius);
          background: var(--bg-elevated);
          animation: shimmer 1.5s infinite;
        }

        .skeleton-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: var(--border);
          margin-bottom: 0.75rem;
        }

        .skeleton-text {
          width: 60%;
          height: 12px;
          border-radius: 4px;
          background: var(--border);
          margin-bottom: 0.5rem;
        }

        .skeleton-value {
          width: 40%;
          height: 24px;
          border-radius: 4px;
          background: var(--border);
        }

        @keyframes shimmer {
          0% { opacity: 0.5; }
          50% { opacity: 0.8; }
          100% { opacity: 0.5; }
        }

        /* Enhanced sensor cards */
        .sensors-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .sensor-card-enhanced {
          padding: 1rem 1.25rem;
          border-radius: var(--radius-lg);
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          transition: all 0.3s ease;
        }

        .sensor-card-enhanced:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--border-hover);
        }

        .sensor-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .sensor-icon {
          font-size: 1.5rem;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-soft);
          border-radius: 10px;
        }

        .sensor-label {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .sensor-value-row {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
          margin-bottom: 0.75rem;
        }

        .sensor-value {
          font-size: 2rem;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          line-height: 1;
        }

        .sensor-unit {
          font-size: 0.9rem;
          color: var(--muted);
          font-weight: 500;
        }

        .sensor-progress {
          height: 4px;
          background: var(--border);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 0.75rem;
        }

        .sensor-progress-bar {
          height: 100%;
          border-radius: 2px;
          transition: width 0.5s ease, background-color 0.3s ease;
        }

        .sensor-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sensor-status {
          font-size: 0.7rem;
          font-weight: 600;
          padding: 0.2rem 0.5rem;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .sensor-time {
          font-size: 0.7rem;
          color: var(--muted);
        }

        /* Enhanced shuttle map */
        .shuttle-map-enhanced {
          position: relative;
          border-radius: var(--radius-lg);
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          height: 220px;
          overflow: hidden;
        }

        .campus-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0.8;
        }

        .shuttle-marker {
          position: absolute;
          transform: translate(-50%, -50%);
          z-index: 10;
        }

        .shuttle-icon {
          font-size: 1.5rem;
          position: relative;
          z-index: 2;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          animation: bounce 2s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        .shuttle-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--accent);
          opacity: 0.3;
          transform: translate(-50%, -50%);
          animation: shuttle-pulse 2s ease-out infinite;
        }

        .shuttle-pulse.delay {
          animation-delay: 0.5s;
        }

        @keyframes shuttle-pulse {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.4; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }

        .shuttle-info {
          position: absolute;
          bottom: 0.75rem;
          left: 0.75rem;
          background: var(--bg-card);
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .shuttle-name {
          font-weight: 600;
          font-size: 0.8rem;
          color: var(--text);
        }

        .shuttle-coords {
          font-size: 0.7rem;
          color: var(--muted);
          font-family: 'JetBrains Mono', monospace;
        }

        .shuttle-schedule {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.75rem;
          padding: 0.625rem 0.875rem;
          background: var(--accent-soft);
          border-radius: var(--radius);
          font-size: 0.8rem;
          color: var(--muted);
        }

        .schedule-icon {
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
};
