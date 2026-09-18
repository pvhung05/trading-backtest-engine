import { apiFetch, setAuthToken } from './apiClient';

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: UserResponse;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await apiFetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.token) {
      setAuthToken(res.token);
    }
    return res;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await apiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.token) {
      setAuthToken(res.token);
    }
    return res;
  },

  async getMe(): Promise<UserResponse> {
    return apiFetch<UserResponse>('/api/auth/me', {
      method: 'GET',
    });
  },

  logout(): void {
    setAuthToken(null);
  },
};
