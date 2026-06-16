import axios from 'axios';

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
});

API.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('excise_live_token') || localStorage.getItem('dmt_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('excise_live_token');
      localStorage.removeItem('excise_live_user');
      localStorage.removeItem('dmt_token');
      localStorage.removeItem('dmt_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;
