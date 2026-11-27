const DEFAULT_API_BASE_URL = 'http://localhost:3000';

export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL;
  const value = typeof configured === 'string' ? configured.trim() : '';
  return (value || DEFAULT_API_BASE_URL).replace(/\/$/, '');
}
