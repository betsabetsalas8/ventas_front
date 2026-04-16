//components/Navbar.js
'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [user, setUser]           = useState(null);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pwForm, setPwForm]       = useState({ actual: '', nueva: '', confirmar: '' });
  const [pwMsg, setPwMsg]         = useState({ text: '', error: false });
  const menuRef = useRef(null);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) setUser(JSON.parse(raw));
  }, [pathname]);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    if (pwForm.nueva !== pwForm.confirmar) {
      setPwMsg({ text: 'Las contraseñas no coinciden', error: true });
      return;
    }
    try {
      const res = await fetch(`http://localhost:3001/api/usuarios/${user.id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actual: pwForm.actual, nueva: pwForm.nueva })
      });
      const data = await res.json();
      if (!res.ok) {
        setPwMsg({ text: data.message, error: true });
        return;
      }
      setPwMsg({ text: 'Contraseña actualizada', error: false });
      setTimeout(() => {
        setShowModal(false);
        setPwForm({ actual: '', nueva: '', confirmar: '' });
        setPwMsg({ text: '', error: false });
      }, 1500);
    } catch {
      setPwMsg({ text: 'Error de servidor', error: true });
    }
  };

  const tabs = [
    { name: 'Panel',    href: '/' },
    { name: 'Clientes', href: '/clientes' },
    { name: 'Ventas',   href: '/ventas' },
    { name: 'Pagos',    href: '/pagos' },
    { name: 'Envíos',   href: '/envios' },
  ];

  return (
    <>
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center p-4">

          <h1 className="font-bold text-xl text-sky-500 shrink-0">
            Sistema de Ventas
          </h1>

          <div className="flex gap-6 ml-6 flex-1">
            {tabs.map(tab => (
              <Link
                key={tab.name}
                href={tab.href}
                className={`pb-1 transition ${
                  pathname === tab.href
                    ? 'border-b-2 border-sky-500 text-sky-600 font-semibold'
                    : 'text-gray-600 hover:text-sky-500'
                }`}
              >
                {tab.name}
              </Link>
            ))}
          </div>

          {user && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-semibold text-sm">
                  {user.nombre.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700">{user.nombre}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  user.rol === 'superusuario'
                    ? 'bg-sky-100 text-sky-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {user.rol === 'superusuario' ? 'Admin' : 'Usuario'}
                </span>
                <span className="text-gray-400 text-xs">▾</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-12 bg-white border rounded-xl shadow-lg w-52 z-50 py-1 text-sm">
                  <button
                    onClick={() => { setMenuOpen(false); setShowModal(true); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-700 transition"
                  >
                    🔑 Cambiar contraseña
                  </button>
                  {user.rol === 'superusuario' && (
                    <Link
                      href="/usuarios"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 hover:bg-gray-50 text-gray-700 transition"
                    >
                      👥 Gestionar usuarios
                    </Link>
                  )}
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-500 transition"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </nav>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">Cambiar contraseña</h2>
            <form onSubmit={handleCambiarPassword} className="space-y-3">
              <input
                type="password"
                placeholder="Contraseña actual"
                value={pwForm.actual}
                onChange={e => setPwForm({ ...pwForm, actual: e.target.value })}
                required
                className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <input
                type="password"
                placeholder="Nueva contraseña"
                value={pwForm.nueva}
                onChange={e => setPwForm({ ...pwForm, nueva: e.target.value })}
                required
                className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <input
                type="password"
                placeholder="Confirmar nueva contraseña"
                value={pwForm.confirmar}
                onChange={e => setPwForm({ ...pwForm, confirmar: e.target.value })}
                required
                className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              {pwMsg.text && (
                <p className={`text-sm ${pwMsg.error ? 'text-red-500' : 'text-green-600'}`}>
                  {pwMsg.text}
                </p>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-sky-500 text-white py-2 rounded-lg hover:bg-sky-600 transition"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setPwMsg({ text: '', error: false }); }}
                  className="flex-1 border py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}