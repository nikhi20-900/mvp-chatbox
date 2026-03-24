import axios from "axios";

export const AUTH_TOKEN_STORAGE_KEY = "chat-app-auth-token";
export const DEPLOY_CONFIG_ERROR =
  "App backend is not configured. Add VITE_API_URL and VITE_SOCKET_URL to your frontend deploy settings, then redeploy.";

const LOCAL_API_URL = "http://127.0.0.1:5001/api";
const LOCAL_SOCKET_URL = "http://127.0.0.1:5001";
const isDev = import.meta.env.DEV;

export const API_BASE_URL = import.meta.env.VITE_API_URL || (isDev ? LOCAL_API_URL : "");
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (isDev ? LOCAL_SOCKET_URL : "");

export const getStoredToken = () => sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
export const setStoredToken = (token) => sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
export const clearStoredToken = () => sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);

const api = axios.create({
  baseURL: API_BASE_URL || undefined,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (!API_BASE_URL) {
    return Promise.reject(new Error(DEPLOY_CONFIG_ERROR));
  }

  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getErrorMessage = (error, fallbackMessage) =>
  error?.message === DEPLOY_CONFIG_ERROR
    ? DEPLOY_CONFIG_ERROR
    : error?.response?.data?.message || fallbackMessage;

export default api;
