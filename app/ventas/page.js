// app/ventas/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VentaForm from '../../components/VentaForm';
import VentaList from '../../components/VentaList';
import ResumenClientes from '../../components/ResumenClientes';

export default function VentasPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('form');
  const [reload, setReload]       = useState(false);
  const [usuario, setUsuario]     = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) { router.push('/login'); return; }
    setUsuario(JSON.parse(raw));
  }, []);

  if (!usuario) return null;

  const isAdmin = usuario.rol === 'superusuario';

  const tabs = [
    { id: 'form',     label: 'Agregar Venta' },
    { id: 'list',     label: 'Lista de Ventas' },
    { id: 'clientes', label: 'Por Cliente' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-10">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-md">

        {/* Pestañas */}
        <div className="flex border-b">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-3 font-semibold transition text-sm ${
                activeTab === t.id
                  ? 'border-b-2 border-sky-500 text-sky-600'
                  : 'text-gray-500 hover:text-sky-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === 'form' && (
            <VentaForm
              usuario={usuario}
              onAdded={() => { setReload(!reload); setActiveTab('list'); }}
            />
          )}
          {activeTab === 'list' && (
            <div className="bg-gray-50 border rounded-lg p-6">
              <VentaList key={reload} usuario={usuario} isAdmin={isAdmin} />
            </div>
          )}
          {activeTab === 'clientes' && (
            <div className="bg-gray-50 border rounded-lg p-6">
              <ResumenClientes key={reload} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}