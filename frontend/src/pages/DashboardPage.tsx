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

export const DashboardPage: React.FC = () => {
  const api = useConfiguredApi();
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [shuttles, setShuttles] = useState<Shuttle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [sensorsRes, shuttlesRes] = await Promise.all([
        api.get<Sensor[]>('/dashboard/sensors'),
        api.get<Shuttle[]>('/dashboard/shuttles')
      ]);
      setSensors(sensorsRes.data);
      setShuttles(shuttlesRes.data);
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
    // Map lat/lon deltas to 0-100%
    const baseLat = shuttle.latitude - 0.001;
    const baseLon = shuttle.longitude - 0.001;
    const maxLat = baseLat + 0.002;
    const maxLon = baseLon + 0.002;
    const x = ((shuttle.longitude - baseLon) / (maxLon - baseLon)) * 100;
    const y = ((maxLat - shuttle.latitude) / (maxLat - baseLat)) * 100;
    return { x, y };
  }, [shuttle]);

  return (
    <div className="app-grid">
      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Campus sensors</div>
            <div className="card-subtitle">Live readings from simulated IoT devices</div>
          </div>
          <div className="chip chip-live">LIVE STREAM</div>
        </div>
        {loading && <div className="card-subtitle">Loading latest metrics…</div>}
        {!loading && (
          <div className="grid-sensors">
            {sensors.map((s) => (
              <div key={s.id} className="sensor-card">
                <div className="sensor-name">{s.label}</div>
                <div className="sensor-value">
                  {s.value.toFixed(1)} {s.unit}
                </div>
                <div className="sensor-meta">
                  {s.type} · updated {new Date(s.updatedAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Shuttle tracking</div>
            <div className="card-subtitle">Simulated campus shuttle position</div>
          </div>
          <div className="chip">Updated every few seconds</div>
        </div>
        <div className="shuttle-map">
          {shuttle && shuttlePosition && (
            <div
              className="shuttle-dot"
              style={{ left: `${shuttlePosition.x}%`, top: `${shuttlePosition.y}%` }}
              title={shuttle.name}
            />
          )}
        </div>
      </section>
    </div>
  );
};