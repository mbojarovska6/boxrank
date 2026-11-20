import axios from 'axios';

// Locally the Vite proxy forwards /api to the backend.
// In production VITE_API_URL contains the address of the deployed backend.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
