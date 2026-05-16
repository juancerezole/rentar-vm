import axios from 'axios';
import { notifyError } from './utils/notify.js';

// En producción (Vercel) usa la URL de Railway via VITE_API_URL.
// En desarrollo el proxy de Vite redirige /api → localhost:4000.
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

export const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Rutas donde el 401 NO debe disparar logout global —
// son endpoints de autenticación donde el caller maneja el error inline
// (login fallido, /auth/me al boot con token expirado, etc.)
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/me', '/auth/forgot-password', '/auth/reset-password'];

function isAuthPath(url = '') {
  return AUTH_PATHS.some(p => url.endsWith(p));
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status   = error.response?.status;
    const url      = error.config?.url ?? '';
    const apiError = error.response?.data?.error;

    // 401 fuera de endpoints de auth → sesión expiró/inválida.
    // Limpiamos token y mandamos a /login.
    if (status === 401 && !isAuthPath(url)) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        notifyError('Tu sesión expiró. Iniciá sesión de nuevo.');
        window.location.assign('/login');
      }
    }

    // 5xx → error del servidor. Mostramos un toast salvo que el caller
    // marque `skipNotify: true` en la config (para errores que ya muestra en UI).
    if (status >= 500 && !error.config?.skipNotify) {
      notifyError(apiError || 'Error del servidor. Probá de nuevo en un momento.');
    }

    return Promise.reject(error);
  },
);

export const formatPrice = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0);

export const TIPOS = [
  { v: 'departamento', label: 'Departamento' },
  { v: 'casa', label: 'Casa' },
  { v: 'duplex', label: 'Dúplex' },
  { v: 'campo', label: 'Campo' },
  { v: 'galpon', label: 'Galpón' },
  { v: 'comercial', label: 'Local comercial' },
  { v: 'cochera', label: 'Cochera' },
  { v: 'baulera', label: 'Baulera' },
  { v: 'contenedor', label: 'Contenedor' },
];

export const tipoLabel = (v) => TIPOS.find(t => t.v === v)?.label || v;
