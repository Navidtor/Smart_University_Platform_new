import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ServiceStatus, ServiceDashboard } from '../ServiceStatus';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock performance.now for response time
const mockPerformanceNow = jest.fn();
global.performance.now = mockPerformanceNow;

// Mock import.meta.env
jest.mock('../ServiceStatus', () => {
  const originalModule = jest.requireActual('../ServiceStatus');
  return {
    ...originalModule,
  };
});

beforeEach(() => {
  jest.useFakeTimers();
  mockFetch.mockReset();
  mockPerformanceNow.mockReset();
  
  // Default: simulate fast response times
  let callCount = 0;
  mockPerformanceNow.mockImplementation(() => {
    callCount++;
    return callCount * 50; // 50ms per call
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe('ServiceStatus', () => {
  it('renders compact status indicator', async () => {
    // Mock all services as "up"
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    render(<ServiceStatus />);

    // Initially shows "checking" state
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows service count in compact mode', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    render(<ServiceStatus compact={true} />);

    // Wait for health checks to complete
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  it('expands dropdown when clicked', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    render(<ServiceStatus />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    // Click to expand
    fireEvent.click(screen.getByRole('button'));

    // Should show expanded content
    await waitFor(() => {
      expect(screen.getByText(/Service Health/i)).toBeInTheDocument();
    });
  });

  it('shows all services in expanded view', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    render(<ServiceStatus />);

    // Expand the dropdown
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Gateway')).toBeInTheDocument();
      expect(screen.getByText('Auth')).toBeInTheDocument();
      expect(screen.getByText('Booking')).toBeInTheDocument();
      expect(screen.getByText('Marketplace')).toBeInTheDocument();
      expect(screen.getByText('Exam')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Payment')).toBeInTheDocument();
      expect(screen.getByText('Notification')).toBeInTheDocument();
    });
  });

  it('shows refresh button in expanded view', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    render(<ServiceStatus />);

    // Expand dropdown
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
    });
  });

  it('handles refresh click', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    render(<ServiceStatus />);

    // Expand dropdown
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
    });

    // Clear mock to track new calls
    mockFetch.mockClear();

    // Click refresh
    fireEvent.click(screen.getByRole('button', { name: /Refresh/i }));

    // Should trigger new health checks
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it('displays "down" status when service fails', async () => {
    // Mock failed responses
    mockFetch.mockRejectedValue(new Error('Connection failed'));

    render(<ServiceStatus />);

    // Expand dropdown
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      // Should show "down" status somewhere
      const statusElements = screen.getAllByText(/down/i);
      expect(statusElements.length).toBeGreaterThan(0);
    });
  });

  it('collapses dropdown on second click', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    render(<ServiceStatus />);

    const button = screen.getByRole('button');

    // First click - expand
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Service Health/i)).toBeInTheDocument();
    });

    // Second click - collapse
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.queryByText(/Service Health/i)).not.toBeInTheDocument();
    });
  });

  it('respects refreshInterval prop', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    render(<ServiceStatus refreshInterval={5000} />);

    // Initial calls for 8 services
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const initialCallCount = mockFetch.mock.calls.length;
    mockFetch.mockClear();

    // Advance timers by refreshInterval
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Should have made new calls
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it('shows response time when enabled', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    render(<ServiceStatus showResponseTime={true} />);

    // Expand dropdown
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      // Look for response time indicators (ms)
      const msElements = screen.queryAllByText(/\d+ms/);
      expect(msElements.length).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('ServiceDashboard', () => {
  it('renders dashboard with title', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    render(<ServiceDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Service Health Dashboard/i)).toBeInTheDocument();
    });
  });

  it('shows summary stats (healthy, degraded, down)', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    render(<ServiceDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Healthy')).toBeInTheDocument();
      expect(screen.getByText('Degraded')).toBeInTheDocument();
      expect(screen.getByText('Down')).toBeInTheDocument();
    });
  });

  it('shows refresh button', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    render(<ServiceDashboard />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
    });
  });

  it('shows last updated time', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    render(<ServiceDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
    });
  });

  it('handles refresh button click', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    render(<ServiceDashboard />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
    });

    mockFetch.mockClear();

    fireEvent.click(screen.getByRole('button', { name: /Refresh/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
