// components/EnvioList.js
'use client';
import { useEffect, useState } from 'react';
import { getEnvios } from '../services/enviosService';

const fmt = (n) => n != null
  ? `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
  : '—';

const formatFecha = (fecha) => {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  const fechaDB = new Date(d1).toLocaleDateString('en-CA');
  const fechaInput = new Date(d2 + 'T12:00:00').toLocaleDateString('en-CA');
  return fechaDB === fechaInput;
};

export default function EnvioList() {
  const [envios, setEnvios] = useState([]);
  const [user, setUser] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [guiaFiltro, setGuiaFiltro] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user]);

  const load = async () => {
    let data = await getEnvios();
    if (user?.rol !== 'superusuario') {
      data = data.filter(e => e.usuarioId === user.id);
    }
    setEnvios(data);
  };

  if (!user) return (
    <p className="text-red-600">Debes iniciar sesión para ver los envíos.</p>
  );

  // Filtrar envíos individuales
  const filtrados = envios.filter(e => {
    const coincideCliente = busqueda
      ? e.clienteNombre?.toLowerCase().includes(busqueda.toLowerCase())
      : true;
    const coincideFecha = fechaFiltro
      ? isSameDay(e.fechaEnvio, fechaFiltro)
      : true;
    const coincideGuia = guiaFiltro
      ? e.guiaEnvio?.toLowerCase().includes(guiaFiltro.toLowerCase())
      : true;
    return coincideCliente && coincideFecha && coincideGuia;
  });

  // Agrupar por número de guía
  const grupos = filtrados.reduce((acc, e) => {
    const guia = e.guiaEnvio || 'Sin guía';
    if (!acc[guia]) {
      acc[guia] = {
        guia,
        fechaEnvio: e.fechaEnvio,
        costoEnvio: e.costoEnvio,
        ventas: []
      };
    }
    acc[guia].ventas.push(e);
    return acc;
  }, {});

  const listaGuias = Object.values(grupos);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-gray-700">Envíos Registrados</h2>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Buscar cliente</label>
          <input
            type="text"
            placeholder="Nombre del cliente..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Fecha de envío</label>
          <input
            type="date"
            value={fechaFiltro}
            onChange={e => setFechaFiltro(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Número de guía</label>
          <input
            type="text"
            placeholder="Número de guía..."
            value={guiaFiltro}
            onChange={e => setGuiaFiltro(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>
      </div>

      {(busqueda || fechaFiltro || guiaFiltro) && (
        <button
          onClick={() => { setBusqueda(''); setFechaFiltro(''); setGuiaFiltro(''); }}
          className="text-sm text-sky-500 hover:underline self-start"
        >
          Limpiar filtros
        </button>
      )}

      {/* Lista agrupada por guía */}
      {listaGuias.length === 0 ? (
        <p className="text-gray-500 text-center py-6">No se encontraron envíos</p>
      ) : (
        <div className="flex flex-col gap-4">
          {listaGuias.map(grupo => (
            <div key={grupo.guia} className="border rounded-xl bg-white shadow-sm overflow-hidden">

              {/* Cabecera de la guía */}
              <div className="bg-sky-50 border-b px-5 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-sky-500 uppercase tracking-wide">
                    Guía
                  </span>
                  <span className="font-bold text-gray-700">{grupo.guia}</span>
                  <span className="bg-sky-100 text-sky-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {grupo.ventas.length} venta{grupo.ventas.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>📅 {formatFecha(grupo.fechaEnvio)}</span>
                  <span className="font-semibold text-gray-700">{fmt(grupo.costoEnvio)}</span>
                </div>
              </div>

              {/* Tabla de ventas */}
              <div className="divide-y">
                {/* Encabezado tabla */}
                <div className="grid grid-cols-3 px-5 py-2 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  <span>Cliente</span>
                  <span className="text-center">Fecha de venta</span>
                  <span className="text-right">Monto de venta</span>
                </div>

                {/* Filas */}
                {grupo.ventas.map(v => (
                  <div key={v.id} className="grid grid-cols-3 px-5 py-3 items-center hover:bg-gray-50 transition">
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {v.clienteNombre}
                    </span>
                    <span className="text-sm text-gray-500 text-center">
                      {formatFecha(v.fechaCompra)}  {/* ← fecha de venta */}
                    </span>
                    <span className="text-sm font-semibold text-gray-700 text-right">
                      {fmt(v.montoTotal)}  {/* ← monto de venta */}
                    </span>
                  </div>
                ))}
                {/* Total de la guía */}
                <div className="grid grid-cols-3 px-5 py-2.5 bg-gray-50 items-center">
                  <span className="text-xs font-semibold text-gray-400 uppercase col-span-2">
                    Total de ventas en esta guía
                  </span>
                  <span className="text-sm font-bold text-sky-600 text-right">
                    {fmt(grupo.ventas.reduce((s, v) => s + Number(v.montoTotal ?? 0), 0))}
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}