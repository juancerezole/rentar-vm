import axios from 'axios';

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
