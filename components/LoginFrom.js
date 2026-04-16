//components/LoginForm.js
'use client';
import { useState } from 'react';

export default function LoginForm({ onLogin }) {
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setMensaje(data.message);
        return;
      }

      localStorage.setItem('usuario', JSON.stringify(data));
      setMensaje(`Bienvenido ${data.nombre} (${data.rol})`);
      if (onLogin) onLogin(data); // para redirigir o cargar dashboard
    } catch (err) {
      console.error(err);
      setMensaje('Error de servidor');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md w-full max-w-md space-y-4">
      <h2 className="text-xl font-semibold text-gray-700">Login</h2>
      <input
        type="text"
        placeholder="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
        className="border rounded-lg px-3 py-2 w-full"
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="border rounded-lg px-3 py-2 w-full"
      />
      <button type="submit" className="bg-sky-500 text-white w-full py-2 rounded-lg hover:bg-sky-600 transition">
        Ingresar
      </button>
      {mensaje && <p className="text-sm text-gray-700">{mensaje}</p>}
    </form>
  );
}