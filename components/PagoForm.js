// components/PagoForm.js
'use client';
import { useState, useEffect } from 'react';
import { addPago } from '../services/pagosService';
import { getVentas, pagarCuota } from '../services/ventasService';

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

const getPagoCuota = (v, num) =>
  v.cuotasPagadas?.find(p => p.num === num)?.montoPagado ?? 0;

const calcularCuotas = (v) => {
  const total = Number(v.montoTotal);
  const base  = total / 4;
  const fecha = new Date(v.fechaCompra);

  const tieneRegistroC1 = v.cuotasPagadas?.some(p => p.num === 1);
  const pagadoC1Extra   = getPagoCuota(v, 1);
  const pagadoC1Total   = tieneRegistroC1 ? pagadoC1Extra : Number(v.anticipo || 0) + pagadoC1Extra;
  const residuoC1       = pagadoC1Total - base;
  const c1Completa      = pagadoC1Total >= base;

  const montoC2   = c1Completa ? Math.max(0, base - Math.max(0, residuoC1)) : base;
  const pagadoC2  = getPagoCuota(v, 2);
  const residuoC2 = pagadoC2 - montoC2;

  const montoC3   = Math.max(0, base - Math.max(0, residuoC2));
  const pagadoC3  = getPagoCuota(v, 3);
  const residuoC3 = pagadoC3 > 0 ? pagadoC3 - montoC3 : 0;

  const montoC4  = Math.max(0, base - Math.max(0, residuoC3));
  const pagadoC4 = getPagoCuota(v, 4);

  return [
    {
      num: 1, label: 'Cuota 1', fecha,
      monto: base,
      pagado: pagadoC1Total,
      residuo: residuoC1,
      seleccionable: !c1Completa,
      pendiente: Math.max(0, base - pagadoC1Total),
      esC1: true,
    },
    {
      num: 2, label: 'Cuota 2', fecha: sumarDias(fecha, 15),
      monto: montoC2, pagado: pagadoC2,
      faltante: pagadoC2 > 0 ? Math.max(0, montoC2 - pagadoC2) : montoC2,
      residuo: residuoC2,
      adeudoAnterior: residuoC1 < 0 ? Math.abs(residuoC1) : 0,
      excedente: residuoC1 > 0 ? residuoC1 : 0,
      base, seleccionable: true,
      bloqueada: !c1Completa,
    },
    {
      num: 3, label: 'Cuota 3', fecha: sumarDias(fecha, 30),
      monto: montoC3, pagado: pagadoC3,
      faltante: pagadoC3 > 0 ? Math.max(0, montoC3 - pagadoC3) : montoC3,
      residuo: residuoC3,
      adeudoAnterior: residuoC2 < 0 ? Math.abs(residuoC2) : 0,
      excedente: residuoC2 > 0 ? residuoC2 : 0,
      base, seleccionable: true,
    },
    {
      num: 4, label: 'Cuota 4', fecha: sumarDias(fecha, 45),
      monto: montoC4, pagado: pagadoC4,
      faltante: pagadoC4 > 0 ? Math.max(0, montoC4 - pagadoC4) : montoC4,
      adeudoAnterior: residuoC3 < 0 ? Math.abs(residuoC3) : 0,
      excedente: residuoC3 > 0 ? residuoC3 : 0,
      base, seleccionable: true,
    },
  ];
};

