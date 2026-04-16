import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  const directToken = localStorage.getItem('access_token');
  let persistedToken: string | null = null;
  try {
    const raw = localStorage.getItem('auth-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      persistedToken = parsed?.state?.token || null;
    }
  } catch (_error) {
    persistedToken = null;
  }
  const token = directToken || persistedToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle logout/refresh logic here
      localStorage.removeItem('access_token');
      localStorage.removeItem('auth-storage');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
