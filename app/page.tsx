//app/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
type User = {
  rol: string;
};

const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(raw));
  }, []);

  const modules = [
    { name: 'Clientes', desc: 'Administrar clientes', path: '/clientes', icon: '👥' },
    { name: 'Ventas', desc: 'Registrar ventas', path: '/ventas', icon: '💰' },
    { name: 'Pagos', desc: 'Gestionar pagos', path: '/pagos', icon: '💳' },
    { name: 'Envíos', desc: 'Control de envíos', path: '/envios', icon: '📦' },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto p-10">

        <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">
          Panel de Control
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {modules.map((mod) => (
            <Link key={mod.path} href={mod.path}>
              <div className="bg-white border rounded-xl p-8 hover:shadow-xl hover:-translate-y-1 transition duration-300 cursor-pointer">
                <div className="text-5xl mb-4">{mod.icon}</div>
                <h3 className="text-2xl font-semibold text-gray-800">{mod.name}</h3>
                <p className="text-gray-500 mt-2">{mod.desc}</p>
              </div>
            </Link>
          ))}

          {/* Tarjeta Usuarios — solo superusuario */}
          {user.rol === 'superusuario' && (
            <Link href="/usuarios">
              <div className="bg-white border rounded-xl p-8 hover:shadow-xl hover:-translate-y-1 transition duration-300 cursor-pointer">
                <div className="text-5xl mb-4">👤</div>
                <h3 className="text-2xl font-semibold text-gray-800">Usuarios</h3>
                <p className="text-gray-500 mt-2">Gestionar usuarios</p>
              </div>
            </Link>
          )}
          {user.rol === 'superusuario' && (
            <Link href="/reportes">
              <div className="bg-white border rounded-xl p-8 hover:shadow-xl hover:-translate-y-1 transition duration-300 cursor-pointer">
                <div className="text-5xl mb-4">📊</div>
                <h3 className="text-2xl font-semibold text-gray-800">Reportes</h3>
                <p className="text-gray-500 mt-2">Exportar a Excel</p>
              </div>
            </Link>
          )}

        </div>
      </div>

      <footer className="text-center text-gray-500 mt-16 pb-6">
        Sistema de Ventas © 2026
      </footer>
    </div>
  );
}