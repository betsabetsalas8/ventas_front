// components/ResumenClientes.js
'use client';
import { useEffect, useState } from 'react';
import { getVentas } from '../services/ventasService';
import { getEnvios } from '../services/enviosService';
import { pagoGeneral, getSaldoAFavor } from '../services/pagosService';

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
  const ant   = Number(v.anticipo || 0);
  const tieneRegistroC1 = v.cuotasPagadas?.some(p => p.num === 1);
  const pagadoC1Extra   = v.cuotasPagadas?.find(p => p.num === 1)?.montoPagado ?? 0;
  const pagadoC1Total   = tieneRegistroC1 ? pagadoC1Extra : ant + pagadoC1Extra;
  const residuoC1       = pagadoC1Total - base;

  const montoC2   = Math.max(0, base - Math.max(0, residuoC1));
  const pagadoC2  = v.cuotasPagadas?.find(p => p.num === 2)?.montoPagado ?? 0;
  const residuoC2 = Math.max(0, residuoC1) - base + pagadoC2;

  const montoC3   = Math.max(0, base - Math.max(0, residuoC2));
  const pagadoC3  = v.cuotasPagadas?.find(p => p.num === 3)?.montoPagado ?? 0;
  const residuoC3 = Math.max(0, residuoC2) - base + pagadoC3;

  const montoC4  = Math.max(0, base - Math.max(0, residuoC3));
  const pagadoC4 = v.cuotasPagadas?.find(p => p.num === 4)?.montoPagado ?? 0;

  return [
    { num: 1, label: 'Cuota 1', fecha: fecha,                       monto: base,    pagado: pagadoC1Total },
    { num: 2, label: 'Cuota 2', fecha: sumarDias(fecha, 15),         monto: montoC2, pagado: pagadoC2 },
    { num: 3, label: 'Cuota 3', fecha: sumarDias(fecha, 30),         monto: montoC3, pagado: pagadoC3 },
    { num: 4, label: 'Cuota 4', fecha: sumarDias(fecha, 45),         monto: montoC4, pagado: pagadoC4 },
];
};

const cuotaPendiente = (v) => {
  const cuotas = calcularCuotas(v);
  return cuotas.find(c => c.monto > 0 && c.pagado < c.monto) ?? null;
};

