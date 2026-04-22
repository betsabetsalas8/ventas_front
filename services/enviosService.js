// services/enviosService.js
import axios from 'axios';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://ventasback-production.up.railway.app/api';

export const getEnvios = (tiendaId) =>
  axios.get(`${API}/envios`, { params: tiendaId ? { tiendaId } : {} }).then(res => res.data);

export const addEnvio = (envio) =>
  axios.post(`${API}/envios`, envio).the

cat > ~/Downloads/sistema-ventas-frontend-master/components/Navbar.js << 'EOF'
'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://ventasback-production.up.railway.app/api';

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [user, setUser]             = useState(null);
  const [tiendaNombre, setTiendaNombre] = useState('');
  const [tiendas, setTiendas]       = useState([]);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [tiendaOpen, setTiendaOpen] = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [pwForm, setPwForm]         = useState({ actual: '', nueva: '', confirmar: '' });
  const [pwMsg, setPwMsg]           = useState({ text: '', error: false });
  const menuRef   = useRef(null);
  const tiendaRef = useRef(null);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) {
      const u = JSON.parse(raw);
      setUser(u);
      setTiendaNombre(localStorage.getItem('tiendaNombre') || '');
      // Cargar tiendas para superusuario
      if (u.rol === 'superusuario') {
        fetch(`${API}/tiendas`)
          .then(r => r.json())
          .then(data => setTiendas(Array.isArray(data) ? data : []));
      }
    }
  }, [pathname]);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (tiendaRef.current && !tiendaRef.current.contains(e.target)) setTiendaOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('tiendaId');
    localStorage.removeItem('tiendaNombre');
    router.push('/login');
  };

  const cambiarTienda = (tienda) => {
    localStorage.setItem('tiendaId', tienda.id);
    localStorage.setItem('tiendaNombre', tienda.nombre);
    setTiendaNombre(tienda.nombre);
    setTiendaOpen(false);
    router.refresh();
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    if (pwForm.nueva !== pwForm.confirmar) {
      setPwMsg({ text: 'Las contraseñas no coinciden', error: true });
      return;
    }
    try {
      const res = await fetch(`${API}/usuarios/${user.id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actual: pwForm.actual, nueva: pwForm.nueva })
      });
      const data = await res.json();
      if (!res.ok) { setPwMsg({ text: data.message, error: true }); return; }
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

  if (pathname === '/login') return null;

  return (
    <>
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center p-4 gap-4">

          <h1 className="font-bold text-xl text-sky-500 shrink-0">Sistema de Ventas</h1>

          <div className="flex gap-6 flex-1">
            {tabs.map(tab => (
              <Link key={tab.name} href={tab.href}
                className={`pb-1 transition ${pathname === tab.href
                  ? 'border-b-2 border-sky-500 text-sky-600 font-semibold'
                  : 'text-gray-600 hover:text-sky-500'}`}>
                {tab.name}
              </Link>
            ))}
          </div>

          {/* Selector de tienda para superusuario */}
          {user?.rol === 'superusuario' && (
            <div className="relative" ref={tiendaRef}>
              <button
                onClick={() => setTiendaOpen(!tiendaOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border hover:bg-gray-50 transition text-sm text-gray-600"
              >
                🏪 {tiendaNombre || 'Todas las tiendas'}
                <span className="text-gray-400 text-xs">▾</span>
              </button>
              {tiendaOpen && (
                <div className="absolute right-0 top-10 bg-white border rounded-xl shadow-lg w-52 z-50 py-1 text-sm">
                  <button
                    onClick={() => { localStorage.removeItem('tiendaId'); localStorage.removeItem('tiendaNombre'); setTiendaNombre(''); setTiendaOpen(false); router.refresh(); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-500 transition"
                  >
                    🌐 Todas las tiendas
                  </button>
                  <hr className="my-1" />
                  {tiendas.map(t => (
                    <button key={t.id} onClick={() => cambiarTienda(t)}
                      className={`w-full text-left px-4 py-2.5 hover:bg-sky-50 transition ${tiendaNombre === t.nombre ? 'text-sky-600 font-semibold' : 'text-gray-700'}`}>
                      🏪 {t.nombre}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Menú usuario */}
          {user && (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition">
                <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-semibold text-sm">
                  {user.nombre.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700">{user.nombre}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${user.rol === 'superusuario' ? 'bg-sky-100 text-sky-700' : 'bg-gray-100 text-gray-500'}`}>
                  {user.rol === 'superusuario' ? 'Admin' : 'Usuario'}
                </span>
                <span className="text-gray-400 text-xs">▾</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-12 bg-white border rounded-xl shadow-lg w-52 z-50 py-1 text-sm">
                  <button onClick={() => { setMenuOpen(false); setShowModal(true); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-700 transition">
                    🔑 Cambiar contraseña
                  </button>
                  {user.rol === 'superusuario' && (
                    <Link href="/usuarios" onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 hover:bg-gray-50 text-gray-700 transition">
cat > ~/Downloads/sistema-ventas-frontend-master/components/ClienteList.js << 'EOF'
'use client';
import { useEffect, useState } from 'react';
import { getClientes, deleteCliente, updateCliente } from '../services/clientesService';
import { getVentas } from '../services/ventasService';
import { getSaldoAFavor } from '../services/pagosService';

const TIPO_BADGE = {
  bueno: 'bg-green-100 text-green-700',
  regular: 'bg-yellow-100 text-yellow-700',
  malo: 'bg-red-100 text-red-600',
};

const fmt = (n) => n != null
  ? `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
  : '—';

function ModalEditar({ cliente, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre: cliente.nombre ?? '',
    tipoCliente: cliente.tipoCliente ?? '',
    celular: cliente.celular ?? '',
    identificador: cliente.identificador ?? '',
    calle: cliente.calle ?? '',
    numero: cliente.numero ?? '',
    colonia: cliente.colonia ?? '',
    ciudad: cliente.ciudad ?? '',
    estado: cliente.estado ?? '',
    cp: cliente.cp ?? '',
    referencias: cliente.referencias ?? '',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleGuardar = async () => {
    setGuardando(true);
    setError('');
    try {
      await updateCliente(cliente.id, form);
      onSaved();
      onClose();
    } catch {
      setError('Error al guardar los cambios');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-700">Editar Cliente</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Nombre</label>
          <input type="text" name="nombre" value={form.nombre} onChange={handleChange}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
        </div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-1">Datos personales</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Tipo de cliente</label>
            <select name="tipoCliente" value={form.tipoCliente} onChange={handleChange}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400">
              <option value="">Seleccionar...</option>
              <option value="bueno">Bueno</option>
              <option value="regular">Regular</option>
              <option value="malo">Malo</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Celular</label>
            <input type="text" name="celular" value={form.celular} onChange={handleChange}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>
          <div className="flex flex-col md:col-span-2">
            <label className="text-sm text-gray-600 mb-1">Identificador</label>
            <input type="text" name="identificador" value={form.identificador} onChange={handleChange}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>
        </div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-1">Dirección</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col md:col-span-2">
            <label className="text-sm text-gray-600 mb-1">Calle</label>
            <input type="text" name="calle" value={form.calle} onChange={handleChange}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Número</label>
            <input type="text" name="numero" value={form.numero} onChange={handleChange}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Colonia</label>
            <input type="text" name="colonia" value={form.colonia} onChange={handleChange}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Ciudad</label>
            <input type="text" name="ciudad" value={form.ciudad} onChange={handleChange}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Estado</label>
            <input type="text" name="estado" value={form.estado} onChange={handleChange}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Código Postal</label>
            <input type="text" name="cp" value={form.cp} onChange={handleChange}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>
          <div className="flex flex-col md:col-span-2">
            <label className="text-sm text-gray-600 mb-1">Referencias</label>
            <input type="text" name="referencias" value={form.referencias} onChange={handleChange}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>
        </div>
cat > ~/Downloads/sistema-ventas-frontend-master/components/ClienteForm.js << 'EOF'
'use client';
import { useState } from 'react';
import { addCliente } from '../services/clientesService';

export default function ClienteForm({ onAdded }) {
  const [form, setForm] = useState({
    nombre: '', nombreRecibe: '', celular: '', identificador: '',
    tipoCliente: '', calle: '', numero: '', colonia: '',
    ciudad: '', estado: '', cp: '', referencias: ''
  });
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const tiendaId = localStorage.getItem('tiendaId');
      await addCliente({ ...form, tiendaId });
      setForm({ nombre: '', nombreRecibe: '', celular: '', identificador: '', tipoCliente: '', calle: '', numero: '', colonia: '', ciudad: '', estado: '', cp: '', referencias: '' });
      onAdded();
      setError(false);
      setMensaje('Cliente agregado correctamente');
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      console.error(err);
      setError(true);
      setMensaje('Error al agregar cliente');
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-xl shadow-sm p-8 space-y-6">
      <h2 className="text-xl font-semibold text-gray-700">Nuevo Cliente</h2>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Datos personales</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Nombre del cliente</label>
            <input name="nombre" value={form.nombre} onChange={handleChange} required
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 transition" />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Nombre de quien recibe</label>
            <input name="nombreRecibe" value={form.nombreRecibe} onChange={handleChange}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 transition" />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Celular</label>
            <input name="celular" value={form.celular} onChange={handleChange}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 transition" />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Identificador</label>
            <input name="identificador" value={form.identificador} onChange={handleChange}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 transition" />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Tipo de cliente</label>
            <select name="tipoCliente" value={form.tipoCliente} onChange={handleChange}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 transition">
              <option value="">Seleccionar...</option>
              <option value="bueno">Bueno</option>
              <option value="regular">Regular</option>
              <option value="malo">Malo</option>
            </select>
          </div>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Dirección</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col md:col-span-2">
            <label className="text-sm text-gray-600 mb-1">Calle</label>
            <input name="calle" value={form.calle} onChange={handleChange}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 transition" />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Número</label>
            <input name="numero" value={form.numero} onChange={handleChange}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 transition" />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Colonia</label>
            <input name="colonia" value={form.colonia} onChange={handleChange}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 transition" />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Ciudad</label>
            <input name="ciudad" value={form.ciudad} onChange={handleChange}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 transition" />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Estado</label>
            <input name="estado" value={form.estado} onChange={handleChange}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 transition" />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Código Postal</label>
            <input name="cp" value={form.cp} onChange={handleChange}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 transition" />
          </div>
          <div className="flex flex-col md:col-span-2">
            <label className="text-sm text-gray-600 mb-1">Referencias</label>
            <input name="referencias" value={form.referencias} onChange={handleChange}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 transition" />
          </div>
        </div>
      </div>
      <button type="submit"
        className="bg-sky-500 text-white px-6 py-2 rounded-lg hover:bg-sky-600 transition">
        Guardar Cliente
      </button>
      {mensaje && (
        <div className={`mt-4 px-4 py-2 rounded-lg text-sm ${error ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
          {mensaje}
        </div>
      )}
    </form>
  );
}
