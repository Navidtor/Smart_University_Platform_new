import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface User {
  userId: string;
  username: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  tenantId: string;
}

interface AuthContextType {
  token: string | null;
  tenantId: string | null;
  userId: string | null;
  username: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, tenantId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// FIX: Decode JWT and check expiration
const decodeJwt = (token: string): { payload: any; isValid: boolean } => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { payload: null, isValid: false };
    }

    const payload = JSON.parse(atob(parts[1]));
    
    // FIX: Check token expiration
    if (payload.exp) {
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      
      if (now >= expirationTime) {
        console.warn('Token has expired');
        return { payload, isValid: false };
      }
    }
    
    return { payload, isValid: true };
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return { payload: null, isValid: false };
  }
};

// Check if token will expire soon (within 5 minutes)
const isTokenExpiringSoon = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    
    const expirationTime = payload.exp * 1000;
    const fiveMinutes = 5 * 60 * 1000;
    
    return Date.now() >= expirationTime - fiveMinutes;
  } catch {
    return true;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedTenantId = localStorage.getItem('tenantId');

    if (storedToken && storedTenantId) {
      const { payload, isValid } = decodeJwt(storedToken);
      
      if (isValid && payload) {
        setToken(storedToken);
        setTenantId(storedTenantId);
        setUser({
          userId: payload.sub || payload.userId,
          username: payload.username || 'Unknown',
          role: payload.role || 'STUDENT',
          tenantId: storedTenantId,
        });
      } else {
        // Token is invalid or expired - clear it
        console.log('Clearing expired/invalid token');
        localStorage.removeItem('token');
        localStorage.removeItem('tenantId');
      }
    }
    
    setIsLoading(false);
  }, []);

  // FIX: Periodically check token expiration
  useEffect(() => {
    if (!token) return;

    const checkExpiration = () => {
      const { isValid } = decodeJwt(token);
      if (!isValid) {
        console.log('Token expired, logging out');
        logout();
      }
    };

    // Check every minute
    const interval = setInterval(checkExpiration, 60 * 1000);
    
    return () => clearInterval(interval);
  }, [token]);

  const login = useCallback((newToken: string, newTenantId: string) => {
    const { payload, isValid } = decodeJwt(newToken);
    
    if (!isValid) {
      console.error('Attempted to login with invalid token');
      return;
    }

    localStorage.setItem('token', newToken);
    localStorage.setItem('tenantId', newTenantId);
    
    setToken(newToken);
    setTenantId(newTenantId);
    setUser({
      userId: payload.sub || payload.userId,
      username: payload.username || 'Unknown',
      role: payload.role || 'STUDENT',
      tenantId: newTenantId,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('tenantId');
    setToken(null);
    setTenantId(null);
    setUser(null);
  }, []);

  const value: AuthContextType = {
    token,
    tenantId,
    userId: user?.userId || null,
    username: user?.username || null,
    role: user?.role || null,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// FIX: Export helper to check if token is valid
export const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  const { isValid } = decodeJwt(token);
  return isValid;
};
