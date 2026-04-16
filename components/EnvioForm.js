// components/EnvioForm.js
'use client';
import { useState, useEffect } from 'react';
import { addEnvio, getEnvios } from '../services/enviosService';
import { getVentas } from '../services/ventasService';

const formatFecha = (fecha) => {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

export default function EnvioForm({ onAdded }) {
  const [ventas, setVentas] = useState([]);
  const [ventasFiltradas, setFiltradas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [form, setForm] = useState({
    fechaEnvio: '', costoEnvio: '', guiaEnvio: ''
  });
  const [mensaje, setMensaje] = useState({ text: '', error: false });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [todasVentas, todosEnvios] = await Promise.all([
      getVentas(),
      getEnvios()
    ]);

    // IDs de ventas que ya tienen una guía asignada
    const ventasConGuia = new Set(
      todosEnvios
        .filter(e => e.guiaEnvio && e.guiaEnvio.trim() !== '')
        .map(e => e.ventaId)
    );

    // Solo ventas sin guía asignada
    const ventasDisponibles = todasVentas.filter(v => !ventasConGuia.has(v.id));
    setVentas(ventasDisponibles);
    setFiltradas([]);
  };

  const handleBusqueda = (e) => {
    const val = e.target.value;
    setBusqueda(val);
    if (!val) { setFiltradas([]); return; }
    setFiltradas(ventas.filter(v =>
      v.clienteNombre?.toLowerCase().includes(val.toLowerCase())
    ));
  };

  const toggleVenta = (id) => {
    setSeleccionadas(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleTodas = () => {
    const idsFiltradas = ventasFiltradas.map(v => v.id);
    const todasMarcadas = idsFiltradas.every(id => seleccionadas.includes(id));
    if (todasMarcadas) {
      setSeleccionadas(prev => prev.filter(id => !idsFiltradas.includes(id)));
    } else {
      setSeleccionadas(prev => [...new Set([...prev, ...idsFiltradas])]);
    }
  };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    if (seleccionadas.length === 0) {
      setMensaje({ text: 'Selecciona al menos una venta', error: true });
      return;
    }
    try {
      await Promise.all(
        seleccionadas.map(ventaId =>
          addEnvio({ ...form, ventaId })
        )
      );
      setSeleccionadas([]);
      setForm({ fechaEnvio: '', costoEnvio: '', guiaEnvio: '' });
      setBusqueda('');
      setFiltradas([]);
      setMensaje({ text: `Envío registrado para ${seleccionadas.length} venta(s)`, error: false });
      onAdded();
      await loadData(); // recargar para ocultar las ventas recién enviadas
      setTimeout(() => setMensaje({ text: '', error: false }), 3000);
    } catch {
      setMensaje({ text: 'Error al registrar envío', error: true });
    }
  };

  const idsFiltradas = ventasFiltradas.map(v => v.id);
  const todasMarcadas = idsFiltradas.length > 0 && idsFiltradas.every(id => seleccionadas.includes(id));

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-xl shadow-md p-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-700">Registrar Envío</h2>

      {/* Datos del envío */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="text-gray-600 mb-1">Fecha de Envío</label>
          <input
            type="date"
            name="fechaEnvio"
            value={form.fechaEnvio}
            onChange={handleChange}
            required
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-gray-600 mb-1">Costo de Envío</label>
          <input
            type="number"
            name="costoEnvio"
            placeholder="$0.00"
            value={form.costoEnvio}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>

        <div className="flex flex-col md:col-span-2">
          <label className="text-gray-600 mb-1">Número de Guía</label>
          <input
            name="guiaEnvio"
            placeholder="Número de guía de envío"
            value={form.guiaEnvio}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>
      </div>

      {/* Selección de ventas */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-gray-600 font-medium">
            Ventas a incluir
            {seleccionadas.length > 0 && (
              <span className="ml-2 bg-sky-100 text-sky-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                {seleccionadas.length} seleccionada(s)
              </span>
            )}
          </label>
          {seleccionadas.length > 0 && (
            <button
              type="button"
              onClick={() => setSeleccionadas([])}
              className="text-xs text-red-400 hover:text-red-600 transition"
            >
              Limpiar selección
            </button>
          )}
        </div>

        {/* Buscador */}
        <input
          type="text"
          value={busqueda}
          onChange={handleBusqueda}
          placeholder="Filtrar por nombre de cliente..."
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
        />

        {/* Lista con checkboxes */}
        <div className="border rounded-lg overflow-hidden">
          {ventasFiltradas.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b">
              <input
                type="checkbox"
                checked={todasMarcadas}
                onChange={toggleTodas}
                className="accent-sky-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Seleccionar todas ({ventasFiltradas.length})
              </span>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto divide-y">
            {/* Sin búsqueda todavía */}
            {!busqueda && (
              <div className="px-4 py-6 text-sm text-gray-400 text-center">
                Escribe un nombre para buscar ventas disponibles
              </div>
            )}

            {/* Búsqueda activa sin resultados */}
            {busqueda && ventasFiltradas.length === 0 && (
              <div className="px-4 py-4 text-sm text-gray-400 text-center">
                No se encontraron ventas sin guía asignada
              </div>
            )}

            {/* Resultados */}
            {ventasFiltradas.map(v => {
              const pagadoCompleto = v.pagadoCompleto;
              const totalPagado = Number(v.totalPagado ?? 0);
              const montoTotal = Number(v.montoTotal ?? 0);
              const saldo = montoTotal - totalPagado;

              return (
                <label
                  key={v.id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition
        ${seleccionadas.includes(v.id) ? 'bg-sky-50' : 'hover:bg-gray-50'}`}
                >
                  <input
                    type="checkbox"
                    checked={seleccionadas.includes(v.id)}
                    onChange={() => toggleVenta(v.id)}
                    className="accent-sky-500 w-4 h-4 cursor-pointer flex-shrink-0"
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {v.clienteNombre}
                      </span>
                      {/* Badge estatus pago */}
                      {pagadoCompleto ? (
                        <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-600">
                          ✓ Pagado
                        </span>
                      ) : (
                        <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">
                          Debe ${saldo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatFecha(v.fechaCompra)} · {v.responsable} ·{' '}
                      <span className="text-gray-500 font-medium">
                        ${montoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={seleccionadas.length === 0}
        className="w-full bg-sky-500 text-white font-semibold py-2 rounded-lg hover:bg-sky-600 transition disabled:opacity-40"
      >
        Registrar Envío {seleccionadas.length > 0 ? `(${seleccionadas.length} ventas)` : ''}
      </button>

      {mensaje.text && (
        <div className={`px-4 py-2 rounded-lg text-sm ${mensaje.error ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
          }`}>
          {mensaje.text}
        </div>
      )}
    </form>
  );
}