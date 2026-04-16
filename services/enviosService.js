// services/enviosService.js
import axios from 'axios';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const getEnvios = () =>
  axios.get(`${API}/envios`).then(res => res.data);

export const addEnvio = (envio) =>
  axios.post(`${API}/envios`, envio).then(res => res.data);