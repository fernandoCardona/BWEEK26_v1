import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Link } from '@inertiajs/react';

export default function Warehouse({ products = [] }) {
  return (
    <AdminLayout active="ecommerce" headTitle="Admin • Warehouse">
      <div className="container mx-auto">
        <div className="flex items-start justify-between gap-4 mb-8">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter">Warehouse</h1>
          <Link href={route('admin.ecommerce.index')} className="btn-secondary px-4 py-2 text-sm">Volver</Link>
        </div>
        <div className="glass-card p-6">
          {products.length ? (
            <div className="space-y-6">
              {products.map(p => (
                <div key={p.id}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{p.name?.es ?? p.name?.en ?? 'Producto'}</p>
                      <p className="text-xs text-gray-500">Base stock {p.stock ?? 0}</p>
                    </div>
                    <Link href={route('admin.products.edit', p.id)} className="btn-secondary px-4 py-2 text-sm">Editar</Link>
                  </div>
                  <div className="mt-3 space-y-2">
                    {(p.variants ?? []).length ? p.variants.map(v => (
                      <div key={v.id} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/10">
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">Talla {v.size || '—'} • {v.color || '—'}</p>
                          <p className="text-xs text-gray-500">Stock {v.stock ?? 0} • {v.price}€</p>
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-gray-500">{v.is_active ? 'activo' : 'inactivo'}</span>
                      </div>
                    )) : <p className="text-gray-400">Sin variantes</p>}
                  </div>
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
