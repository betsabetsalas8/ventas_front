// services/pagosService.js
import axios from 'axios';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://ventasback-production.up.railway.app/api';

export const getPagos = (tiendaId) =>
  axios.get(`${API}/pagos`, { params: tiendaId ? { tiendaId } : {} }).then(r => r.data);

export const addPago = (pago) =>
  axios.post(`${API}/pagos`, pago).then(r => r.data);

export const pagoGeneral = (data) =>
  axios.post(`${API}/pagos/general`, data).then(r => r.data);

export const getSaldoAFavor = (clienteId) =>
  axios.get(`${API}/pagos/saldo/${clienteId}`).then(r => r.data);

export const deletePago = (id) =>
  axios.delete(`${API}/pagos/${id}`).then(r => r.data);
