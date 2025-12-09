import React, { useEffect, useState } from 'react';
import { useConfiguredApi } from '../api/client';
import { useToast } from '../components/Toast';

type Resource = {
  id: string;
  name: string;
  type: string;
  capacity?: number;
};

export const BookingPage: React.FC = () => {
  const api = useConfiguredApi();
  const { showToast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Resource[]>('/booking/resources')
      .then((res) => {
        setResources(res.data);
        if (res.data.length > 0) {
          setSelectedResourceId(res.data[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, [api]);

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!selectedResourceId || !startTime || !endTime) {
      setMessage('Please choose a resource and time range.');
      return;
    }
    const startIso = new Date(startTime).toISOString();
    const endIso = new Date(endTime).toISOString();
    try {
      await api.post('/booking/reservations', {
        resourceId: selectedResourceId,
        startTime: startIso,
        endTime: endIso
      });
      setMessage('Reservation created successfully.');
      showToast('Reservation created!', 'success');
    } catch (err: any) {
      const msg =
        err.response?.status === 409
          ? 'That slot is already booked. Try another time.'
          : err.response?.data?.message ?? 'Failed to create reservation.';
      setMessage(msg);
      showToast(err.response?.status === 409 ? 'Slot already booked' : 'Reservation failed', 'error');
    }
  };

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Resource booking</div>
          <div className="card-subtitle">Classrooms, labs, and other shared spaces</div>
        </div>
        <div className="chip">Live demo</div>
      </div>
      {loading && <div className="card-subtitle">Loading resources…</div>}
      {!loading && (
        <>
          <div className="grid-sensors">
            {resources.map((r) => (
              <div key={r.id} className="sensor-card">
                <div className="sensor-name">{r.name}</div>
                <div className="sensor-meta">
                  {r.type || 'RESOURCE'}
                  {r.capacity ? ` · capacity ${r.capacity}` : ''}
                </div>
              </div>
            ))}
            {resources.length === 0 && <div className="card-subtitle">No resources registered yet.</div>}
          </div>
          {resources.length > 0 && (
            <form onSubmit={handleCreateReservation} style={{ marginTop: '1rem' }}>
              <div className="form-field">
                <label className="form-label">Resource</label>
                <select
                  className="form-input"
                  value={selectedResourceId ?? ''}
                  onChange={(e) => setSelectedResourceId(e.target.value)}
                >
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Start time</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label className="form-label">End time</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary">
                Request reservation
              </button>
              {message && (
                <div className="card-subtitle" style={{ marginTop: '0.5rem' }}>
                  {message}
                </div>
              )}
            </form>
          )}
        </>
      )}
    </section>
  );
};