import axios from 'axios';

export const api = axios.create({ baseURL: '/api' });

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
