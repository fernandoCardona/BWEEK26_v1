import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Link } from '@inertiajs/react';

export default function Index({ tickets = [], products = [] }) {
  return (
    <AdminLayout active="ecommerce" headTitle="Admin • Ecommerce">
      <div className="container mx-auto">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-8">Ecommerce</h1>
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Tickets disponibles</h2>
            <Link href={route('admin.ecommerce.warehouse')} className="btn-secondary px-4 py-2 text-sm">Warehouse</Link>
          </div>
          {tickets.length ? (
            <div className="space-y-3">
              {tickets.map(t => (
                <div key={t.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{(t.code || 'TICKET').toUpperCase()} • {t.event?.name?.es ?? t.event?.name?.en ?? 'Evento'}</p>
                    <p className="text-xs text-gray-500">{t.price}€ • stock {t.stock ?? '-'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500">activo</span>
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
    </AdminLayout>
  );
}
