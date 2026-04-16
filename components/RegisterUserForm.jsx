// components/RegisterUserForm.jsx
'use client';
import { useState } from 'react';

export default function RegisterUserForm({ onAdded }) {
  const [nombre, setNombre]     = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol]           = useState('usuario');
  const [mensaje, setMensaje]   = useState({ text: '', error: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/usuarios/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, password, rol })
      });
      const data = await res.json();
      if (!res.ok) {
        setMensaje({ text: data.message, error: true });
        return;
      }
      setMensaje({ text: `Usuario ${data.nombre} creado correctamente`, error: false });
      setNombre('');
      setPassword('');
      setRol('usuario');
      if (onAdded) onAdded();
      setTimeout(() => setMensaje({ text: '', error: false }), 3000);
    } catch (err) {
      console.error(err);
      setMensaje({ text: 'Error de servidor', error: true });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border space-y-4">
      <h2 className="text-xl font-semibold text-gray-700">Registrar usuario</h2>

      <input
        type="text"
        placeholder="Nombre"
        value={nombre}
        onChange={e => setNombre(e.target.value)}
        required
        className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
      />

      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
      />

      <select
        value={rol}
        onChange={e => setRol(e.target.value)}
        className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
      >
        <option value="usuario">Usuario</option>
        <option value="superusuario">Administrador</option>
      </select>

      <button
        type="submit"
        className="bg-green-500 text-white w-full py-2 rounded-lg hover:bg-green-600 transition"
      >
        Crear usuario
      </button>

      {mensaje.text && (
        <p className={`text-sm ${mensaje.error ? 'text-red-500' : 'text-green-600'}`}>
          {mensaje.text}
        </p>
      )}
    </form>
  );
}