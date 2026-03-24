import axios from "axios";

export const AUTH_TOKEN_STORAGE_KEY = "chat-app-auth-token";

export const getStoredToken = () => sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
export const setStoredToken = (token) => sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
export const clearStoredToken = () => sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getErrorMessage = (error, fallbackMessage) =>
  error?.response?.data?.message || fallbackMessage;

export default api;
