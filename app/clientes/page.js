// app/clientes/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ClienteForm from '../../components/ClienteForm';
import ClienteList from '../../components/ClienteList';

export default function ClientesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('form');
  const [reload, setReload]       = useState(false);
  const [user, setUser]           = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(raw));
    setTiendaNombre(localStorage.getItem("tiendaNombre") || "");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return null;

  const esSuperusuario = user.rol === 'superusuario';

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-10">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <p className="text-sm text-gray-500">Bienvenido, {user.nombre}</p>
            <h1 className="text-3xl font-bold text-gray-800 mt-1">
              🏪 {typeof window !== 'undefined' ? localStorage.getItem('tiendaNombre') || '' : ''}
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-red-500 transition"
          >
            Cerrar sesión
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md">

          {/* Tabs — solo superusuario ve "Agregar Cliente" */}
          <div className="flex border-b">
            {true && (
              <button
                onClick={() => setActiveTab('form')}
                className={`flex-1 py-3 font-semibold transition ${
                  activeTab === 'form'
                    ? 'border-b-2 border-sky-500 text-sky-600'
                    : 'text-gray-500 hover:text-sky-500'
                }`}
              >
                Agregar Cliente
              </button>
            )}
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 py-3 font-semibold transition ${
                activeTab === 'list'
                  ? 'border-b-2 border-sky-500 text-sky-600'
                  : 'text-gray-500 hover:text-sky-500'
              }`}
            >
              Lista de Clientes
            </button>
          </div>

          {/* Contenido */}
          <div className="p-8">
            {activeTab === 'form' && esSuperusuario && (
              <ClienteForm onAdded={() => { setReload(!reload); setActiveTab('list'); }} />
            )}
            {activeTab === 'list' && (
              <div className="bg-gray-50 border rounded-lg p-6">
                <ClienteList reload={reload} esSuperusuario={esSuperusuario} />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}