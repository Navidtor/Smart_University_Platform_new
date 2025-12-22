import React, { useEffect, useState, useMemo } from 'react';
import { useConfiguredApi } from '../api/client';
import { useToast } from '../components/Toast';
import { useAuth } from '../state/AuthContext';

type Resource = {
  id: string;
  name: string;
  type: string;
  capacity?: number;
};

type Reservation = {
  id: string;
  resourceId: string;
  resourceName?: string;  // FIX: Added for better UX
  userId: string;
  startTime: string;
  endTime: string;
  status: string;
};

// Generate time slots for a day
const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => {
  const hour = 8 + i; // 8 AM to 7 PM
  return {
    hour,
    label: `${hour.toString().padStart(2, '0')}:00`,
    value: hour
  };
});

// Generate dates for the week
const getWeekDates = (startDate: Date): Date[] => {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const formatDateISO = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const BookingPage: React.FC = () => {
  const api = useConfiguredApi();
  const { showToast } = useToast();
  const { userId } = useAuth();
  
  const [resources, setResources] = useState<Resource[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  
  // Quick booking form
  const [showQuickBook, setShowQuickBook] = useState(false);
  const [quickBookSlot, setQuickBookSlot] = useState<{ date: Date; hour: number } | null>(null);
  const [duration, setDuration] = useState(1);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  // Fetch resources and reservations
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resourcesRes, reservationsRes] = await Promise.all([
          api.get<Resource[]>('/booking/resources'),
          api.get<Reservation[]>('/booking/reservations')
        ]);
        setResources(resourcesRes.data);
        setReservations(reservationsRes.data);
        
        if (resourcesRes.data.length > 0 && !selectedResourceId) {
          setSelectedResourceId(resourcesRes.data[0].id);
        }
        
        // Filter user's reservations
        if (userId) {
          setMyReservations(reservationsRes.data.filter(r => r.userId === userId));
        }
      } catch (error) {
        showToast('Failed to load booking data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [api, userId]);

  // Check if a slot is booked
  const isSlotBooked = (resourceId: string, date: Date, hour: number): 'available' | 'booked' | 'mine' => {
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(hour + 1);

    for (const res of reservations) {
      if (res.resourceId !== resourceId) continue;
      if (res.status !== 'CREATED') continue;
      
      const resStart = new Date(res.startTime);
      const resEnd = new Date(res.endTime);
      
      if (slotStart < resEnd && slotEnd > resStart) {
        return res.userId === userId ? 'mine' : 'booked';
      }
    }
    return 'available';
  };

  // Handle slot click
  const handleSlotClick = (date: Date, hour: number) => {
    const status = isSlotBooked(selectedResourceId!, date, hour);
    if (status === 'booked') {
      showToast('This slot is already booked', 'warning');
      return;
    }
    if (status === 'mine') {
      showToast('You already have this slot booked', 'info');
      return;
    }
    
    setQuickBookSlot({ date, hour });
    setShowQuickBook(true);
    setDuration(1);
    setBookingMessage(null);
  };

  // Create reservation
  const handleBookSlot = async () => {
    if (!quickBookSlot || !selectedResourceId) return;
    
    setIsBooking(true);
    setBookingMessage(null);
    
    const startTime = new Date(quickBookSlot.date);
    startTime.setHours(quickBookSlot.hour, 0, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + duration);
    
    try {
      await api.post('/booking/reservations', {
        resourceId: selectedResourceId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });
      
      showToast('Reservation created successfully!', 'success');
      setShowQuickBook(false);
      setQuickBookSlot(null);
      
      // Refresh reservations
      const res = await api.get<Reservation[]>('/booking/reservations');
      setReservations(res.data);
      if (userId) {
        setMyReservations(res.data.filter(r => r.userId === userId));
      }
    } catch (err: any) {
      const msg = err.response?.status === 409
        ? 'This slot is no longer available. Someone else just booked it.'
        : err.response?.data?.message ?? 'Failed to create reservation.';
      setBookingMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsBooking(false);
    }
  };

  
  // FIX #6: Cancel reservation functionality
  const handleCancelReservation = async (reservationId: string) => {
    if (cancelingId) return;
    
    setCancelingId(reservationId);
    try {
      await api.delete(`/booking/reservations/${reservationId}`);
      showToast('Reservation cancelled successfully', 'success');
      
      // Refresh reservations
      const res = await api.get<Reservation[]>('/booking/reservations');
      setReservations(res.data);
      if (userId) {
        setMyReservations(res.data.filter(r => r.userId === userId && r.status === 'CREATED'));
      }
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Failed to cancel reservation';
      showToast(msg, 'error');
    } finally {
      setCancelingId(null);
    }
  };

// Navigate weeks
  const goToPreviousWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(weekStart.getDate() - 7);
    setWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(weekStart.getDate() + 7);
    setWeekStart(newStart);
  };

  const goToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setWeekStart(today);
  };

  const selectedResource = resources.find(r => r.id === selectedResourceId);

  // Resource icon based on type
  const getResourceIcon = (type?: string): string => {
    switch (type?.toLowerCase()) {
      case 'classroom': return '🏫';
      case 'lab': return '🔬';
      case 'library': return '📚';
      case 'gym': return '🏋️';
      case 'auditorium': return '🎭';
      default: return '🏢';
    }
  };

  return (
    <div className="booking-page">
      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <span className="title-icon">📅</span>
              Resource Booking
            </div>
            <div className="card-subtitle">Book classrooms, labs, and other campus spaces</div>
          </div>
          <div className="chip">Live availability</div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <span>Loading resources...</span>
          </div>
        ) : (
          <>
            {/* Resource selector */}
            <div className="resource-selector">
              <label className="form-label">Select a resource:</label>
              <div className="resource-pills">
                {resources.map(r => (
                  <button
                    key={r.id}
                    className={`resource-pill ${selectedResourceId === r.id ? 'active' : ''}`}
                    onClick={() => setSelectedResourceId(r.id)}
                  >
                    <span className="resource-icon">{getResourceIcon(r.type)}</span>
                    <span className="resource-name">{r.name}</span>
                    {r.capacity && <span className="resource-capacity">({r.capacity})</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Week navigation */}
            <div className="week-nav">
              <button className="btn-ghost" onClick={goToPreviousWeek}>← Previous</button>
              <button className="btn-ghost today-btn" onClick={goToToday}>Today</button>
              <span className="week-label">
                {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
              </span>
              <button className="btn-ghost" onClick={goToNextWeek}>Next →</button>
            </div>

            {/* Calendar grid */}
            {selectedResourceId && (
              <div className="calendar-grid">
                {/* Header row */}
                <div className="calendar-header">
                  <div className="time-column-header">Time</div>
                  {weekDates.map(date => (
                    <div 
                      key={formatDateISO(date)} 
                      className={`day-header ${formatDateISO(date) === formatDateISO(new Date()) ? 'today' : ''}`}
                    >
                      <span className="day-name">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                      <span className="day-number">{date.getDate()}</span>
                    </div>
                  ))}
                </div>

                {/* Time slots */}
                {TIME_SLOTS.map(slot => (
                  <div key={slot.hour} className="calendar-row">
                    <div className="time-label">{slot.label}</div>
                    {weekDates.map(date => {
                      const status = isSlotBooked(selectedResourceId, date, slot.hour);
                      const isPast = new Date(date.setHours(slot.hour)) < new Date();
                      
                      return (
                        <div
                          key={`${formatDateISO(date)}-${slot.hour}`}
                          className={`calendar-slot ${status} ${isPast ? 'past' : ''}`}
                          onClick={() => !isPast && handleSlotClick(date, slot.hour)}
                          title={
                            status === 'booked' ? 'Booked by someone else' :
                            status === 'mine' ? 'Your reservation' :
                            isPast ? 'Past slot' : 'Click to book'
                          }
                        >
                          {status === 'mine' && <span className="slot-icon">✓</span>}
                          {status === 'booked' && <span className="slot-icon">✕</span>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* Legend */}
            <div className="calendar-legend">
              <div className="legend-item">
                <span className="legend-dot available" />
                <span>Available</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot booked" />
                <span>Booked</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot mine" />
                <span>Your booking</span>
              </div>
            </div>
          </>
        )}
      </section>

      {/* My Reservations */}
      <section className="card my-reservations">
        <div className="card-header">
          <div>
            <div className="card-title">
              <span className="title-icon">📋</span>
              My Reservations
            </div>
            <div className="card-subtitle">Your upcoming bookings</div>
          </div>
        </div>

        {myReservations.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>You don't have any reservations yet.</p>
            <p className="empty-hint">Click on an available slot in the calendar to make a booking.</p>
          </div>
        ) : (
          <div className="reservations-list">
            {myReservations
              .filter(r => new Date(r.endTime) > new Date())
              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
              .map(res => {
                const resource = resources.find(r => r.id === res.resourceId);
                const start = new Date(res.startTime);
                const end = new Date(res.endTime);
                
                return (
                  <div key={res.id} className="reservation-card">
                    <span className="res-icon">{getResourceIcon(resource?.type)}</span>
                    <div className="res-details">
                      <span className="res-name">{res.resourceName || resource?.name || 'Unknown'}</span>
                      <span className="res-time">
                        {start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        {' • '}
                        {start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className={`res-status ${res.status.toLowerCase()}`}>
                      {res.status}
                    </span>
                    {/* FIX #6: Cancel button */}
                    <button
                      className="btn-cancel"
                      onClick={() => handleCancelReservation(res.id)}
                      disabled={cancelingId === res.id}
                    >
                      {cancelingId === res.id ? '...' : '✕'}
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </section>

      {/* Quick booking modal */}
      {showQuickBook && quickBookSlot && (
        <div className="modal-overlay" onClick={() => setShowQuickBook(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Book {selectedResource?.name}</h3>
              <button className="modal-close" onClick={() => setShowQuickBook(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="booking-details">
                <div className="detail-row">
                  <span className="detail-label">📅 Date:</span>
                  <span className="detail-value">
                    {quickBookSlot.date.toLocaleDateString('en-US', { 
                      weekday: 'long', month: 'long', day: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">🕐 Start time:</span>
                  <span className="detail-value">{quickBookSlot.hour}:00</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">⏱️ Duration:</span>
                  <div className="duration-selector">
                    {[1, 2, 3, 4].map(d => (
                      <button
                        key={d}
                        className={`duration-btn ${duration === d ? 'active' : ''}`}
                        onClick={() => setDuration(d)}
                      >
                        {d}h
                      </button>
                    ))}
                  </div>
                </div>
                <div className="detail-row">
                  <span className="detail-label">🏁 End time:</span>
                  <span className="detail-value">{quickBookSlot.hour + duration}:00</span>
                </div>
              </div>

              {bookingMessage && (
                <div className="booking-error">
                  <span>⚠️</span> {bookingMessage}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setShowQuickBook(false)}>
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleBookSlot}
                disabled={isBooking}
              >
                {isBooking ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .booking-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .title-icon {
          margin-right: 0.5rem;
        }

        .loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 3rem;
          color: var(--muted);
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Resource selector */
        .resource-selector {
          margin-bottom: 1rem;
        }

        .resource-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .resource-pill {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          background: var(--bg-elevated);
          color: var(--text);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .resource-pill:hover {
          border-color: var(--accent);
          background: var(--accent-soft);
        }

        .resource-pill.active {
          border-color: var(--accent);
          background: var(--accent-soft);
          color: var(--accent);
        }

        .resource-icon {
          font-size: 1.25rem;
        }

        .resource-name {
          font-weight: 500;
        }

        .resource-capacity {
          font-size: 0.75rem;
          color: var(--muted);
        }

        /* Week navigation */
        .week-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .week-label {
          font-weight: 600;
          color: var(--text);
          min-width: 200px;
          text-align: center;
        }

        .today-btn {
          color: var(--accent);
        }

        /* Calendar grid */
        .calendar-grid {
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: var(--bg-elevated);
        }

        .calendar-header {
          display: grid;
          grid-template-columns: 60px repeat(7, 1fr);
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border);
        }

        .time-column-header {
          padding: 0.75rem 0.5rem;
          font-size: 0.75rem;
          color: var(--muted);
          text-align: center;
        }

        .day-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.75rem 0.5rem;
          border-left: 1px solid var(--border);
        }

        .day-header.today {
          background: var(--accent-soft);
        }

        .day-name {
          font-size: 0.7rem;
          color: var(--muted);
          text-transform: uppercase;
        }

        .day-number {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text);
        }

        .day-header.today .day-number {
          color: var(--accent);
        }

        .calendar-row {
          display: grid;
          grid-template-columns: 60px repeat(7, 1fr);
          border-bottom: 1px solid var(--border);
        }

        .calendar-row:last-child {
          border-bottom: none;
        }

        .time-label {
          padding: 0.5rem;
          font-size: 0.7rem;
          color: var(--muted);
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .calendar-slot {
          min-height: 40px;
          border-left: 1px solid var(--border);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .calendar-slot.available:hover {
          background: var(--accent-soft);
        }

        .calendar-slot.booked {
          background: var(--danger-soft);
          cursor: not-allowed;
        }

        .calendar-slot.mine {
          background: var(--success-soft);
        }

        .calendar-slot.past {
          background: var(--bg-surface);
          cursor: not-allowed;
          opacity: 0.5;
        }

        .slot-icon {
          font-size: 0.8rem;
          font-weight: 600;
        }

        .calendar-slot.mine .slot-icon {
          color: var(--success);
        }

        .calendar-slot.booked .slot-icon {
          color: var(--danger);
        }

        /* Legend */
        .calendar-legend {
          display: flex;
          gap: 1.5rem;
          margin-top: 1rem;
          justify-content: center;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: var(--muted);
        }

        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 3px;
        }

        .legend-dot.available {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
        }

        .legend-dot.booked {
          background: var(--danger-soft);
        }

        .legend-dot.mine {
          background: var(--success-soft);
        }

        /* My Reservations */
        .my-reservations {
          max-width: 600px;
        }

        .empty-state {
          text-align: center;
          padding: 2rem;
          color: var(--muted);
        }

        .empty-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 1rem;
        }

        .empty-hint {
          font-size: 0.85rem;
          opacity: 0.8;
        }

        .reservations-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .reservation-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.875rem 1rem;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius);
        }

        .res-icon {
          font-size: 1.5rem;
        }

        .res-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .res-name {
          font-weight: 600;
          color: var(--text);
        }

        .res-time {
          font-size: 0.8rem;
          color: var(--muted);
        }

        .res-status {
          font-size: 0.7rem;
          font-weight: 600;
          padding: 0.25rem 0.625rem;
          border-radius: 999px;
          text-transform: uppercase;
        }

        .res-status.created {
          background: var(--success-soft);
          color: var(--success);
        }

        /* FIX #6: Cancel button styles */
        .btn-cancel {
          padding: 0.375rem 0.625rem;
          font-size: 0.75rem;
          font-weight: 600;
          background: transparent;
          border: 1px solid var(--danger, #ef4444);
          color: var(--danger, #ef4444);
          border-radius: var(--radius);
          cursor: pointer;
          transition: all 0.15s ease;
          min-width: 28px;
        }
        .btn-cancel:hover:not(:disabled) {
          background: var(--danger, #ef4444);
          color: white;
        }
        .btn-cancel:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 1rem;
        }

        .modal {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          max-width: 400px;
          width: 100%;
          box-shadow: var(--shadow-lg);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border);
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .modal-close {
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          font-size: 1.25rem;
          padding: 0.25rem;
          transition: color 0.2s ease;
        }

        .modal-close:hover {
          color: var(--text);
        }

        .modal-body {
          padding: 1.5rem;
        }

        .booking-details {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }

        .detail-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .detail-label {
          font-size: 0.9rem;
          color: var(--muted);
        }

        .detail-value {
          font-weight: 500;
          color: var(--text);
        }

        .duration-selector {
          display: flex;
          gap: 0.375rem;
        }

        .duration-btn {
          padding: 0.375rem 0.75rem;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          background: var(--bg-elevated);
          color: var(--text);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .duration-btn:hover {
          border-color: var(--accent);
        }

        .duration-btn.active {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
        }

        .booking-error {
          margin-top: 1rem;
          padding: 0.75rem 1rem;
          background: var(--danger-soft);
          border: 1px solid var(--danger);
          border-radius: var(--radius);
          color: var(--danger);
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border);
        }

        @media (max-width: 768px) {
          .calendar-grid {
            overflow-x: auto;
          }
          
          .week-nav {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};
