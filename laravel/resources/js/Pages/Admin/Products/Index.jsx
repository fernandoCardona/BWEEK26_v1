import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Link } from '@inertiajs/react';

export default function Index({ products, can }) {
    return (
        <AdminLayout active="ecommerce" headTitle="Admin • Products">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-3xl font-black tracking-tight">Productos</h2>
                        {can?.create && (
                            <Link href={route('admin.products.create')} className="btn-primary py-3 px-6 text-sm">
                                Crear producto
                            </Link>
                        )}
                    </div>

                    <div className="glass-card p-6">
                        {products?.length ? (
                            <div className="space-y-3">
                                {products.map((p) => (
                                    <Link
                                        key={p.id}
                                        href={route('admin.products.edit', p.id)}
                                        className="block p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0 flex items-start gap-4">
                                                <div className="w-14 h-14 rounded-2xl border border-white/10 bg-white/5 overflow-hidden flex items-center justify-center shrink-0">
                                                    {p.image_url ? (
                                                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs text-gray-500">Sin</span>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-lg truncate">{p.name}</p>
                                                    <p className="text-sm text-gray-400 truncate">
                                                        {p.category ? p.category : 'Sin categoría'} • stock {p.stock}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-lg font-black">{p.price}€</p>
                                                <p className="text-[10px] uppercase tracking-widest text-gray-500">{p.is_active ? 'activo' : 'inactivo'}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400">No hay productos todavía.</p>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

