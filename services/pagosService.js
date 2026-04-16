// services/pagosService.js
import axios from 'axios';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const getPagos = () =>
  axios.get(`${API}/pagos`).then(r => r.data);

export const addPago = (pago) =>
  axios.post(`${API}/pagos`, pago).then(r => r.data);

export const pagoGeneral = (data) =>
  axios.post(`${API}/pagos/general`, data).then(r => r.data);

export const getSaldoAFavor = (clienteId) =>
  axios.get(`${API}/pagos/saldo/${clienteId}`).then(r => r.data);

export const deletePago = (id) =>
  axios.delete(`${API}/pagos/${id}`).then(r => r.data);