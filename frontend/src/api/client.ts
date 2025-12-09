import axios, { AxiosError } from 'axios';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: apiBase,
  timeout: 10000, // 10 second timeout
});

let currentToken: string | null = null;
let currentTenantId: string | null = null;

/**
 * Called by the AuthProvider whenever authentication state changes so that
 * outgoing requests always carry the latest JWT and tenant id.
 */
export function setAuthContext(token: string | null, tenantId: string | null) {
  currentToken = token;
  currentTenantId = tenantId;
}

// Attach a single interceptor that always reads the latest auth context.
api.interceptors.request.use((config) => {
  if (!config.headers) {
    config.headers = {};
  }
  if (currentToken) {
    config.headers.Authorization = `Bearer ${currentToken}`;
  }
  if (currentTenantId) {
    config.headers['X-Tenant-Id'] = currentTenantId;
  }
  return config;
});

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Log errors for debugging (legitimate use case for API errors)
    // eslint-disable-next-line no-console
    if (error.response) {
      console.error(`API Error [${error.response.status}]:`, error.response.data);
    } else if (error.request) {
      // eslint-disable-next-line no-console
      console.error('API Error: No response received', error.message);
    } else {
      // eslint-disable-next-line no-console
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export function useConfiguredApi() {
  return api;
}