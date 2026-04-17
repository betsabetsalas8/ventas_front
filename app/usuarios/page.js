//app/usuarios/page.js
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RegisterUserForm from '../../components/RegisterUserForm';

export default function UsuariosPage() {
  const router = useRouter();
  const [user, setUser]       = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [reload, setReload]   = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) { router.push('/login'); return; }
    const u = JSON.parse(raw);
    if (u.rol !== 'superusuario') { router.push('/'); return; }
    setUser(u);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch('https://ventasback-production.up.railway.app/api/usuarios')
      .then(r => r.json())
      .then(data => setUsuarios(Array.isArray(data) ? data : []));
  }, [user, reload]);

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    await fetch(`https://ventasback-production.up.railway.app/api/usuarios/${id}`, { method: 'DELETE' });
    setReload(!reload);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-4xl mx-auto space-y-8">

        <h2 className="text-2xl font-semibold text-gray-700">Gestión de usuarios</h2>

        <RegisterUserForm onAdded={() => setReload(!reload)} />

        <div className="bg-white border rounded-xl overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-sky-100 text-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-left">Creado</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} className="border-t hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-700">{u.nombre}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      u.rol === 'superusuario' ? 'bg-sky-100 text-sky-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {u.rol === 'superusuario' ? 'Admin' : 'Usuario'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(u.fechaCreacion).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-4 py-3">
                    {u.id !== user.id && (
                      <button
                        onClick={() => handleEliminar(u.id)}
                        className="text-xs px-3 py-1 rounded-lg border border-red-300 text-red-500 hover:bg-red-50 transition"
                      >
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
    </div>
  );
}