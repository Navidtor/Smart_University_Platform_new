import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { setAuthContext } from '../api/client';

type AuthContextValue = {
  token: string | null;
  role: string | null;
  tenantId: string | null;
  userId: string | null;
  username: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, tenantId: string | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// FIX: Improved JWT decoder with expiration check
function decodeJwt(token: string): { payload: any; isValid: boolean } {
  try {
    const [, payloadB64] = token.split('.');
    const json = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json);
    
    // Check token expiration
    if (payload.exp) {
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      if (Date.now() >= expirationTime) {
        console.warn('Token has expired');
        return { payload, isValid: false };
      }
    }
    
    return { payload, isValid: true };
  } catch {
    return { payload: null, isValid: false };
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sup_token');
    const storedTenant = localStorage.getItem('sup_tenant');
    
    if (stored) {
      const { payload, isValid } = decodeJwt(stored);
      
      if (isValid && payload) {
        setToken(stored);
        const resolvedTenant = storedTenant ?? payload?.tenant ?? null;
        setRole(payload?.role ?? null);
        setUserId(payload?.sub ?? null);
        setUsername(payload?.username ?? null);
        setTenantId(resolvedTenant);
        setAuthContext(stored, resolvedTenant);
      } else {
        // Token invalid or expired - clear it
        console.log('Clearing expired/invalid token');
        localStorage.removeItem('sup_token');
        localStorage.removeItem('sup_tenant');
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

  const login = useCallback((newToken: string, explicitTenant: string | null) => {
    const { payload, isValid } = decodeJwt(newToken);
    
    if (!isValid) {
      console.error('Attempted to login with invalid token');
      return;
    }

    setToken(newToken);
    localStorage.setItem('sup_token', newToken);
    
    const resolvedTenant = explicitTenant ?? payload?.tenant ?? null;
    if (resolvedTenant) {
      localStorage.setItem('sup_tenant', resolvedTenant);
    }
    
    setTenantId(resolvedTenant);
    setRole(payload?.role ?? null);
    setUserId(payload?.sub ?? null);
    setUsername(payload?.username ?? null);
    setAuthContext(newToken, resolvedTenant);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setRole(null);
    setTenantId(null);
    setUserId(null);
    setUsername(null);
    localStorage.removeItem('sup_token');
    localStorage.removeItem('sup_tenant');
    setAuthContext(null, null);
  }, []);

  const value: AuthContextValue = {
    token,
    role,
    tenantId,
    userId,
    username,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
