// components/VentaForm.js
'use client';
import { useState, useEffect } from 'react';
import { addVenta } from '../services/ventasService';
import { getClientes } from '../services/clientesService';

export default function VentaForm({ onAdded, usuario }) {
  const [clientes, setClientes]         = useState([]);
  const [busqueda, setBusqueda]         = useState('');
  const [sugerencias, setSugerencias]   = useState([]);
  const [mostrarLista, setMostrarLista] = useState(false);
  const [form, setForm] = useState({
    clienteNombre: '',
    clienteId: '',
    responsable: usuario?.nombre || '',
    fechaCompra: '',
    montoTotal: '',
    anticipo: ''  // ← vacío, es opcional
  });
  const [mensaje, setMensaje] = useState('');
  const [error, setError]     = useState(false);

  useEffect(() => { loadClientes(); }, []);

  const loadClientes = async () => {
    const todos = await getClientes();
    setClientes(todos.filter(c => !c.bloqueado));
  };

  const handleBusqueda = (e) => {
    const val = e.target.value;
    setBusqueda(val);
    setForm(prev => ({ ...prev, clienteNombre: val, clienteId: '' }));
    if (val.length < 1) { setSugerencias([]); setMostrarLista(false); return; }
    const filtrados = clientes.filter(c =>
      c.nombre.toLowerCase().includes(val.toLowerCase()) ||
      (c.identificador && c.identificador.toLowerCase().includes(val.toLowerCase()))
    );
    setSugerencias(filtrados);
    setMostrarLista(true);
  };

  const seleccionarCliente = (c) => {
    setBusqueda(c.nombre);
    setForm(prev => ({ ...prev, clienteNombre: c.nombre, clienteId: c.id }));
    setSugerencias([]);
    setMostrarLista(false);
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Preview de cuotas basado en montoTotal y anticipo
  const montoNum   = Number(form.montoTotal) || 0;
  const anticipoNum = Number(form.anticipo) || 0;
  const cuota      = montoNum * 0.25;
  const saldoCuota1 = Math.max(0, cuota - anticipoNum);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.clienteId) {
      setError(true);
      setMensaje('Seleccione un cliente válido de la lista');
      setTimeout(() => setMensaje(''), 3000);
      return;
    }
    try {
      await addVenta(form);
      setForm({
        clienteNombre: '',
        clienteId: '',
        responsable: usuario?.nombre || '',
        fechaCompra: '',
        montoTotal: '',
        anticipo: ''  // ← vacío al resetear
      });
      setBusqueda('');
      setError(false);
      setMensaje('Venta registrada correctamente');
      onAdded();
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      console.error(err);
      setError(true);
      setMensaje('Error al registrar venta');
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-xl shadow-md p-8 space-y-6">
      <h2 className="text-xl font-semibold text-gray-700">Registrar Venta</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Cliente con autocompletado */}
        <div className="flex flex-col relative">
          <label className="text-gray-600 mb-1">Cliente</label>
          <input
            type="text"
            value={busqueda}
            onChange={handleBusqueda}
            onFocus={() => busqueda && setMostrarLista(true)}
            onBlur={() => setTimeout(() => setMostrarLista(false), 150)}
            placeholder="Escriba nombre o identificador..."
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
          {mostrarLista && sugerencias.length > 0 && (
            <ul className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg z-50 max-h-52 overflow-auto mt-1">
              {sugerencias.map(c => (
                <li
                  key={c.id}
                  onMouseDown={() => seleccionarCliente(c)}
                  className="px-4 py-2.5 hover:bg-sky-50 cursor-pointer border-b last:border-0"
                >
                  <p className="font-medium text-gray-700 text-sm">{c.nombre}</p>
                  <p className="text-xs text-gray-400">
                    {c.identificador && <span className="mr-2">ID: {c.identificador}</span>}
                    {c.ciudad && <span>{c.ciudad}</span>}
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

        {/* Responsable — solo lectura */}
        <div className="flex flex-col">
          <label className="text-gray-600 mb-1">Responsable</label>
          <input
            type="text"
            value={form.responsable}
            readOnly
            className="border rounded-lg px-3 py-2 bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>

        {/* Fecha de Venta */}
        <div className="flex flex-col">
          <label className="text-gray-600 mb-1">Fecha de Venta</label>
          <input
            type="date"
            name="fechaCompra"
            value={form.fechaCompra}
            onChange={handleChange}
            required
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>

        {/* Monto Total */}
        <div className="flex flex-col">
          <label className="text-gray-600 mb-1">Monto Total</label>
          <input
            type="number"
            name="montoTotal"
            value={form.montoTotal}
            onChange={handleChange}
            required
            min="0"
            step="0.01" 
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>

        {/* Primer Pago — opcional */}
        <div className="flex flex-col">
          <label className="text-gray-600 mb-1">
            Primer Pago
            <span className="text-xs text-gray-400 ml-1">(opcional)</span>
          </label>
          <input
            type="number"
            name="anticipo"
            value={form.anticipo}
            onChange={handleChange}
            placeholder="$0.00" 
            min="0"
            step="0.01" 
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>

      </div>

      {/* Preview de cuotas — solo si hay monto */}
      {montoNum > 0 && (
        <div className="bg-gray-50 border rounded-lg px-4 py-3 text-sm space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
            Desglose de cuotas
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-gray-600">
            <span>Cuota base (25%)</span>
            <span className="text-right font-medium text-gray-700">
              ${cuota.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>

            {anticipoNum > 0 && (
              <>
                <span>Primer pago</span>
                <span className="text-right font-medium text-green-600">
                  − ${anticipoNum.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
                <span className="font-medium">Saldo cuota 1</span>
                <span className={`text-right font-semibold ${saldoCuota1 === 0 ? 'text-green-600' : 'text-amber-600'}`}>
                  {saldoCuota1 === 0
                    ? '✓ Cubierta'
                    : `$${saldoCuota1.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                  }
                </span>
              </>
            )}

            <span className="pt-1 border-t text-gray-500">Total a pagar</span>
            <span className="pt-1 border-t text-right font-bold text-gray-700">
              ${montoNum.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-sky-500 text-white font-semibold py-2 rounded-lg hover:bg-sky-600 transition"
      >
        Guardar Venta
      </button>

      {mensaje && (
        <div className={`mt-4 px-4 py-2 rounded-lg text-sm ${
          error ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
        }`}>
          {mensaje}
        </div>
      )}
    </form>
  );
}