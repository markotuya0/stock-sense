import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  tier: string;
  is_active: boolean;
}

export const authApi = {
  login: async (email: string, password: string): Promise<TokenResponse> => {
    // Backend uses OAuth2PasswordRequestForm which expects x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    const response = await client.post<TokenResponse>('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  signup: async (data: any): Promise<UserResponse> => {
    const response = await client.post<UserResponse>('/auth/signup', data);
    return response.data;
  },

  getMe: async (token: string): Promise<UserResponse> => {
    const response = await client.get<UserResponse>('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};