export default function PagoForm({ onAdded, usuario }) {
  const [ventas, setVentas]              = useState([]);
  const [busqueda, setBusqueda]          = useState('');
  const [sugerencias, setSugerencias]    = useState([]);
  const [mostrarLista, setMostrarLista]  = useState(false);
  const [ventaSeleccionada, setVentaSel] = useState(null);
  const [cuotaSeleccionada, setCuotaSel] = useState(null);
  const [montoIngresado, setMontoIngresado] = useState('');
  const [metodoPago, setMetodoPago]      = useState('');
  const [fechaPago, setFechaPago]        = useState(new Date().toISOString().split('T')[0]);
  const [mensaje, setMensaje]            = useState({ text: '', error: false });

  useEffect(() => { loadVentas(); }, []);

  const loadVentas = async () => setVentas(await getVentas());

  const handleBusqueda = (e) => {
    const val = e.target.value;
    setBusqueda(val);
    setVentaSel(null);
    setCuotaSel(null);
    setMontoIngresado('');
    if (val.length < 1) { setSugerencias([]); setMostrarLista(false); return; }
    setSugerencias(ventas.filter(v =>
      v.clienteNombre?.toLowerCase().includes(val.toLowerCase())
    ));
    setMostrarLista(true);
  };

  const seleccionarVenta = (v) => {
    setBusqueda(v.clienteNombre);
    setVentaSel(v);
    setSugerencias([]);
    setMostrarLista(false);
    setCuotaSel(null);
    setMontoIngresado('');
  };

  const seleccionarCuota = (c) => {
    if (!c.seleccionable || c.bloqueada) return;
    setCuotaSel(c);
    const pendiente = c.esC1
      ? c.pendiente
      : (c.pagado > 0 ? Math.max(0, c.monto - c.pagado) : c.monto);
    setMontoIngresado(String(pendiente > 0 ? parseFloat(pendiente.toFixed(2)) : parseFloat(c.monto.toFixed(2))));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ventaSeleccionada || !cuotaSeleccionada || !montoIngresado) {
      setMensaje({ text: 'Selecciona cliente, cuota y monto', error: true });
      return;
    }
    const monto = parseFloat(Number(montoIngresado).toFixed(2));
    try {
      await addPago({ ventaId: ventaSeleccionada.id, montoPagado: monto, fechaPago, metodoPago });
      await pagarCuota(ventaSeleccionada.id, cuotaSeleccionada.num, monto);
      setMensaje({ text: 'Pago registrado correctamente', error: false });
      setBusqueda(''); setVentaSel(null); setCuotaSel(null);
      setMontoIngresado(''); setMetodoPago('');
      setFechaPago(new Date().toISOString().split('T')[0]);
      loadVentas();
      if (onAdded) onAdded();
      setTimeout(() => setMensaje({ text: '', error: false }), 3000);
    } catch (err) {
      console.error(err);
      setMensaje({ text: 'Error al registrar pago', error: true });
    }
  };

  const cuotas = ventaSeleccionada ? calcularCuotas(ventaSeleccionada) : [];

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-xl shadow-md p-6 space-y-5">
      <h2 className="text-xl font-semibold text-gray-700">Registrar Pago</h2>

      {/* Buscar cliente */}
      <div className="flex flex-col relative">
        <label className="text-gray-600 mb-1">Cliente</label>
        <input
          type="text"
          value={busqueda}
          onChange={handleBusqueda}
          onFocus={() => busqueda && setMostrarLista(true)}
          onBlur={() => setTimeout(() => setMostrarLista(false), 150)}
          placeholder="Escriba el nombre del cliente..."
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
        />
        {mostrarLista && sugerencias.length > 0 && (
          <ul className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg z-50 max-h-52 overflow-auto mt-1">
            {sugerencias.map(v => (
              <li key={v.id} onMouseDown={() => seleccionarVenta(v)}
                className="px-4 py-2.5 hover:bg-sky-50 cursor-pointer border-b last:border-0">
                <p className="font-medium text-gray-700 text-sm">{v.clienteNombre}</p>
                <p className="text-xs text-gray-400">
                  Venta: {formatFecha(v.fechaCompra)} · Total: {fmt(v.montoTotal)}
                </p>
              </li>
            ))}
          </ul>
        )}
        {mostrarLista && sugerencias.length === 0 && busqueda && (
          <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg z-50 px-4 py-3 mt-1 text-sm text-gray-400">
            No se encontraron clientes
          </div>
        )}
      </div>

      {/* Info venta */}
      {ventaSeleccionada && (
        <div className="bg-sky-50 border border-sky-100 rounded-lg px-4 py-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Fecha de venta</span>
            <span className="font-medium">{formatFecha(ventaSeleccionada.fechaCompra)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Monto total</span>
            <span className="font-medium">{fmt(ventaSeleccionada.montoTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Cuota base</span>
            <span className="font-medium">{fmt(Number(ventaSeleccionada.montoTotal) / 4)}</span>
          </div>
        </div>
      )}

      {/* Cuotas */}
      {ventaSeleccionada && (
        <div className="flex flex-col gap-2">
          <label className="text-gray-600">Cuotas</label>
          {cuotas.map(c => {
            const pagadaCompleta = c.pagado >= c.monto;
            const esParcial      = c.pagado > 0 && c.pagado < c.monto;
            const pendiente      = Math.max(0, c.monto - c.pagado);

            // Cuota pagada completa — no seleccionable
            if (pagadaCompleta) {
              return (
                <div key={c.num} className="border rounded-lg px-4 py-3 bg-gray-50 opacity-60 cursor-not-allowed">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-400 line-through">
                        {c.label} — Pagada
                      </p>
                      <p className="text-xs text-gray-400">{formatFecha(c.fecha)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400 line-through">{fmt(c.monto)}</p>
                      {c.residuo > 0 && (
                        <p className="text-xs text-green-500">+{fmt(c.residuo)} a cuota siguiente</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // Cuota bloqueada — cuota 2+ cuando cuota 1 no está completa
            if (c.bloqueada) {
              return (
                <div key={c.num} className="border rounded-lg px-4 py-3 bg-gray-50 opacity-50 cursor-not-allowed">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-400">{c.label}</p>
                      <p className="text-xs text-gray-400">Disponible al completar Cuota 1</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-400">{fmt(c.monto)}</p>
                  </div>
                </div>
              );
            }

            // Cuota pendiente o parcial — seleccionable
            return (
              <div key={c.num}
                onClick={() => seleccionarCuota(c)}
                className={`border rounded-lg px-4 py-3 cursor-pointer transition ${
                  cuotaSeleccionada?.num === c.num
                    ? 'border-sky-400 bg-sky-50'
                    : 'hover:border-sky-300 hover:bg-gray-50'
                }`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {c.label}
                      {c.esC1 && c.pagado > 0 && (
                        <span className="ml-2 text-xs text-amber-500 font-normal">
                          (anticipo aplicado, falta {fmt(pendiente)})
                        </span>
                      )}
                      {!c.esC1 && esParcial && (
                        <span className="ml-2 text-xs text-amber-500 font-normal">— Pago parcial</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">Fecha límite: {formatFecha(c.fecha)}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-700">{fmt(c.monto)}</p>
                </div>

                {/* Desglose adeudo/excedente */}
                {(c.adeudoAnterior > 0 || c.excedente > 0) && (
                  <div className="mt-1.5 pt-1.5 border-t flex flex-col gap-0.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Cuota base</span>
                      <span className="text-gray-600">{fmt(c.base)}</span>
                    </div>
                    {c.adeudoAnterior > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-red-400">+ Adeudo anterior</span>
                        <span className="text-red-500 font-medium">{fmt(c.adeudoAnterior)}</span>
                      </div>
                    )}
                    {c.excedente > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-green-500">− Excedente anterior</span>
                        <span className="text-green-600 font-medium">{fmt(c.excedente)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Barra de progreso si hay algo pagado */}
                {c.pagado > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                      <div className="bg-sky-400 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, (c.pagado / c.monto) * 100).toFixed(0)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Pagado: {fmt(c.pagado)}</span>
                      <span className="text-red-500">Faltante: {fmt(pendiente)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Monto */}
      {cuotaSeleccionada && (
        <>
          <div className="flex flex-col">
            <label className="text-gray-600 mb-1">Monto a pagar</label>
            <input
              type="number"
              value={montoIngresado}
              onChange={e => setMontoIngresado(e.target.value)}
              min="0.01"
              step="0.01"
              required
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          {montoIngresado && (
            <div className="border rounded-lg px-4 py-3 bg-green-50 border-green-100 text-sm space-y-1">
              <p className="font-semibold text-gray-700 mb-1">Resumen del pago</p>
              <div className="flex justify-between">
                <span className="text-gray-500">Cuota</span>
                <span className="font-medium">{cuotaSeleccionada.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Monto de la cuota</span>
                <span className="font-medium">{fmt(cuotaSeleccionada.monto)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Monto ingresado</span>
                <span className="font-semibold text-green-700">{fmt(Number(montoIngresado))}</span>
              </div>
              {Number(montoIngresado) < cuotaSeleccionada.monto && (
                <div className="flex justify-between border-t pt-1">
                  <span className="text-red-500">Faltante (se sumará a siguiente cuota)</span>
                  <span className="font-semibold text-red-500">
                    {fmt(cuotaSeleccionada.monto - Number(montoIngresado))}
                  </span>
                </div>
              )}
              {Number(montoIngresado) > cuotaSeleccionada.monto && (
                <div className="flex justify-between border-t pt-1">
                  <span className="text-green-600">Excedente (se restará de siguiente cuota)</span>
                  <span className="font-semibold text-green-600">
                    {fmt(Number(montoIngresado) - cuotaSeleccionada.monto)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t pt-1">
                <span className="text-gray-500">Fecha</span>
                <span className="font-medium">{formatFecha(fechaPago)}</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Fecha y método */}
      <div className="flex flex-col">
        <label className="text-gray-600 mb-1">Fecha de pago</label>
        <input type="date" value={fechaPago} onChange={e => setFechaPago(e.target.value)} required
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400" />
      </div>

      <div className="flex flex-col">
        <label className="text-gray-600 mb-1">Método de pago</label>
        <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)}
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400">
          <option value="">Seleccionar...</option>
          <option value="Efectivo">Efectivo</option>
          <option value="Transferencia">Transferencia</option>
          <option value="Tarjeta">Tarjeta</option>
        </select>
      </div>

      <button type="submit" disabled={!cuotaSeleccionada || !montoIngresado}
        className="w-full bg-sky-500 text-white font-semibold py-2 rounded-lg hover:bg-sky-600 transition disabled:opacity-40">
        Registrar Pago
      </button>

      {mensaje.text && (
        <div className={`px-4 py-2 rounded-lg text-sm ${mensaje.error ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
          {mensaje.text}
        </div>
      )}
    </form>
  );
}