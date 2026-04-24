// services/enviosService.js
import axios from 'axios';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://ventasback-production.up.railway.app/api';

export const getEnvios = (tiendaId) =>
  axios.get(`${API}/envios`, { params: tiendaId ? { tiendaId } : {} }).then(res => res.data);

export const addEnvio = (envio) =>
  axios.post(`${API}/envios`, envio).then(res => res.data);
