// services/authService.js
import axios from 'axios';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://ventasback-production.up.railway.app/api';

export const login = (nombre, password) =>
  axios.post(`${API}/login`, { nombre, password }).then(res => res.data);