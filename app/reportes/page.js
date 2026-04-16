// app/reportes/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ExportarExcel from '../../components/ExportarExcel';

export default function ReportesPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) { router.push('/login'); return; }
    const u = JSON.parse(raw);
    if (u.rol !== 'superusuario') { router.push('/'); return; }
    setUsuario(u);
  }, []);

  if (!usuario) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-10">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-gray-700 mb-6">Reportes</h1>
        <ExportarExcel />
      </div>
    </div>
  );
}