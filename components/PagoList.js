// components/PagoList.js
'use client';
import { useEffect, useState } from 'react';
import { getVentas } from '../services/ventasService';
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

const sumarDias = (fecha, dias) => {
  const d = new Date(fecha);
  d.setDate(d.getDate() + dias);
  return d;
};

const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  const a = new Date(d1);
  const b = new Date(d2);
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth()    === b.getUTCMonth() &&
    a.getUTCDate()     === b.getUTCDate()
  );
};

const calcularCuotas = (v) => {
  const total = Number(v.montoTotal);
  const base  = total / 4;
  const fecha = new Date(v.fechaCompra);

  const tieneRegistroC1 = v.cuotasPagadas?.some(p => p.num === 1);
  const pagadoC1Extra   = v.cuotasPagadas?.find(p => p.num === 1)?.montoPagado ?? 0;
  const pagadoC1Total   = tieneRegistroC1 ? pagadoC1Extra : Number(v.anticipo || 0) + pagadoC1Extra;
  const residuoC1       = pagadoC1Total - base;

  const montoC2      = Math.max(0, base - Math.max(0, residuoC1));
  const pagadoC2     = v.cuotasPagadas?.find(p => p.num === 2)?.montoPagado ?? 0;
  const residuoC2    = Math.max(0, residuoC1) - base + pagadoC2;

  const montoC3      = Math.max(0, base - Math.max(0, residuoC2));
  const pagadoC3     = v.cuotasPagadas?.find(p => p.num === 3)?.montoPagado ?? 0;
  const residuoC3    = Math.max(0, residuoC2) - base + pagadoC3;

  const montoC4  = Math.max(0, base - Math.max(0, residuoC3));
  const pagadoC4 = v.cuotasPagadas?.find(p => p.num === 4)?.montoPagado ?? 0;

  return [
    { num: 1, fecha,                       monto: base,    pagado: pagadoC1Total, label: 'Cuota 1' },
    { num: 2, fecha: sumarDias(fecha, 15), monto: montoC2, pagado: pagadoC2,      label: 'Cuota 2' },
    { num: 3, fecha: sumarDias(fecha, 30), monto: montoC3, pagado: pagadoC3,      label: 'Cuota 3' },
    { num: 4, fecha: sumarDias(fecha, 45), monto: montoC4, pagado: pagadoC4,      label: 'Cuota 4' },
  ];
};

