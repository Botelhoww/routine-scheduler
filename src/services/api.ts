import axios from 'axios';

/**
 * Instância base do axios para futura integração com a API C#.
 * baseURL via VITE_API_URL. Atualmente os services usam mocks (localStorage),
 * mas a estrutura abaixo está pronta para substituição: basta trocar as
 * implementações em routineService.ts por chamadas `api.get/post/...`.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

const TOKEN_STORAGE_KEY = 'bsg-auth-token';

export const setAuthToken = (token: string | null) => {
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else localStorage.removeItem(TOKEN_STORAGE_KEY);
};

api.interceptors.request.use(config => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  error => {
    // Hook para tratamento global futuro (401, refresh, toast de erro, etc.)
    return Promise.reject(error);
  },
);
