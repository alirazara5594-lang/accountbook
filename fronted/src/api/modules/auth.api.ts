import { apiClient } from '../client';

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    email: string;
    role: string;
    companyId?: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export const authApi = {
  login: async (request: LoginRequest): Promise<LoginResponse> => {
    return apiClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: request,
    });
  },

  validate: async (): Promise<{ valid: boolean; userId: string }> => {
    return apiClient<{ valid: boolean; userId: string }>('/auth/validate');
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },

  getToken: (): string | null => {
    try {
      return localStorage.getItem('auth_token');
    } catch {
      return null;
    }
  },

  setToken: (token: string) => {
    localStorage.setItem('auth_token', token);
  },

  getUser: (): LoginResponse['user'] | null => {
    try {
      const userJson = localStorage.getItem('auth_user');
      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  },

  setUser: (user: LoginResponse['user']) => {
    localStorage.setItem('auth_user', JSON.stringify(user));
  },
};