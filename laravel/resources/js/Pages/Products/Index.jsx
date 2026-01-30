import React, { useMemo, useState } from 'react';
import Layout from '@/Layouts/Layout';
import { Link } from '@inertiajs/react';
import { FiHeart } from 'react-icons/fi';

export default function Index({ products, tickets = [] }) {
    const [category, setCategory] = useState('all');
    const [sort, setSort] = useState('popular');
    const [liked, setLiked] = useState(() => new Set());

    const categories = useMemo(() => {
        const set = new Set();
        for (const p of products ?? []) {
            const c = String(p?.category ?? '').trim();
            if (c) set.add(c);
        }
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [products]);

    const visibleProducts = useMemo(() => {
        let list = (products ?? []).slice();
        if (category !== 'all') {
            list = list.filter((p) => String(p?.category ?? '').trim() === category);
        }
        if (sort === 'price_asc') list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
        if (sort === 'price_desc') list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
        if (sort === 'name_asc') list.sort((a, b) => String(a?.name?.es ?? a?.name ?? '').localeCompare(String(b?.name?.es ?? b?.name ?? '')));
        return list;
    }, [products, category, sort]);

    return (
        <Layout>
            <div className="pt-28 pb-16">
                <div className="bg-white text-gray-900">
                    <div className="container mx-auto px-6 py-10">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <aside className="lg:col-span-3">
                                <div className="sticky top-24">
                                    <div className="text-xl font-bold mb-4">Categorías</div>
                                    <button type="button" className="text-sm text-red-500 hover:underline mb-4" onClick={() => setCategory('all')}>
                                        Mostrar todos
                                    </button>
                                    <div className="space-y-2">
                                        {categories.map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                className={`block text-left w-full text-sm ${category === c ? 'font-bold text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                                                onClick={() => setCategory(c)}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </aside>

                            <main className="lg:col-span-9">
                                <div className="flex items-center justify-between gap-4 mb-6">
                                    <div className="text-sm text-gray-500">Productos</div>
                                    <div className="flex items-center gap-3">
                                        <select
                                            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                                            value={sort}
                                            onChange={(e) => setSort(e.target.value)}
                                        >
                                            <option value="popular">Más populares</option>
                                            <option value="price_asc">Precio: más barato</option>
                                            <option value="price_desc">Precio: más caro</option>
                                            <option value="name_asc">Nombre: A–Z</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {visibleProducts.map((p) => {
                                        const title = p?.name?.es ?? p?.name ?? 'Producto';
                                        const image = p.image_url || p.gallery?.[0]?.url || null;
                                        const isLiked = liked.has(p.id);
                                        return (
                                            <div key={p.id} className="bg-white">
                                                <div className="relative border border-gray-200 rounded-md overflow-hidden bg-gray-50">
                                                    <Link href={route('products.show', p.id)} className="block">
                                                        <div className="aspect-square">
                                                            {image ? (
                                                                <img src={image} alt={title} className="w-full h-full object-contain" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-300 font-black text-3xl">BSW</div>
                                                            )}
                                                        </div>
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center"
                                                        onClick={() => {
                                                            const next = new Set(liked);
                                                            if (next.has(p.id)) next.delete(p.id);
                                                            else next.add(p.id);
                                                            setLiked(next);
                                                        }}
                                                        aria-label="Favorito"
                                                    >
                                                        <FiHeart className={isLiked ? 'text-red-500' : 'text-gray-600'} />
                                                    </button>
                                                </div>
                                                <div className="mt-2">
                                                    <Link href={route('products.show', p.id)} className="block">
                                                        <div className="text-sm font-semibold text-gray-900 line-clamp-2">{title}</div>
                                                    </Link>
                                                    <div className="text-xs text-gray-500">por bearssitges</div>
                                                    <div className="mt-1 text-sm font-bold">{Number(p.price || 0).toFixed(2).replace('.', ',')} €</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {!visibleProducts.length ? <div className="mt-10 text-sm text-gray-500">No hay productos disponibles.</div> : null}
                            </main>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
