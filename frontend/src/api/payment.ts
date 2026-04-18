import axios from 'axios';
import { supabase } from '../lib/supabase';

// Payment router is at /payments (root level, NOT /api/v1/payments)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

const paymentClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth header using Supabase session
paymentClient.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    } else {
      console.warn('No Supabase session available for payment API');
    }
  } catch (error) {
    console.error('Failed to get Supabase session for payment API:', error);
  }
  return config;
});

// Error handler
paymentClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Payment API auth failed: Unauthorized');
    } else if (error.response?.status === 404) {
      console.error('Payment API endpoint not found:', error.config?.url);
    }
    return Promise.reject(error);
  }
);

export const paymentApi = {
  initialize: async () => {
    const response = await paymentClient.post('/payments/initialize');
    return response.data;
  },
  verify: async (reference: string) => {
    const response = await paymentClient.get(`/payments/verify/${reference}`);
    return response.data;
  },
};
