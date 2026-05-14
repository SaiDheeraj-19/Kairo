import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('kairo-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('kairo-token');
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path.startsWith('/dashboard')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
