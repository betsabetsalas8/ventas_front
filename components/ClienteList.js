// components/ClienteList.js
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

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

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
          <input
            type="text"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
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
              placeholder="Ej: Guanajuato"
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
              placeholder="Ej: Casa azul, junto a la tienda..."
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={guardando}
            className="flex-1 bg-sky-500 text-white rounded-lg py-2 text-sm font-semibold hover:bg-sky-600 transition disabled:opacity-40">
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default function ClienteList({ reload, esSuperusuario }) {
  const [clientes, setClientes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [clienteEditar, setClienteEditar] = useState(null);
  const [resumenMap, setResumenMap] = useState({}); // clienteId → { adeudo, saldoFavor }

  useEffect(() => { load(); }, [reload]);

  const load = async () => {
    const [data, ventas] = await Promise.all([getClientes(), getVentas()]);
    const arr = Array.isArray(data) ? data : [];
    setClientes(arr);
    setFiltered(arr);

    // Calcular adeudo por cliente
    const adeudoMap = {};
    ventas.forEach(v => {
      const id = v.clienteId;
      const pagado = Number(v.totalPagado ?? v.anticipo ?? 0);
      const adeudo = Math.max(0, Number(v.montoTotal) - pagado);
      if (!adeudoMap[id]) adeudoMap[id] = 0;
      adeudoMap[id] += adeudo;
    });

    // Traer saldos a favor de todos los clientes con adeudo o compras
    const clienteIds = [...new Set(ventas.map(v => v.clienteId))];
    const saldos = await Promise.all(
      clienteIds.map(id => getSaldoAFavor(id).then(r => ({ id, saldo: r.saldo })))
    );
    const saldoMap = {};
    saldos.forEach(({ id, saldo }) => { saldoMap[id] = saldo; });

    const resumen = {};
    clienteIds.forEach(id => {
      resumen[id] = {
        adeudo: adeudoMap[id] ?? 0,
        saldoFavor: saldoMap[id] ?? 0,
      };
    });
    setResumenMap(resumen);
  };

  useEffect(() => {
    const lower = search.toLowerCase();
    setFiltered(
      clientes.filter(c =>
        Object.values(c).some(val =>
          String(val).toLowerCase().includes(lower)
        )
      )
    );
  }, [search, clientes]);

  const handleBloquear = async (cliente) => {
    await updateCliente(cliente.id, { bloqueado: !cliente.bloqueado });
    load();
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    try {
      await deleteCliente(id);
      load();
    } catch (error) {
      if (error.response?.status === 409) {
        alert('No se puede eliminar: este cliente tiene ventas registradas.');
      } else {
        alert('Error al eliminar el cliente.');
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">

      {clienteEditar && (
        <ModalEditar
          cliente={clienteEditar}
          onClose={() => setClienteEditar(null)}
          onSaved={load}
        />
      )}

      <input
        type="text"
        placeholder="Buscar cliente..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
      />

      {filtered.length > 0 ? (
        <div className="overflow-auto border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-sky-100 text-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Teléfono</th>
                <th className="px-4 py-3 text-left">Identificador</th>
                <th className="px-4 py-3 text-left">Saldo</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const resumen = resumenMap[c.id] ?? { adeudo: 0, saldoFavor: 0 };
                const tieneDeuda = resumen.adeudo > 0;
                const tieneSaldo = resumen.saldoFavor > 0;

                return (
                  <tr key={c.id} className={`border-t transition ${c.bloqueado ? 'bg-gray-100 text-gray-400' : 'hover:bg-gray-50 text-gray-700'
                    }`}>
                    <td className="px-4 py-3 font-medium">
                      {c.nombre}
                      {c.bloqueado && (
                        <span className="ml-2 text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                          Bloqueado
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.bloqueado
                          ? 'bg-gray-200 text-gray-400'
                          : TIPO_BADGE[c.tipoCliente] ?? 'bg-gray-100 text-gray-500'
                        }`}>
                        {c.tipoCliente ?? '—'}
                      </span>
                    </td>

                    <td className="px-4 py-3">{c.celular ?? '—'}</td>
                    <td className="px-4 py-3">{c.identificador ?? '—'}</td>

                    {/* Columna saldo */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        {tieneDeuda && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full w-fit">
                            Debe {fmt(resumen.adeudo)}
                          </span>
                        )}
                        {tieneSaldo && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full w-fit">
                            A favor {fmt(resumen.saldoFavor)}
                          </span>
                        )}
                        {!tieneDeuda && !tieneSaldo && (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => setClienteEditar(c)}
                          className="text-xs px-3 py-1 rounded-lg border border-sky-300 text-sky-600 hover:bg-sky-50 transition">
                          Editar
                        </button>
                          <button onClick={() => handleBloquear(c)}
                            className={`text-xs px-3 py-1 rounded-lg border transition ${c.bloqueado
                                ? 'border-green-400 text-green-600 hover:bg-green-50'
                                : 'border-yellow-400 text-yellow-600 hover:bg-yellow-50'
                              }`}>
                            {c.bloqueado ? 'Desbloquear' : 'Bloquear'}
                          </button>
                        <button onClick={() => handleEliminar(c.id)}
                            className="text-xs px-3 py-1 rounded-lg border border-red-300 text-red-500 hover:bg-red-50 transition">
                            Eliminar
                          </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center text-gray-500 p-6">
          No se encontraron clientes
        </div>
      )}

    </div>
  );
}