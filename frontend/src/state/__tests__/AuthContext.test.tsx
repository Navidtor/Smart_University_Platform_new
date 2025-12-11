import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock JWT token with base64 encoded payload: {"sub":"user123","role":"STUDENT","tenant":"engineering"}
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwicm9sZSI6IlNUVURFTlQiLCJ0ZW5hbnQiOiJlbmdpbmVlcmluZyJ9.mock';

// Mock the api client module
jest.mock('../../api/client', () => ({
  setAuthContext: jest.fn(),
}));

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe('AuthProvider', () => {
  it('provides initial state with no token', () => {
    const TestComponent = () => {
      const { token, role, tenantId, userId } = useAuth();
      return (
        <div>
          <span data-testid="token">{token ?? 'null'}</span>
          <span data-testid="role">{role ?? 'null'}</span>
          <span data-testid="tenantId">{tenantId ?? 'null'}</span>
          <span data-testid="userId">{userId ?? 'null'}</span>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('token')).toHaveTextContent('null');
    expect(screen.getByTestId('role')).toHaveTextContent('null');
    expect(screen.getByTestId('tenantId')).toHaveTextContent('null');
    expect(screen.getByTestId('userId')).toHaveTextContent('null');
  });

  it('restores auth state from localStorage on mount', () => {
    localStorage.setItem('sup_token', mockToken);
    localStorage.setItem('sup_tenant', 'engineering');

    const TestComponent = () => {
      const { token, tenantId } = useAuth();
      return (
        <div>
          <span data-testid="token">{token ?? 'null'}</span>
          <span data-testid="tenantId">{tenantId ?? 'null'}</span>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('token')).toHaveTextContent(mockToken);
    expect(screen.getByTestId('tenantId')).toHaveTextContent('engineering');
  });

  it('login stores token and updates state', async () => {
    const TestComponent = () => {
      const { token, login } = useAuth();
      return (
        <div>
          <span data-testid="token">{token ?? 'null'}</span>
          <button onClick={() => login(mockToken, 'science')}>Login</button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('token')).toHaveTextContent('null');

    act(() => {
      screen.getByRole('button', { name: /Login/i }).click();
    });

    expect(screen.getByTestId('token')).toHaveTextContent(mockToken);
    expect(localStorage.getItem('sup_token')).toBe(mockToken);
    expect(localStorage.getItem('sup_tenant')).toBe('science');
  });

  it('logout clears token and localStorage', () => {
    localStorage.setItem('sup_token', mockToken);
    localStorage.setItem('sup_tenant', 'engineering');

    const TestComponent = () => {
      const { token, logout } = useAuth();
      return (
        <div>
          <span data-testid="token">{token ?? 'null'}</span>
          <button onClick={logout}>Logout</button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initially loaded from localStorage
    expect(screen.getByTestId('token')).toHaveTextContent(mockToken);

    act(() => {
      screen.getByRole('button', { name: /Logout/i }).click();
    });

    expect(screen.getByTestId('token')).toHaveTextContent('null');
    expect(localStorage.getItem('sup_token')).toBeNull();
    expect(localStorage.getItem('sup_tenant')).toBeNull();
  });

  it('decodes JWT payload correctly', () => {
    const TestComponent = () => {
      const { login, role, userId } = useAuth();
      
      React.useEffect(() => {
        login(mockToken, null);
      }, [login]);

      return (
        <div>
          <span data-testid="role">{role ?? 'null'}</span>
          <span data-testid="userId">{userId ?? 'null'}</span>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('role')).toHaveTextContent('STUDENT');
    expect(screen.getByTestId('userId')).toHaveTextContent('user123');
  });
});

describe('useAuth hook', () => {
  it('throws error when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    const TestComponent = () => {
      useAuth();
      return <div>Should not render</div>;
    };

    expect(() => render(<TestComponent />)).toThrow('useAuth must be used within AuthProvider');

    consoleError.mockRestore();
  });

  it('returns auth context when used inside AuthProvider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toHaveProperty('token');
    expect(result.current).toHaveProperty('role');
    expect(result.current).toHaveProperty('tenantId');
    expect(result.current).toHaveProperty('userId');
    expect(result.current).toHaveProperty('login');
    expect(result.current).toHaveProperty('logout');
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
  });
});
