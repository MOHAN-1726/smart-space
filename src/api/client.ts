import axios from 'axios';
import { store } from '../store'; // Assuming you have a Redux store

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
});

api.interceptors.request.use(config => {
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken } = response.data;
          store.dispatch({ type: 'auth/tokenRefreshed', payload: { accessToken } });
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          store.dispatch({ type: 'auth/logout' });
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
