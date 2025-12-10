import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../Toast';

// Test component that uses the toast hook
const TestComponent: React.FC<{ 
  message?: string; 
  type?: 'success' | 'error' | 'info' | 'warning';
  autoTrigger?: boolean;
}> = ({ message = 'Test message', type = 'info', autoTrigger = false }) => {
  const { showToast, dismissToast, clearAllToasts } = useToast();
  
  React.useEffect(() => {
    if (autoTrigger) {
      showToast(message, type);
    }
  }, [autoTrigger, message, type, showToast]);

  return (
    <div>
      <button onClick={() => showToast(message, type)}>Show Toast</button>
      <button onClick={() => showToast('Success!', 'success')}>Show Success</button>
      <button onClick={() => showToast('Error!', 'error')}>Show Error</button>
      <button onClick={() => showToast('Warning!', 'warning')}>Show Warning</button>
      <button onClick={clearAllToasts}>Clear All</button>
    </div>
  );
};

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

describe('Toast Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders toast when showToast is called', async () => {
    renderWithProvider(<TestComponent />);
    
    fireEvent.click(screen.getByText('Show Toast'));
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders success toast with correct styling', () => {
    renderWithProvider(<TestComponent />);
    
    fireEvent.click(screen.getByText('Show Success'));
    
    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Success', { selector: 'div' })).toBeInTheDocument(); // Title
  });

  it('renders error toast with correct styling', () => {
    renderWithProvider(<TestComponent />);
    
    fireEvent.click(screen.getByText('Show Error'));
    
    expect(screen.getByText('Error!')).toBeInTheDocument();
    expect(screen.getByText('Error', { selector: 'div' })).toBeInTheDocument(); // Title
  });

  it('renders warning toast with correct styling', () => {
    renderWithProvider(<TestComponent />);
    
    fireEvent.click(screen.getByText('Show Warning'));
    
    expect(screen.getByText('Warning!')).toBeInTheDocument();
    expect(screen.getByText('Warning', { selector: 'div' })).toBeInTheDocument(); // Title
  });

  it('dismisses toast when close button is clicked', async () => {
    renderWithProvider(<TestComponent />);
    
    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Test message')).toBeInTheDocument();
    
    const closeButton = screen.getByLabelText('Dismiss notification');
    fireEvent.click(closeButton);
    
    // Wait for exit animation
    act(() => {
      jest.advanceTimersByTime(350);
    });
    
    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('auto-dismisses toast after duration', () => {
    renderWithProvider(<TestComponent />);
    
    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Test message')).toBeInTheDocument();
    
    // Advance past the default 4000ms duration + exit animation
    act(() => {
      jest.advanceTimersByTime(4500);
    });
    
    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('clears all toasts when clearAllToasts is called', () => {
    renderWithProvider(<TestComponent />);
    
    // Show multiple toasts
    fireEvent.click(screen.getByText('Show Success'));
    fireEvent.click(screen.getByText('Show Error'));
    fireEvent.click(screen.getByText('Show Warning'));
    
    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Error!')).toBeInTheDocument();
    expect(screen.getByText('Warning!')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Clear All'));
    
    // Wait for exit animation
    act(() => {
      jest.advanceTimersByTime(350);
    });
    
    expect(screen.queryByText('Success!')).not.toBeInTheDocument();
    expect(screen.queryByText('Error!')).not.toBeInTheDocument();
    expect(screen.queryByText('Warning!')).not.toBeInTheDocument();
  });

  it('limits toasts to maximum of 5', () => {
    renderWithProvider(<TestComponent />);
    
    // Show 7 toasts
    for (let i = 0; i < 7; i++) {
      fireEvent.click(screen.getByText('Show Toast'));
    }
    
    // Should only have 5 toasts visible
    const toasts = screen.getAllByText('Test message');
    expect(toasts.length).toBeLessThanOrEqual(5);
  });

  it('throws error when useToast is used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useToast must be used within a ToastProvider');
    
    consoleError.mockRestore();
  });
});
