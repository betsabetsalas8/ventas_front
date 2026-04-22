// services/ventasService.js
import axios from 'axios';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://ventasback-production.up.railway.app/api';

export const getVentas = (tiendaId) =>
  axios.get(`${API}/ventas`, { params: tiendaId ? { tiendaId } : {} }).then(res => res.data);

export const addVenta = (venta) =>
  axios.post(`${API}/ventas`, venta).then(res => res.data);

export const updateVenta = (id, campos) =>
  axios.patch(`${API}/ventas/${id}`, campos).then(r => r.data);

export const pagarCuota = (ventaId, numeroCuota, montoPagado) =>
  axios.post(`${API}/ventas/pagar`, { ventaId, numeroCuota, montoPagado }).then(r => r.data);

export const desmarcarCuota = (ventaId, numeroCuota) =>
  axios.post(`${API}/ventas/desmarcar`, { ventaId, numeroCuota }).then(r => r.data);

export const deleteVenta = (id) =>
  axios.delete(`${API}/ventas/${id}`).then(r => r.data);

export const updateCuotaPagada = (id, montoPagado, ventaId) =>
  axios.patch(`${API}/ventas/cuota/${id}`, { montoPagado, ventaId }).then(r => r.data);

export const deleteCuotaPagada = (id) =>
  axios.delete(`${API}/ventas/cuota/${id}`).then(r => r.data);
