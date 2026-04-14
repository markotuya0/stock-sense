import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_URL,
});

// Add auth header if token exists
client.interceptors.request.use((config) => {
  const token = JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const paymentApi = {
  initialize: async () => {
    const response = await client.post('/payments/initialize');
    return response.data;
  },
  verify: async (reference: string) => {
    const response = await client.get(`/payments/verify/${reference}`);
    return response.data;
  },
};
