'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RegisterUserForm from '../../components/RegisterUserForm';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://ventasback-production.up.railway.app/api';

export default function UsuariosPage() {
  const router = useRouter();
  const [user, setUser]         = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [tiendas, setTiendas]   = useState([]);
  const [nuevaTienda, setNuevaTienda] = useState('');
  const [reload, setReload]     = useState(false);
  const [tab, setTab]           = useState('usuarios');

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) { router.push('/login'); return; }
    const u = JSON.parse(raw);
    if (u.rol !== 'superusuario') { router.push('/'); return; }
    setUser(u);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch(`${API}/usuarios`).then(r => r.json()).then(data => setUsuarios(Array.isArray(data) ? data : []));
    fetch(`${API}/tiendas`).then(r => r.json()).then(data => setTiendas(Array.isArray(data) ? data : []));
  }, [user, reload]);

  const handleEliminarUsuario = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    await fetch(`${API}/usuarios/${id}`, { method: 'DELETE' });
    setReload(!reload);
  };

  const handleCrearTienda = async (e) => {
    e.preventDefault();
    if (!nuevaTienda.trim()) return;
    await fetch(`${API}/tiendas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nuevaTienda.trim() })
    });
    setNuevaTienda('');
    setReload(!reload);
  };

  const handleEliminarTienda = async (id) => {
    if (!confirm('¿Eliminar esta tienda?')) return;
    await fetch(`${API}/tiendas/${id}`, { method: 'DELETE' });
    setReload(!reload);
  };

  const handleAsignar = async (usuarioId, tiendaId) => {
    await fetch(`${API}/tiendas/asignar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId, tiendaId })
    });
    setReload(!reload);
  };

  const handleDesasignar = async (usuarioId, tiendaId) => {
    await fetch(`${API}/tiendas/asignar`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId, tiendaId })
    });
    setReload(!reload);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-2xl font-semibold text-gray-700">Administración</h2>

        <div className="flex gap-2">
          <button onClick={() => setTab('usuarios')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'usuarios' ? 'bg-sky-500 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
            👥 Usuarios
          </button>
          <button onClick={() => setTab('tiendas')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'tiendas' ? 'bg-sky-500 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
            🏪 Tiendas
          </button>
          <button onClick={() => setTab('asignar')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'asignar' ? 'bg-sky-500 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
            🔗 Asignar usuarios
          </button>
        </div>

        {tab === 'usuarios' && (
          <div className="space-y-6">
            <RegisterUserForm onAdded={() => setReload(!reload)} />
            <div className="bg-white border rounded-xl overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-sky-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Rol</th>
                    <th className="px-4 py-3 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-700">{u.nombre}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.rol === 'superusuario' ? 'bg-sky-100 text-sky-700' : 'bg-gray-100 text-gray-500'}`}>
                          {u.rol === 'superusuario' ? 'Admin' : 'Usuario'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.id !== user.id && (
                          <button onClick={() => handleEliminarUsuario(u.id)} className="text-xs px-3 py-1 rounded-lg border border-red-300 text-red-500 hover:bg-red-50 transition">
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'tiendas' && (
          <div className="space-y-6">
            <form onSubmit={handleCrearTienda} className="bg-white border rounded-xl p-6 flex gap-3">
              <input
                value={nuevaTienda}
                onChange={e => setNuevaTienda(e.target.value)}
                placeholder="Nombre de la tienda"
                className="border rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">
                + Crear tienda
              </button>
            </form>
            <div className="bg-white border rounded-xl overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-sky-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Tienda</th>
                    <th className="px-4 py-3 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tiendas.map(t => (
                    <tr key={t.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-700">🏪 {t.nombre}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleEliminarTienda(t.id)} className="text-xs px-3 py-1 rounded-lg border border-red-300 text-red-500 hover:bg-red-50 transition">
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'asignar' && (
          <div className="bg-white border rounded-xl overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-sky-100 text-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">Usuario</th>
                  {tiendas.map(t => (
                    <th key={t.id} className="px-4 py-3 text-center">{t.nombre}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.filter(u => u.rol !== 'superusuario').map(u => (
                  <tr key={u.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-700">{u.nombre}</td>
                    {tiendas.map(t => {
                      const asignado = u.tiendas && u.tiendas.some(ut => ut.id === t.id);
                      return (
                        <td key={t.id} className="px-4 py-3 text-center">
                          <button
                            onClick={() => asignado ? handleDesasignar(u.id, t.id) : handleAsignar(u.id, t.id)}
                            className={`text-xs px-3 py-1 rounded-full transition ${asignado ? 'bg-sky-100 text-sky-700 hover:bg-red-50 hover:text-red-500' : 'bg-gray-100 text-gray-400 hover:bg-sky-50 hover:text-sky-600'}`}
                          >
                            {asignado ? '✓ Asignado' : '+ Asignar'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