function ModalPagoGeneral({ cliente, onClose, onSaved }) {
  const [monto,      setMonto]      = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [fechaPago,  setFechaPago]  = useState(new Date().toISOString().split('T')[0]);
  const [saldoFavor, setSaldoFavor] = useState(0);
  const [resultado,  setResultado]  = useState(null);
  const [guardando,  setGuardando]  = useState(false);
  const [error,      setError]      = useState('');

  useEffect(() => {
    getSaldoAFavor(cliente.clienteId).then(r => setSaldoFavor(r.saldo));
  }, []);

  const handlePagar = async () => {
    if (!monto || Number(monto) <= 0) {
      setError('Ingresa un monto válido');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      const res = await pagoGeneral({
        clienteId:  cliente.clienteId,
        montoTotal: Number(monto),
        fechaPago,
        metodoPago
      });
      setResultado(res);
      onSaved();
    } catch {
      setError('Error al procesar el pago');
    } finally {
      setGuardando(false);
    }
  };

  // Calcula preview de distribución
  const calcularPreview = () => {
    let restante = Number(monto);
    const filas = [];
    const ventasOrdenadas = cliente.ventas
      .slice()
      .sort((a, b) => new Date(a.fechaCompra) - new Date(b.fechaCompra));

    for (const v of ventasOrdenadas) {
      if (restante <= 0) break;
      const pagado = Number(v.totalPagado ?? v.anticipo ?? 0);
      const saldo  = Math.max(0, Number(v.montoTotal) - pagado);
      if (saldo <= 0) continue;
      const abono = Math.min(restante, saldo);
      restante -= abono;
      filas.push({ v, abono, saldo, liquidada: abono >= saldo });
    }
    return { filas, sobrante: restante };
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4 max-h-[90vh] overflow-y-auto">

        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-700">Pago General</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* Info cliente */}
        <div className="bg-sky-50 border border-sky-100 rounded-lg px-4 py-2 text-sm">
          <p className="font-medium text-gray-700">{cliente.clienteNombre}</p>
          <p className="text-xs text-gray-400">
            {cliente.ventas.length} ventas · Debe: {fmt(cliente.totalDeuda)}
          </p>
          {saldoFavor > 0 && (
            <p className="text-xs text-green-600 mt-0.5 font-medium">
              Saldo a favor actual: {fmt(saldoFavor)}
            </p>
          )}
        </div>

        {resultado ? (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3 text-sm space-y-1">
              <p className="font-semibold text-green-700">✓ Pago distribuido correctamente</p>
              <p className="text-gray-500">Se aplicó a {resultado.distribucion.length} venta(s)</p>
              {resultado.saldoAFavor > 0 && (
                <p className="text-green-600 font-medium">
                  Nuevo saldo a favor: {fmt(resultado.saldoAFavor)}
                </p>
              )}
            </div>
            <button onClick={onClose}
              className="w-full bg-sky-500 text-white rounded-lg py-2 text-sm font-semibold hover:bg-sky-600 transition">
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Monto a pagar</label>
              <input type="number" value={monto} onChange={e => setMonto(e.target.value)}
                min="0" placeholder="$0.00"
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Fecha de pago</label>
              <input type="date" value={fechaPago} onChange={e => setFechaPago(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Método de pago</label>
              <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400">
                <option value="">Seleccionar...</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Tarjeta">Tarjeta</option>
              </select>
            </div>

            {/* Preview */}
            {Number(monto) > 0 && (() => {
              const { filas, sobrante } = calcularPreview();
              return (
                <div className="bg-gray-50 border rounded-lg px-4 py-3 text-xs space-y-1.5 max-h-48 overflow-y-auto">
                  <p className="font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Se distribuirá así:
                  </p>
                  {filas.map(({ v, abono, liquidada }) => (
                    <div key={v.id} className="flex justify-between text-gray-600">
                      <span>{formatFecha(v.fechaCompra)} · {fmt(v.montoTotal)}</span>
                      <span className={`font-medium ${liquidada ? 'text-green-600' : 'text-sky-600'}`}>
                        {fmt(abono)}{liquidada ? ' ✓' : ''}
                      </span>
                    </div>
                  ))}
                  {sobrante > 0 && (
                    <div className="flex justify-between text-green-600 border-t pt-1 font-semibold">
                      <span>Saldo a favor</span>
                      <span>{fmt(sobrante)}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <div className="flex gap-3">
              <button onClick={onClose}
                className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button onClick={handlePagar} disabled={guardando || !monto}
                className="flex-1 bg-sky-500 text-white rounded-lg py-2 text-sm font-semibold hover:bg-sky-600 transition disabled:opacity-40">
                {guardando ? 'Procesando...' : 'Aplicar pago'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResumenClientes() {
  const [ventas, setVentas]           = useState([]);
  const [search, setSearch]           = useState('');
  const [expandido, setExpandido]     = useState(null);
  const [clientePago, setClientePago] = useState(null); // ← nuevo

  useEffect(() => { load(); }, []);

const load = async () => {
    const [todasVentas, todosEnvios] = await Promise.all([
      getVentas(),
      getEnvios()
    ]);
    // ← agrega esto
    const venta34 = todasVentas.find(v => v.id === 34);
    console.log('cuotasPagadas venta 34:', venta34?.cuotasPagadas);
    console.log('anticipo venta 34:', venta34?.anticipo);
  
    const ventasConGuia = new Set(
      todosEnvios
        .filter(e => e.guiaEnvio && e.guiaEnvio.trim() !== '')
        .map(e => e.ventaId)
    );
    const ventasSinEnvio = todasVentas.filter(v => !ventasConGuia.has(v.id));
    setVentas(Array.isArray(ventasSinEnvio) ? ventasSinEnvio : []);
  };

  const porCliente = ventas.reduce((acc, v) => {
    const id = v.clienteId;
    if (!acc[id]) {
      acc[id] = { clienteId: id, clienteNombre: v.clienteNombre, ventas: [] };
    }
    acc[id].ventas.push(v);
    return acc;
  }, {});

  const clientes = Object.values(porCliente).map(c => {
    const montoTotal  = c.ventas.reduce((s, v) => s + Number(v.montoTotal || 0), 0);
    const totalPagado = c.ventas.reduce((s, v) => s + Number(v.totalPagado ?? v.anticipo ?? 0), 0);
    const totalDeuda  = Math.max(0, montoTotal - totalPagado);
    return { ...c, montoTotal, totalPagado, totalDeuda };
  });

  const filtrados = clientes.filter(c =>
    c.clienteNombre?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">

      {/* Modal pago general */}
      {clientePago && (
        <ModalPagoGeneral
          cliente={clientePago}
          onClose={() => setClientePago(null)}
          onSaved={() => { setClientePago(null); load(); }}
        />
      )}

      <h2 className="text-xl font-semibold text-gray-700">Resumen por Cliente</h2>

      <input
        type="text"
        placeholder="Buscar cliente..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="border rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
      />

      {filtrados.length === 0 ? (
        <p className="text-gray-500 text-center py-6">No se encontraron clientes</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtrados.map(c => {
            const abierto   = expandido === c.clienteId;
            const liquidado = c.totalDeuda === 0;

            return (
              <div key={c.clienteId} className="border rounded-xl bg-white shadow-sm overflow-hidden">

                {/* Encabezado cliente */}
                <div
                  className="px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpandido(abierto ? null : c.clienteId)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-700">{c.clienteNombre}</p>
                      <p className="text-xs text-gray-400">
                        {c.ventas.length} compra{c.ventas.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Totales desktop */}
                      <div className="hidden md:flex gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-xs text-gray-400">Total comprado</p>
                          <p className="font-semibold text-gray-700">{fmt(c.montoTotal)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400">Total pagado</p>
                          <p className="font-semibold text-green-600">{fmt(c.totalPagado)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400">Total debe</p>
                          <p className={`font-semibold ${liquidado ? 'text-green-600' : 'text-red-500'}`}>
                            {liquidado ? '✓ Al corriente' : fmt(c.totalDeuda)}
                          </p>
                        </div>
                      </div>

                      {/* Botón pago general */}
                      {!liquidado && (
                        <button
                          onClick={e => { e.stopPropagation(); setClientePago(c); }}
                          className="text-xs px-3 py-1.5 rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition flex-shrink-0"
                        >
                          💰 Pago general
                        </button>
                      )}

                      <span className="text-gray-400 text-xs">{abierto ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Totales móvil */}
                  <div className="flex md:hidden gap-4 mt-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Comprado</p>
                      <p className="font-semibold text-gray-700">{fmt(c.montoTotal)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Pagado</p>
                      <p className="font-semibold text-green-600">{fmt(c.totalPagado)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Debe</p>
                      <p className={`font-semibold ${liquidado ? 'text-green-600' : 'text-red-500'}`}>
                        {liquidado ? '✓' : fmt(c.totalDeuda)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detalle de ventas */}
                {abierto && (
                  <div className="border-t bg-gray-50 px-5 py-3 flex flex-col gap-2">

                    <div className="grid grid-cols-3 text-xs font-semibold text-gray-400 uppercase tracking-wide pb-1 border-b">
                      <span>Fecha de venta</span>
                      <span className="text-center">Monto</span>
                      <span className="text-right">Estado</span>
                    </div>

                    {c.ventas.map(v => {
                      const pagado        = Number(v.totalPagado ?? v.anticipo ?? 0);
                      const deuda         = Math.max(0, Number(v.montoTotal) - pagado);
                      const liquidada     = deuda === 0;
                      const proxCuota     = !liquidada ? cuotaPendiente(v) : null;
                      const faltanteCuota = proxCuota ? Math.max(0, proxCuota.monto - proxCuota.pagado) : 0;

                      return (
                        <div key={v.id} className="grid grid-cols-3 items-center py-2 border-b last:border-0">
                          <div>
                            <p className="text-sm text-gray-700">{formatFecha(v.fechaCompra)}</p>
                            <p className="text-xs text-gray-400">{v.responsable}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-gray-700">{fmt(v.montoTotal)}</p>
                            <p className="text-xs text-green-600">Pagado: {fmt(pagado)}</p>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            {liquidada ? (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                ✓ Liquidada
                              </span>
                            ) : (
                              <>
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                  Debe {fmt(deuda)}
                                </span>
                                {proxCuota && (
                                  <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                                    {proxCuota.label}: {fmt(faltanteCuota)}
                                  </span>
                                )}
                                {proxCuota && (
                                  <span className="text-xs text-gray-400">
                                    vence {formatFecha(proxCuota.fecha)}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <div className="mt-1 pt-2 border-t space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total comprado</span>
                        <span className="font-semibold text-gray-700">{fmt(c.montoTotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total pagado</span>
                        <span className="font-semibold text-green-600">{fmt(c.totalPagado)}</span>
                      </div>
                      <div className="flex justify-between text-sm border-t pt-1">
                        <span className="font-semibold text-gray-700">Total que debe</span>
                        <span className={`font-bold ${liquidado ? 'text-green-600' : 'text-red-500'}`}>
                          {liquidado ? '✓ Al corriente' : fmt(c.totalDeuda)}
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
    </div>
  );
}