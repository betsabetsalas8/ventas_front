// components/VentaList.js
'use client';
import { useEffect, useState } from 'react';
import { getEnvios } from '../services/enviosService';
import { getVentas, updateVenta, deleteVenta, updateCuotaPagada, deleteCuotaPagada } from '../services/ventasService';

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

const calcularCuotas = (v) => {
  const total = Number(v.montoTotal);
  const base  = total / 4;
  const fecha = new Date(v.fechaCompra);
  const hoy   = new Date(); hoy.setHours(0, 0, 0, 0);

  const tieneRegistroC1 = v.cuotasPagadas?.some(p => p.num === 1);
  const pagadoC1Extra   = v.cuotasPagadas?.find(p => p.num === 1)?.montoPagado ?? 0;
  const pagadoC1Total   = tieneRegistroC1 ? pagadoC1Extra : Number(v.anticipo || 0) + pagadoC1Extra;

  const fechaC2 = sumarDias(fecha, 15);
  const fechaC3 = sumarDias(fecha, 30);
  const fechaC4 = sumarDias(fecha, 45);

  const vencioC2 = hoy >= fechaC2;
  const vencioC3 = hoy >= fechaC3;

  const residuoC1 = pagadoC1Total - base;
  const adeudoC1  = vencioC2 ? Math.max(0, -residuoC1) : 0;
  const montoC2   = Math.max(0, base + adeudoC1 - Math.max(0, residuoC1));
  const pagadoC2  = v.cuotasPagadas?.find(p => p.num === 2)?.montoPagado ?? 0;
  const residuoC2 = pagadoC2 - montoC2;

  const adeudoC2  = vencioC3 ? Math.max(0, -residuoC2) : 0;
  const montoC3   = Math.max(0, base + adeudoC2 - Math.max(0, residuoC2));
  const pagadoC3  = v.cuotasPagadas?.find(p => p.num === 3)?.montoPagado ?? 0;
  const residuoC3 = pagadoC3 - montoC3;

  const adeudoC3 = Math.max(0, -residuoC3);
  const montoC4  = Math.max(0, base + adeudoC3 - Math.max(0, residuoC3));
  const pagadoC4 = v.cuotasPagadas?.find(p => p.num === 4)?.montoPagado ?? 0;

  return [
    { num: 1, label: 'Cuota 1', fecha: formatFecha(fecha),   monto: base,    pagado: pagadoC1Total },
    { num: 2, label: 'Cuota 2', fecha: formatFecha(fechaC2), monto: montoC2, pagado: pagadoC2, adeudo: adeudoC1 },
    { num: 3, label: 'Cuota 3', fecha: formatFecha(fechaC3), monto: montoC3, pagado: pagadoC3, adeudo: adeudoC2 },
    { num: 4, label: 'Cuota 4', fecha: formatFecha(fechaC4), monto: montoC4, pagado: pagadoC4, adeudo: adeudoC3 },
  ];
};

