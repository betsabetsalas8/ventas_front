'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../../services/authService';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm]       = useState({ nombre: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [tiendas, setTiendas] = useState([]);
  const [user, setUser]       = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login(form.nombre, form.password);
      localStorage.setItem('user', JSON.stringify(data));

      // Superusuario sin tiendas → ir a crear tiendas
      if (data.rol === 'superusuario' && data.tiendas.length === 0) {
        router.push('/usuarios');
        return;
      }

      // Usuario normal sin tiendas
      if (data.rol !== 'superusuario' && data.tiendas.length === 0) {
        setError('No tienes tiendas asignadas. Contacta al administrador.');
        return;
      }

      // Solo una tienda → entrar directo
      if (data.tiendas.length === 1) {
        localStorage.setItem('tiendaId', data.tiendas[0].id);
        localStorage.setItem('tiendaNombre', data.tiendas[0].nombre);
        router.push('/');
        return;
      }

      // Varias tiendas → elegir
      setUser(data);
      setTiendas(data.tiendas);

    } catch {
      setError('Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  const elegirTienda = (tienda) => {
    localStorage.setItem('tiendaId', tienda.id);
    localStorage.setItem('tiendaNombre', tienda.nombre);
    router.push('/');
  };

  if (tiendas.length > 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white border rounded-xl shadow-sm p-8 w-full max-w-sm space-y-5">
          <h1 className="text-2xl font-semibold text-gray-700">Selecciona una tienda</h1>
          <p className="text-sm text-gray-500">Hola <strong>{user.nombre}</strong>, ¿a qué tienda deseas entrar?</p>
          <div className="space-y-3">
            {tiendas.map(t => (
              <button
                key={t.id}
                onClick={() => elegirTienda(t)}
                className="w-full text-left px-4 py-3 border rounded-lg hover:bg-sky-50 hover:border-sky-400 transition"
              >
                🏪 {t.nombre}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white border rounded-xl shadow-sm p-8 w-full max-w-sm space-y-5"
      >
        <h1 className="text-2xl font-semibold text-gray-700">Iniciar sesión</h1>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600">Usuario</label>
          <input
            value={form.nombre}
            onChange={e => setForm({ ...form, nombre: e.target.value })}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600">Contraseña</label>
          <input
            type="password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sky-500 text-white py-2 rounded-lg hover:bg-sky-600 transition disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
