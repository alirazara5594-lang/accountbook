// Centralized API Configuration for Account Book ERP Frontend
export const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5124/api/v1';

export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // If API_BASE_URL already includes /api/v1, strip it from endpoint if present
  if (API_BASE_URL.endsWith('/api/v1') && cleanEndpoint.startsWith('/api/v1/')) {
    return `${API_BASE_URL.replace(/\/api\/v1$/, '')}${cleanEndpoint}`;
  }
  return `${API_BASE_URL}${cleanEndpoint}`;
};
