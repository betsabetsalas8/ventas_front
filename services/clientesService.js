// services/clientesService.js
import axios from 'axios';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://ventasback-production.up.railway.app/api';

export const getClientes = (tiendaId) =>
  axios.get(`${API}/clientes`, { params: tiendaId ? { tiendaId } : {} }).then(res => Array.isArray(res.data) ? res.data : []);

export const addCliente = (cliente) =>
  axios.post(`${API}/clientes`, cliente).then(res => res.data);

export const deleteCliente = (id) =>
  axios.delete(`${API}/clientes/${id}`).then(res => res.data);

export const updateCliente = (id, campos) =>
  axios.patch(`${API}/clientes/${id}`, campos).then(res => res.data);