function ModalEditarVenta({ venta, onClose, onSaved }) {
  const [montoTotal, setMontoTotal] = useState(String(venta.montoTotal));
  const [anticipo,   setAnticipo]   = useState(String(venta.anticipo ?? ''));
  const [guardando,  setGuardando]  = useState(false);
  const [error,      setError]      = useState('');

  const base        = Number(montoTotal) / 4;
  const anticipoNum = Number(anticipo) || 0;
  const faltante    = Math.max(0, base - anticipoNum);

  const handleGuardar = async () => {
    if (!montoTotal || Number(montoTotal) <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await updateVenta(venta.id, {
        montoTotal: Number(montoTotal),
        anticipo:   Number(anticipo) || 0,
        cuota1: base, cuota2: base, cuota3: base, cuota4: base,
      });
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-700">Editar Venta</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-500 mb-1">Cliente</label>
          <input type="text" value={venta.clienteNombre} readOnly
            className="border rounded-lg px-3 py-2 bg-gray-50 text-gray-400 cursor-not-allowed text-sm" />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Monto total</label>
          <input type="number" value={montoTotal} onChange={e => setMontoTotal(e.target.value)} min="0"
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">
            Primer pago <span className="text-xs text-gray-400 ml-1">(opcional)</span>
          </label>
          <input type="number" value={anticipo} onChange={e => setAnticipo(e.target.value)} min="0" placeholder="$0.00"
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
        </div>
        {Number(montoTotal) > 0 && (
          <div className="bg-gray-50 border rounded-lg px-4 py-3 text-sm space-y-1.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Nuevo desglose</p>
            <div className="flex justify-between text-gray-600">
              <span>Cuota base (25%)</span>
              <span className="font-medium">{fmt(base)}</span>
            </div>
            {anticipoNum > 0 && (
              <>
                <div className="flex justify-between text-gray-600">
                  <span>Primer pago</span>
                  <span className="font-medium text-green-600">− {fmt(anticipoNum)}</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="font-medium">Saldo cuota 1</span>
                  <span className={`font-semibold ${faltante === 0 ? 'text-green-600' : 'text-amber-600'}`}>
                    {faltante === 0 ? '✓ Cubierta' : fmt(faltante)}
                  </span>
                </div>
              </>
            )}
          </div>
        )}
        {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
          <button onClick={handleGuardar} disabled={guardando}
            className="flex-1 bg-sky-500 text-white rounded-lg py-2 text-sm font-semibold hover:bg-sky-600 transition disabled:opacity-40">
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VentaList({ usuario, isAdmin }) {
  const [ventas,        setVentas]        = useState([]);
  const [search,        setSearch]        = useState('');
  const [expandida,     setExpandida]     = useState(null);
  const [ventaEditar,   setVentaEditar]   = useState(null);
  const [ventaEliminar, setVentaEliminar] = useState(null);
  const [cuotaEditar,   setCuotaEditar]   = useState(null);
  const [cuotaEliminar, setCuotaEliminar] = useState(null);
  const [montoEditando, setMontoEditando] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [todasVentas, todosEnvios] = await Promise.all([getVentas(), getEnvios()]);
    const ventasConGuia = new Set(
      todosEnvios.filter(e => e.guiaEnvio && e.guiaEnvio.trim() !== '').map(e => e.ventaId)
    );
    const ventasSinEnvio = todasVentas.filter(v => !ventasConGuia.has(v.id));
    setVentas(Array.isArray(ventasSinEnvio) ? ventasSinEnvio : []);
  };

  const handleEliminar = async (id) => {
    try { await deleteVenta(id); setVentaEliminar(null); load(); }
    catch { alert('Error al eliminar la venta'); }
  };

  const handleEditarCuota = async () => {
    if (!montoEditando || Number(montoEditando) <= 0) return;
    try {
      await updateCuotaPagada(cuotaEditar.id, parseFloat(montoEditando), cuotaEditar.ventaId);
      setCuotaEditar(null);
      load();
    } catch { alert('Error al actualizar el pago'); }
  };

  const handleEliminarCuota = async () => {
    try { await deleteCuotaPagada(cuotaEliminar.id); setCuotaEliminar(null); load(); }
    catch { alert('Error al eliminar el pago'); }
  };

  const filtradas = ventas.filter(v =>
    Object.values(v).join(' ').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">

      {ventaEditar && (
        <ModalEditarVenta venta={ventaEditar} onClose={() => setVentaEditar(null)} onSaved={load} />
      )}

      {ventaEliminar && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">¿Eliminar venta?</h3>
            <p className="text-sm text-gray-500">Esta acción no se puede deshacer. Se eliminarán también todos los pagos registrados.</p>
            <div className="flex gap-3">
              <button onClick={() => setVentaEliminar(null)} className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={() => handleEliminar(ventaEliminar)} className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-semibold hover:bg-red-600 transition">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {cuotaEditar && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-700">Editar pago — {cuotaEditar.label}</h3>
              <button onClick={() => setCuotaEditar(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Monto pagado</label>
              <input type="number" value={montoEditando} onChange={e => setMontoEditando(e.target.value)}
                min="0.01" step="0.01"
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCuotaEditar(null)} className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={handleEditarCuota} className="flex-1 bg-sky-500 text-white rounded-lg py-2 text-sm font-semibold hover:bg-sky-600 transition">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {cuotaEliminar && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">¿Eliminar este pago?</h3>
            <p className="text-sm text-gray-500">
              Se eliminará el pago de <strong>{cuotaEliminar.label}</strong> por <strong>{fmt(cuotaEliminar.montoPagado)}</strong>.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setCuotaEliminar(null)} className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={handleEliminarCuota} className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-semibold hover:bg-red-600 transition">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold text-gray-700">Ventas Registradas</h2>

      <input type="text" placeholder="Buscar venta..." value={search}
        onChange={e => setSearch(e.target.value)}
        className="border rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400" />

      {filtradas.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filtradas.map(v => {
            const totalPagado = Number(v.totalPagado ?? v.anticipo ?? 0);
            const saldo       = Number(v.montoTotal) - totalPagado;
            const abierta     = expandida === v.id;
            const cuotas      = calcularCuotas(v); // ← ahora recibe v completo

            return (
              <div key={v.id} className="border rounded-xl bg-white shadow-sm overflow-hidden">

                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpandida(abierta ? null : v.id)}>
                  <div>
                    <p className="text-xs text-gray-400">Cliente</p>
                    <p className="font-medium text-gray-700 text-sm">{v.clienteNombre}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Responsable</p>
                    <p className="text-sm text-gray-600">{v.responsable}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Fecha venta</p>
                    <p className="text-sm text-gray-600">{formatFecha(v.fechaCompra)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Monto total</p>
                    <p className="text-sm font-semibold text-gray-700">{fmt(v.montoTotal)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">Saldo pendiente</p>
                      <p className={`text-sm font-semibold ${saldo > 0 ? 'text-red-500' : 'text-green-600'}`}>
                        {saldo > 0 ? fmt(saldo) : '✓ Pagado'}
                      </p>
                    </div>
                    <span className="text-gray-400 text-xs ml-2">{abierta ? '▲' : '▼'}</span>
                  </div>
                </div>

                {abierta && (
                  <div className="border-t bg-gray-50 px-5 py-4">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan de pagos quincenal</p>
                      <div className="flex gap-2">
                        <button onClick={e => { e.stopPropagation(); setVentaEditar(v); }}
                          className="text-xs px-3 py-1 rounded-lg border border-sky-300 text-sky-600 hover:bg-sky-50 transition">
                          ✏️ Editar monto
                        </button>
                        <button onClick={e => { e.stopPropagation(); setVentaEliminar(v.id); }}
                          className="text-xs px-3 py-1 rounded-lg border border-red-300 text-red-500 hover:bg-red-50 transition">
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>

                    {cuotas.map((c, i) => {
                      const cuotaPagada = v.cuotasPagadas?.find(p => p.num === c.num);
                      const saldoCuota  = Math.max(0, c.monto - c.pagado);
                      const completa    = c.monto > 0 && c.pagado >= c.monto;
                      const sinCargo    = c.monto === 0;

                      return (
                        <div key={i} className="flex justify-between items-center py-2.5 border-b last:border-0">
                          <div>
                            <p className={`text-sm font-medium ${completa ? 'text-green-600' : sinCargo ? 'text-gray-400' : 'text-gray-700'}`}>
                              {c.label}
                            </p>
                            <p className="text-xs text-gray-400">{c.fecha}</p>
                            {completa && (
                              <p className="text-xs text-green-600">✓ Cuota completa</p>
                            )}
                            {!completa && !sinCargo && c.pagado > 0 && (
                              <p className="text-xs text-amber-500">
                                Pagado: {fmt(c.pagado)} — Falta: {fmt(saldoCuota)}
                              </p>
                            )}
                            {!completa && !sinCargo && c.adeudo > 0 && (
                              <p className="text-xs text-red-500">
                                Incluye {fmt(c.adeudo)} de cuota anterior vencida
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-semibold ${
                              completa   ? 'text-green-600' :
                              sinCargo   ? 'text-gray-300'  :
                              saldoCuota > 0 ? 'text-red-500' : 'text-gray-700'
                            }`}>
                              {sinCargo ? '—' : fmt(c.monto)}
                            </p>
                            {cuotaPagada && (
                              <div className="flex gap-1">
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    setCuotaEditar({ ...cuotaPagada, label: c.label, ventaId: v.id });
                                    setMontoEditando(String(cuotaPagada.montoPagado));
                                  }}
                                  className="text-xs px-2 py-0.5 rounded border border-sky-200 text-sky-500 hover:bg-sky-50 transition"
                                >✏️</button>
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    setCuotaEliminar({ ...cuotaPagada, label: c.label });
                                  }}
                                  className="text-xs px-2 py-0.5 rounded border border-red-200 text-red-400 hover:bg-red-50 transition"
                                >🗑️</button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <div className="mt-3 pt-3 border-t space-y-1">
                      <div className="flex justify-between">
                        <p className="text-sm text-gray-500">Monto total</p>
                        <p className="text-sm font-semibold text-gray-700">{fmt(v.montoTotal)}</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-sm text-gray-500">Total pagado</p>
                        <p className="text-sm font-semibold text-green-600">{fmt(totalPagado)}</p>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <p className="text-sm font-semibold text-gray-700">Saldo restante</p>
                        <p className={`text-sm font-semibold ${saldo > 0 ? 'text-red-500' : 'text-green-600'}`}>
                          {saldo > 0 ? fmt(saldo) : '✓ Liquidado'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-gray-500 p-6">No se encontraron ventas sin envío asignado</div>
      )}
    </div>
  );
}