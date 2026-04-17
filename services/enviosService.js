// services/enviosService.js
import axios from 'axios';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://ventasback-production.up.railway.app/api';

export const getEnvios = () =>
  axios.get(`${API}/envios`).then(res => res.data);

export const addEnvio = (envio) =>
  axios.post(`${API}/envios`, envio).then(res => res.data);