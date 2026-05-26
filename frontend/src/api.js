import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Intercept requests to add the auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('naam_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept responses to handle 401 Unauthorized (expired, stale, or invalid token) errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('naam_token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const getUploadUrl = (filename) => {
  if (!filename) return '';
  const baseUrl = import.meta.env.VITE_API_URL || '';
  if (baseUrl.endsWith('/api')) {
    return `${baseUrl.substring(0, baseUrl.length - 4)}/uploads/${filename}`;
  }
  return `/uploads/${filename}`;
};

export default api;
