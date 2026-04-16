// components/ExportarExcel.js
'use client';
import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { getVentas } from '../services/ventasService';
import { getEnvios } from '../services/enviosService';

const formatFecha = (fecha) => {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  const a = new Date(d1).toLocaleDateString('en-CA');
  const b = new Date(d2 + 'T12:00:00').toLocaleDateString('en-CA');
  return a === b;
};

const sumarDias = (fecha, dias) => {
  const d = new Date(fecha);
  d.setDate(d.getDate() + dias);
  return d;
};

const calcularCuotas = (v) => {
  const total = Number(v.montoTotal);
  const base  = total / 4;
  const ant   = Number(v.anticipo || 0);
  const fecha = new Date(v.fechaCompra);

  const pagadoC1Extra = v.cuotasPagadas?.find(p => p.num === 1)?.montoPagado ?? 0;
  const pagadoC1Total = ant + pagadoC1Extra;
  const r1            = pagadoC1Total - base;

  const mC2 = base - Math.max(0, r1);
  const pC2 = v.cuotasPagadas?.find(p => p.num === 2)?.montoPagado ?? 0;
  const r2  = pC2 - mC2;

  const mC3 = base - Math.max(0, r2);
  const pC3 = v.cuotasPagadas?.find(p => p.num === 3)?.montoPagado ?? 0;
  const r3  = pC3 > 0 ? pC3 - mC3 : 0;

  const mC4 = base - Math.max(0, r3);
  const pC4 = v.cuotasPagadas?.find(p => p.num === 4)?.montoPagado ?? 0;

  return [
    { num: 1, label: 'Cuota 1', fecha,                       monto: base, pagado: pagadoC1Total },
    { num: 2, label: 'Cuota 2', fecha: sumarDias(fecha, 15), monto: mC2,  pagado: pC2 },
    { num: 3, label: 'Cuota 3', fecha: sumarDias(fecha, 30), monto: mC3,  pagado: pC3 },
    { num: 4, label: 'Cuota 4', fecha: sumarDias(fecha, 45), monto: mC4,  pagado: pC4 },
  ];
};

