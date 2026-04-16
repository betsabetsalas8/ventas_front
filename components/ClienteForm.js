// components/ClienteForm.js
'use client';
import { useState } from 'react';
import { addCliente } from '../services/clientesService';

export default function ClienteForm({ onAdded }) {
  const [form, setForm] = useState({
    nombre:        '',
    nombreRecibe:  '',
    celular:       '',
    identificador: '',
    tipoCliente:   '',
    calle:         '',
    numero:        '',
    colonia:       '',
    ciudad:        '',
    estado:        '',
    cp:            '',
    referencias:   ''
  });

  const [mensaje, setMensaje] = useState('');
  const [error, setError]     = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addCliente(form);
      setForm({
        nombre: '', nombreRecibe: '', celular: '', identificador: '',
        tipoCliente: '', calle: '', numero: '', colonia: '',
        ciudad: '', estado: '', cp: '', referencias: ''
      });
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

      {/* Datos personales */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Datos personales
        </p>
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

      {/* Dirección */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Dirección
        </p>
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
              placeholder="Ej: Guanajuato"
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
              placeholder="Ej: Casa azul, junto a la tienda..."
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 transition" />
          </div>

        </div>
      </div>

      <button type="submit"
        className="bg-sky-500 text-white px-6 py-2 rounded-lg hover:bg-sky-600 transition">
        Guardar Cliente
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