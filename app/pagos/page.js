// app/pagos/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PagoForm from '../../components/PagoForm';
import PagoList from '../../components/PagoList';

export default function PagosPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('form');
  const [reload, setReload]       = useState(false);
  const [usuario, setUsuario]     = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem('user'); // ← corregido
    if (!raw) { router.push('/login'); return; }
    setUsuario(JSON.parse(raw));
  }, []);

  if (!usuario) return null;

  const isAdmin = usuario.rol === 'superusuario';

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-10">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-md">
        <div className="flex border-b">
          <button onClick={() => setActiveTab('form')}
            className={`flex-1 py-3 font-semibold transition ${
              activeTab === 'form' ? 'border-b-2 border-sky-500 text-sky-600' : 'text-gray-500 hover:text-sky-500'
            }`}>
            Agregar Pago
          </button>
          <button onClick={() => setActiveTab('list')}
            className={`flex-1 py-3 font-semibold transition ${
              activeTab === 'list' ? 'border-b-2 border-sky-500 text-sky-600' : 'text-gray-500 hover:text-sky-500'
            }`}>
            Lista de Pagos
          </button>
        </div>
        <div className="p-8">
          {activeTab === 'form' && (
            <PagoForm usuario={usuario} onAdded={() => setReload(!reload)} />
          )}
          {activeTab === 'list' && (
            <div className="bg-gray-50 border rounded-lg p-6">
              <PagoList key={reload} usuario={usuario} isAdmin={isAdmin} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}