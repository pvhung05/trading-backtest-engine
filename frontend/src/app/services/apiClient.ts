/**
 * Core HTTP Client for interacting with the API Gateway.
 * Automatically attaches the JWT Bearer token from localStorage.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const TOKEN_KEY = 'trading-app-jwt';

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string>;
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: any = null;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    const error: ApiError = {
      message:
        errorData?.message ||
        errorData?.error ||
        (typeof errorData === 'string' ? errorData : `HTTP Error ${response.status}`),
      status: response.status,
      errors: errorData?.errors,
    };

    if (response.status === 401) {
      // Clear token on 401 unauthorized
      setAuthToken(null);
    }

    throw error;
  }

  // If response is 204 No Content or empty
  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return response.text() as unknown as T;
}
