import React, { useMemo, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import axios from 'axios';

export default function Index({ tickets = [], products = [], categories = [] }) {
  const [ticketEdits, setTicketEdits] = useState(() =>
    Object.fromEntries(
      tickets.map((t) => [
        t.id,
        {
          price: t.price,
          stock: t.stock ?? 0,
          is_active: !!t.is_active,
        },
      ]),
    ),
  );

  const saveTicket = async (ticketId) => {
    const payload = ticketEdits[ticketId];
    await axios.patch(route('admin.ecommerce.tickets.update', ticketId), {
      price: Number(payload.price || 0),
      stock: Number(payload.stock || 0),
      is_active: !!payload.is_active,
    });
  };

  const [catsOpen, setCatsOpen] = useState(false);
  const [cats, setCats] = useState(categories ?? []);
  const [newCat, setNewCat] = useState('');

  const createCategory = async () => {
    const name = String(newCat || '').trim();
    if (!name) return;
    const res = await axios.post(route('admin.product-categories.store'), { name });
    setCats((prev) => [...prev, res.data]);
    setNewCat('');
  };

  const saveCategory = async (c) => {
    await axios.patch(route('admin.product-categories.update', c.id), { name: c.name, is_active: !!c.is_active });
  };

  const deleteCategory = async (categoryId) => {
    await axios.delete(route('admin.product-categories.destroy', categoryId));
    setCats((prev) => prev.filter((x) => x.id !== categoryId));
  };

  const eventLabel = (ev) => {
    if (!ev) return 'Evento';
    const getName = (n) => (typeof n === 'object' ? (n?.es ?? n?.en) : n);
    if (ev.parent) return `${getName(ev.parent.name) ?? 'Evento'} • ${getName(ev.name) ?? 'Subevento'}`;
    return getName(ev.name) ?? 'Evento';
  };

  return (
    <AdminLayout active="ecommerce" headTitle="Admin • Ecommerce">
      <div className="container mx-auto">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-8">Ecommerce</h1>
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Tickets disponibles</h2>
            <div className="flex items-center gap-3">
              <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={() => setCatsOpen(true)}>
                Categorías
              </button>
              <Link href={route('admin.products.index')} className="btn-secondary px-4 py-2 text-sm">Productos</Link>
              <Link href={route('admin.ecommerce.warehouse')} className="btn-secondary px-4 py-2 text-sm">Warehouse</Link>
            </div>
          </div>
          {tickets.length ? (
            <div className="space-y-3">
              {tickets.map(t => (
                <div key={t.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{(t.code || 'TICKET').toUpperCase()} • {eventLabel(t.event)}</p>
                    <p className="text-xs text-gray-500">stock {t.stock ?? '-'}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      className="w-24 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
                      value={ticketEdits[t.id]?.price ?? ''}
                      onChange={(e) => setTicketEdits((prev) => ({ ...prev, [t.id]: { ...(prev[t.id] ?? {}), price: e.target.value } }))}
                    />
                    <input
                      className="w-20 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
                      value={ticketEdits[t.id]?.stock ?? 0}
                      onChange={(e) => setTicketEdits((prev) => ({ ...prev, [t.id]: { ...(prev[t.id] ?? {}), stock: e.target.value } }))}
                    />
                    <label className="inline-flex items-center gap-2 text-xs text-gray-300 select-none">
                      <input
                        type="checkbox"
                        checked={!!ticketEdits[t.id]?.is_active}
                        onChange={(e) => setTicketEdits((prev) => ({ ...prev, [t.id]: { ...(prev[t.id] ?? {}), is_active: e.target.checked } }))}
                      />
                      Activo
                    </label>
                    <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={() => saveTicket(t.id)}>
                      Guardar
                    </button>
                    <Link
                      href={route('admin.events.edit', t.event?.parent_event_id ?? t.event?.id)}
                      className="btn-secondary px-4 py-2 text-sm"
                    >
                      Editar evento
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No hay tickets activos.</p>
          )}

          <h2 className="text-xl font-bold mt-8">Productos</h2>
          {products.length ? (
            <div className="space-y-3">
              {products.map(p => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{p.name?.es ?? p.name?.en ?? 'Producto'}</p>
                    <p className="text-xs text-gray-500">{p.price}€ • variantes {p.variants_count}</p>
                  </div>
                  <Link href={route('admin.products.edit', p.id)} className="btn-secondary px-4 py-2 text-sm">Editar</Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No hay productos todavía.</p>
          )}
        </div>
      </div>

      {catsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/70" onClick={() => setCatsOpen(false)} />
          <div className="relative w-full max-w-3xl glass-card p-6 border border-white/10">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Categorías</h3>
                <p className="text-sm text-gray-400">Crea y gestiona categorías asignables a productos.</p>
              </div>
              <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={() => setCatsOpen(false)}>
                Cerrar
              </button>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <input
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="Nombre de categoría (ej. t-shirt)"
              />
              <button type="button" className="btn-primary px-6 py-3 text-sm" onClick={createCategory}>
                Crear
              </button>
            </div>

            <div className="space-y-3">
              {cats.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl border border-white/10 bg-white/5">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <div className="md:col-span-6">
                      <input
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3"
                        value={c.name ?? ''}
                        onChange={(e) => setCats((prev) => prev.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x)))}
                      />
                      <div className="text-xs text-gray-500 mt-2">slug: {c.slug}</div>
                    </div>
                    <div className="md:col-span-3">
                      <label className="inline-flex items-center gap-2 text-sm text-gray-300 select-none">
                        <input
                          type="checkbox"
                          checked={!!c.is_active}
                          onChange={(e) => setCats((prev) => prev.map((x) => (x.id === c.id ? { ...x, is_active: e.target.checked } : x)))}
                        />
                        Activa
                      </label>
                    </div>
                    <div className="md:col-span-3 flex items-center justify-end gap-3">
                      <button type="button" className="btn-secondary px-5 py-3 text-sm" onClick={() => saveCategory(c)}>
                        Guardar
                      </button>
                      <button type="button" className="btn-secondary px-5 py-3 text-sm" onClick={() => deleteCategory(c.id)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!cats.length && <div className="text-gray-400">No hay categorías todavía.</div>}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
