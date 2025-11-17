import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Do not set a global Content-Type here so FormData requests can let the browser set the multipart boundary.
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// If request body is FormData, remove any explicit Content-Type so axios/browser can set the correct boundary
api.interceptors.request.use((config) => {
  if (config && config.data instanceof FormData && config.headers) {
    // remove any Content-Type set by defaults so axios will set proper multipart boundary
    if (config.headers['Content-Type']) delete config.headers['Content-Type'];
    if (config.headers['content-type']) delete config.headers['content-type'];
    if (config.headers.common && config.headers.common['Content-Type']) delete config.headers.common['Content-Type'];
    if (config.headers.common && config.headers.common['content-type']) delete config.headers.common['content-type'];
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
