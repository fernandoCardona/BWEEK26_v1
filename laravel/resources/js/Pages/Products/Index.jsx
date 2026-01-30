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
            <div className="pt-32 pb-20 px-6">
                <div className="container mx-auto">
                    <header className="mb-10 text-center" data-aos="fade-down">
                        <span className="text-accent-primary font-bold tracking-widest uppercase text-xs mb-4 block">Official Merchandising</span>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-display">
                            SHOP THE <span className="text-gradient">COLLECTION</span>
                        </h1>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <aside className="lg:col-span-3">
                            <div className="sticky top-28 glass-card !p-6">
                                <div className="text-lg font-black font-display mb-4">Categorías</div>
                                <button
                                    type="button"
                                    className={`text-sm font-bold tracking-wide ${
                                        category === 'all' ? 'text-accent-primary' : 'text-gray-400 hover:text-white'
                                    }`}
                                    onClick={() => setCategory('all')}
                                >
                                    Mostrar todos
                                </button>
                                <div className="mt-4 space-y-2">
                                    {categories.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            className={`block text-left w-full text-sm ${
                                                category === c ? 'font-bold text-white' : 'text-gray-400 hover:text-white'
                                            }`}
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
                                <div className="text-sm text-gray-400">Productos</div>
                                <select
                                    className="rounded-full px-4 py-2 text-sm bg-black/40 border border-white/15 text-gray-200 focus:border-accent-primary/60 focus:ring-accent-primary/30"
                                    value={sort}
                                    onChange={(e) => setSort(e.target.value)}
                                >
                                    <option value="popular">Más populares</option>
                                    <option value="price_asc">Precio: más barato</option>
                                    <option value="price_desc">Precio: más caro</option>
                                    <option value="name_asc">Nombre: A–Z</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {visibleProducts.map((p) => {
                                    const title = p?.name?.es ?? p?.name ?? 'Producto';
                                    const image = p.image_url || p.gallery?.[0]?.url || null;
                                    const isLiked = liked.has(p.id);
                                    return (
                                        <div key={p.id} className="glass-card !p-4 group">
                                            <div className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                                                <Link href={route('products.show', p.id)} className="block">
                                                    <div className="aspect-square">
                                                        {image ? (
                                                            <img src={image} alt={title} className="w-full h-full object-contain" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-700 font-black text-3xl italic">BSW</div>
                                                        )}
                                                    </div>
                                                </Link>
                                                <button
                                                    type="button"
                                                    className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/55 border border-white/10 backdrop-blur flex items-center justify-center icon-btn icon-btn-gradient"
                                                    onClick={() => {
                                                        const next = new Set(liked);
                                                        if (next.has(p.id)) next.delete(p.id);
                                                        else next.add(p.id);
                                                        setLiked(next);
                                                    }}
                                                    aria-label="Favorito"
                                                >
                                                    <FiHeart className={isLiked ? 'text-accent-secondary' : 'text-gray-300'} />
                                                </button>
                                            </div>

                                            <div className="mt-3">
                                                <Link href={route('products.show', p.id)} className="block">
                                                    <div className="text-sm font-black text-white line-clamp-2 group-hover:text-accent-primary transition-colors">
                                                        {title}
                                                    </div>
                                                </Link>
                                                <div className="text-xs text-gray-500">por bearssitges</div>
                                                <div className="mt-1 text-sm font-black text-white">
                                                    {Number(p.price || 0).toFixed(2).replace('.', ',')} €
                                                </div>
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
        </Layout>
    );
}