export default function ExportarExcel() {
  const [ventas, setVentas]           = useState([]);
  const [envios, setEnvios]           = useState([]);
  const [tipoReporte, setTipoReporte] = useState('pagos_pendientes');
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    const cargar = async () => {
      const [v, e] = await Promise.all([getVentas(), getEnvios()]);
      setVentas(Array.isArray(v) ? v : []);
      setEnvios(Array.isArray(e) ? e : []);
    };
    cargar();
  }, []);

  const exportarPagosPendientes = () => {
    const filas = [];

    ventas.forEach(v => {
      const cuotas      = calcularCuotas(v);
      const totalPagado = cuotas.reduce((s, c) => s + Number(c.pagado || 0), 0);
      const totalMonto  = Number(v.montoTotal);
      const pendiente   = Math.max(0, totalMonto - totalPagado);

      if (pendiente <= 0) return;
      if (fechaFiltro && !isSameDay(v.fechaCompra, fechaFiltro)) return;

      filas.push({
        'Nombre Cliente':  v.clienteNombre ?? '—',
        'Tipo Cliente':    v.tipoCliente   ?? '—',
        'Celular':         v.celular        ?? '—',
        'Identificador':   v.identificador  ?? '—',
        'Fecha de Venta':  formatFecha(v.fechaCompra),
        'Monto de Venta':  totalMonto.toFixed(2),
        'Total Pagado':    totalPagado.toFixed(2),
        'Total Pendiente': pendiente.toFixed(2),
      });
    });

    return filas;
  };

  const exportarEnviosPorFecha = () => {
  // Filtrar por fecha si aplica
  const filtrados = envios.filter(e => {
    if (!fechaFiltro) return true;
    return isSameDay(e.fechaEnvio, fechaFiltro);
  });

  // Agrupar por guía
  const grupos = filtrados.reduce((acc, e) => {
    const guia = e.guiaEnvio || 'Sin guía';
    if (!acc[guia]) {
      acc[guia] = {
        guia,
        fechaEnvio: e.fechaEnvio,
        costoEnvio: Number(e.costoEnvio || 0),
        ventas: []
      };
    }
    acc[guia].ventas.push(e);
    return acc;
  }, {});

  // Generar filas — una por venta dentro de cada guía
  const filas = [];
  Object.values(grupos).forEach(g => {
    g.ventas.forEach((e, i) => {
      const venta = ventas.find(v => v.id === e.ventaId);
      filas.push({
        'Número de Guía':  i === 0 ? g.guia : '',           // solo en la primera fila
        'Costo de Envío':  i === 0 ? g.costoEnvio.toFixed(2) : '', // solo en la primera fila
        'Fecha de Envío':  i === 0 ? formatFecha(g.fechaEnvio) : '',
        'Cliente':         e.clienteNombre ?? '—',
        'Fecha de Venta':  formatFecha(venta?.fechaCompra),
        'Monto de Venta':  Number(venta?.montoTotal || 0).toFixed(2),
      });
    });

    // Fila de total por guía
    const totalVentas = g.ventas.reduce((s, e) => {
      const venta = ventas.find(v => v.id === e.ventaId);
      return s + Number(venta?.montoTotal || 0);
    }, 0);

    filas.push({
      'Número de Guía':  '',
      'Costo de Envío':  '',
      'Fecha de Envío':  '',
      'Cliente':         `TOTAL (${g.ventas.length} ventas)`,
      'Fecha de Venta':  '',
      'Monto de Venta':  totalVentas.toFixed(2),
    });

    // Fila vacía separadora entre guías
    filas.push({
      'Número de Guía': '', 'Costo de Envío': '',
      'Fecha de Envío': '', 'Cliente': '',
      'Fecha de Venta': '', 'Monto de Venta': ''
    });
  });

  return filas;
};

  const handleExportar = () => {
    setLoading(true);
    try {
      const filas = tipoReporte === 'pagos_pendientes'
        ? exportarPagosPendientes()
        : exportarEnviosPorFecha();

      if (filas.length === 0) {
        alert('No hay datos para exportar con los filtros seleccionados');
        setLoading(false);
        return;
      }

      const wb   = XLSX.utils.book_new();
      const ws   = XLSX.utils.json_to_sheet(filas);

      const cols = Object.keys(filas[0]).map(key => ({
        wch: Math.max(key.length, ...filas.map(f => String(f[key] ?? '').length)) + 2
      }));
      ws['!cols'] = cols;

      const nombre = tipoReporte === 'pagos_pendientes' ? 'Pagos Pendientes' : 'Envíos';
      XLSX.utils.book_append_sheet(wb, ws, nombre);

      const fecha = new Date().toLocaleDateString('en-CA');
      XLSX.writeFile(wb, `${nombre}_${fecha}.xlsx`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border rounded-xl shadow-sm p-6 space-y-5">
      <h2 className="text-xl font-semibold text-gray-700">Exportar a Excel</h2>

      {/* Tipo de reporte */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-600">Tipo de reporte</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            onClick={() => setTipoReporte('pagos_pendientes')}
            className={`border rounded-lg px-4 py-3 cursor-pointer transition ${
              tipoReporte === 'pagos_pendientes'
                ? 'border-sky-400 bg-sky-50'
                : 'hover:border-sky-300 hover:bg-gray-50'
            }`}
          >
            <p className="text-sm font-medium text-gray-700">Pagos pendientes</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Clientes con saldo pendiente — nombre, tipo, celular, identificador, montos
            </p>
          </div>
          <div
            onClick={() => setTipoReporte('envios')}
            className={`border rounded-lg px-4 py-3 cursor-pointer transition ${
              tipoReporte === 'envios'
                ? 'border-sky-400 bg-sky-50'
                : 'hover:border-sky-300 hover:bg-gray-50'
            }`}
          >
            <p className="text-sm font-medium text-gray-700">Envíos por fecha</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Todos los envíos — cliente, fecha, costo, guía
            </p>
          </div>
        </div>
      </div>

      {/* Filtro fecha */}
      <div className="flex flex-col">
        <label className="text-sm text-gray-600 mb-1">
          {tipoReporte === 'pagos_pendientes'
            ? 'Filtrar por fecha de venta (opcional)'
            : 'Filtrar por fecha de envío (opcional)'}
        </label>
        <input
          type="date"
          value={fechaFiltro}
          onChange={e => setFechaFiltro(e.target.value)}
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 max-w-xs"
        />
        {fechaFiltro && (
          <button
            onClick={() => setFechaFiltro('')}
            className="text-xs text-sky-500 hover:underline mt-1 self-start"
          >
            Quitar filtro
          </button>
        )}
      </div>

      {/* Previsualización */}
      <div className="bg-gray-50 border rounded-lg px-4 py-3 text-sm text-gray-600">
        {tipoReporte === 'pagos_pendientes' ? (
          <span>
            {exportarPagosPendientes().length} clientes con pagos pendientes
            {fechaFiltro ? ` con venta del ${formatFecha(fechaFiltro + 'T12:00:00')}` : ' en total'}
          </span>
        ) : (
          <span>
            {exportarEnviosPorFecha().length} envíos
            {fechaFiltro ? ` del ${formatFecha(fechaFiltro + 'T12:00:00')}` : ' en total'}
          </span>
        )}
      </div>

      <button
        onClick={handleExportar}
        disabled={loading}
        className="w-full bg-green-500 text-white font-semibold py-2 rounded-lg hover:bg-green-600 transition disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {loading ? 'Generando...' : '⬇ Descargar Excel'}
      </button>
    </div>
  );
}