export default function PagoList() {
  const [ventas, setVentas]             = useState([]);
  const [user, setUser]                 = useState(null);
  const [fechaVenta, setFechaVenta]     = useState('');
  const [fechaCuota, setFechaCuota]     = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [expandidaId, setExpandidaId]   = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user]);

  const load = async () => {
    const [todasVentas, todosEnvios] = await Promise.all([
      getVentas(),
      getEnvios()
    ]);

    // IDs de ventas que ya tienen guía asignada
    const ventasConGuia = new Set(
      todosEnvios
        .filter(e => e.guiaEnvio && e.guiaEnvio.trim() !== '')
        .map(e => e.ventaId)
    );

    // Solo ventas sin guía
    const ventasSinEnvio = todasVentas.filter(v => !ventasConGuia.has(v.id));
    setVentas(Array.isArray(ventasSinEnvio) ? ventasSinEnvio : []);
  };

  if (!user) return <p className="text-red-600">Debes iniciar sesión.</p>;

  const esSuperusuario = user.rol === 'superusuario';

  const ventasFiltradas = ventas.filter(v => {
    if (!fechaVenta) return true;
    return isSameDay(v.fechaCompra, fechaVenta);
  });

  const resultado = ventasFiltradas.map(v => {
    const cuotas = calcularCuotas(v);
    let cuotasFiltradas = cuotas;

    if (fechaCuota) {
      cuotasFiltradas = cuotas.filter(c => isSameDay(c.fecha, fechaCuota));
    }

    if (filtroEstado !== 'todos') {
      cuotasFiltradas = cuotasFiltradas.filter(c => {
        const pagada = c.pagado >= c.monto;
        return filtroEstado === 'pagado' ? pagada : !pagada;
      });
    }

    return { ...v, cuotasFiltradas };
  }).filter(v => !fechaCuota && filtroEstado === 'todos' ? true : v.cuotasFiltradas.length > 0);

  const totalVentas  = resultado.reduce((sum, v) => sum + Number(v.montoTotal), 0);
  const totalCobrado = resultado.reduce((sum, v) =>
    sum + calcularCuotas(v).reduce((s, c) => s + Number(c.pagado || 0), 0), 0
  );

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-semibold text-gray-700">Pagos Registrados</h2>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Fecha de venta</label>
          <input
            type="date"
            value={fechaVenta}
            onChange={e => setFechaVenta(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Fecha de cuota</label>
          <input
            type="date"
            value={fechaCuota}
            onChange={e => setFechaCuota(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Estado</label>
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <option value="todos">Todos</option>
            <option value="pagado">Pagado</option>
            <option value="pendiente">Pendiente</option>
          </select>
        </div>
      </div>

      {(fechaVenta || fechaCuota || filtroEstado !== 'todos') && (
        <button
          onClick={() => { setFechaVenta(''); setFechaCuota(''); setFiltroEstado('todos'); }}
          className="text-sm text-sky-500 hover:underline self-start"
        >
          Limpiar filtros
        </button>
      )}

      {resultado.length === 0 ? (
        <p className="text-gray-500 text-center py-6">No se encontraron registros</p>
      ) : (
        <div className="flex flex-col gap-3">
          {resultado.map(v => {
            const cuotas      = calcularCuotas(v);
            const totalPagado = cuotas.reduce((s, c) => s + Number(c.pagado || 0), 0);
            const adeudo      = Math.max(0, Number(v.montoTotal) - totalPagado);
            const liquidada   = adeudo === 0;

            return (
              <div key={v.id} className="border rounded-xl bg-white shadow-sm overflow-hidden">

                {/* Encabezado */}
                <div
                  className="px-5 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpandidaId(expandidaId === v.id ? null : v.id)}
                >
                  <div>
                    <p className="font-semibold text-gray-700">{v.clienteNombre}</p>
                    <p className="text-xs text-gray-400">
                      Venta: {formatFecha(v.fechaCompra)} · Responsable: {v.responsable}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-700">{fmt(v.montoTotal)}</p>
                      {liquidada ? (
                        <span className="text-xs font-semibold text-green-600">✓ Liquidada</span>
                      ) : (
                        <span className="text-xs font-semibold text-red-500">Adeudo: {fmt(adeudo)}</span>
                      )}
                    </div>
                    <span className="text-gray-400 text-xs">{expandidaId === v.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Detalle expandido */}
                {expandidaId === v.id && (
                  <div className="px-5 py-3 border-t bg-gray-50 flex flex-col gap-2">

                    {/* Cuotas */}
                    {(fechaCuota || filtroEstado !== 'todos' ? v.cuotasFiltradas : cuotas).map(c => {
                      const pagada   = c.pagado >= c.monto;
                      const parcial  = c.pagado > 0 && !pagada;
                      const faltante = Math.max(0, c.monto - c.pagado);
                      return (
                        <div key={c.num} className="flex justify-between items-center py-2 border-b last:border-0">
                          <div>
                            <p className="text-sm font-medium text-gray-700">{c.label}</p>
                            <p className="text-xs text-gray-400">{formatFecha(c.fecha)}</p>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            <p className="text-sm font-semibold text-gray-700">{fmt(c.monto)}</p>
                            {pagada && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                Pagado {fmt(c.pagado)}
                              </span>
                            )}
                            {parcial && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                Parcial {fmt(c.pagado)} — Falta {fmt(faltante)}
                              </span>
                            )}
                            {!pagada && !parcial && (
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                Pendiente
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Resumen */}
                    <div className="mt-1 pt-3 border-t space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Monto total</span>
                        <span className="font-semibold text-gray-700">{fmt(v.montoTotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total pagado</span>
                        <span className="font-semibold text-green-600">{fmt(totalPagado)}</span>
                      </div>
                      <div className="flex justify-between text-sm border-t pt-1.5">
                        <span className="font-semibold text-gray-700">Adeudo para liquidar</span>
                        <span className={`font-bold ${liquidada ? 'text-green-600' : 'text-red-500'}`}>
                          {liquidada ? '✓ Liquidada' : fmt(adeudo)}
                        </span>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Resumen superusuario */}
      resultado.length > 0 && (
        <div className="border rounded-xl bg-white shadow-sm px-5 py-4 space-y-2">
          <p className="text-sm font-semibold text-gray-600 mb-1">Resumen general</p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total ventas</span>
            <span className="font-semibold text-gray-700">{fmt(totalVentas)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total cobrado</span>
            <span className="font-semibold text-green-600">{fmt(totalCobrado)}</span>
          </div>
          <div className="flex justify-between text-sm border-t pt-2">
            <span className="font-semibold text-gray-700">Por cobrar</span>
            <span className="font-bold text-red-500">{fmt(totalVentas - totalCobrado)}</span>
          </div>
        </div>
      )}

    </div>
  );
}