import React from 'react';
import Layout from '@/Layouts/Layout';
import Button from '@/Components/UI/Button';
import { motion } from 'framer-motion';
import { Link, router } from '@inertiajs/react';
import axios from 'axios';
import { FiImage } from 'react-icons/fi';

export default function Index({ products, tickets = [] }) {
    const eventLabel = (ev) => {
        if (!ev) return 'Evento';
        const getName = (n) => (typeof n === 'object' ? (n?.es ?? n?.en) : n);
        if (ev.parent) return `${getName(ev.parent.name) ?? 'Evento'} • ${getName(ev.name) ?? 'Subevento'}`;
        return getName(ev.name) ?? 'Evento';
    };
    return (
        <Layout>
            <div className="pt-32 pb-20 px-6">
                <div className="container mx-auto">
                    <header className="mb-16 text-center" data-aos="fade-down">
                        <span className="text-accent-primary font-bold tracking-widest uppercase text-xs mb-4 block">Official Merchandising</span>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 uppercase">
                            SHOP THE <span className="text-gradient">COLLECTION</span>
                        </h1>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {products.length > 0 ? products.map((product, index) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="glass-card group"
                            >
                                <Link href={route('products.show', product.id)} className="block">
                                <div className="aspect-square bg-white/5 rounded-2xl mb-6 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    {product.image_url || product.gallery?.[0]?.url ? (
                                        <img src={product.image_url || product.gallery?.[0]?.url} alt="Producto" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-700 font-bold text-4xl italic">BW26</div>
                                    )}
                                    <div className="absolute top-4 right-4 bg-accent-primary text-white px-3 py-1 rounded-full text-xs font-bold">
                                        NUEVO
                                    </div>
                                </div>
                                </Link>
                                <h3 className="text-2xl font-bold mb-2 group-hover:text-accent-primary transition-colors">
                                    {product.name.es || product.name}
                                </h3>
                                <p className="text-gray-400 text-sm mb-6 line-clamp-2">
                                    {product.description?.es || 'Sin descripción disponible'}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-black text-white">{product.price}€</span>
                                    <Button
                                      variant="secondary"
                                      className="px-6 py-2 text-sm"
                                      onClick={async () => {
                                        try {
                                          await axios.post(route('cart.items.add'), { kind: 'product', product_id: product.id, quantity: 1 });
                                          router.visit(route('cart.index'), { preserveScroll: true });
                                        } catch (e) {
                                          if (e?.response?.status === 401) {
                                            window.location.href = route('login');
                                            return;
                                          }
                                          alert(e?.response?.data?.message ?? 'No se pudo añadir al carrito');
                                        }
                                      }}
                                    >
                                      Añadir
                                    </Button>
                                </div>
                            </motion.div>
                        )) : (
                            <div className="col-span-full py-20 text-center glass-card">
                                <p className="text-gray-500">No hay productos disponibles en este momento.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-20">
                        <header className="mb-10 text-center">
                            <span className="text-accent-primary font-bold tracking-widest uppercase text-xs mb-4 block">Tickets</span>
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 uppercase">Tickets disponibles</h2>
                        </header>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            {tickets.length ? tickets.map((t, index) => (
                                <motion.div
                                    key={t.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="glass-card group p-6"
                                >
                                    <div className="rounded-2xl overflow-hidden bg-white/5 border border-white/10 mb-5 aspect-[16/9] relative">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                        {t?.event?.image_url ? (
                                            <img src={t.event.image_url} alt="Evento" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                <FiImage size={32} />
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 group-hover:text-accent-primary transition-colors">
                                        {(t.code || 'TICKET').toUpperCase()}
                                    </h3>
                                    <p className="text-gray-400 text-sm mb-6 line-clamp-2">
                                        {eventLabel(t.event)}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl border border-white/10 bg-black/30 overflow-hidden flex items-center justify-center shrink-0">
                                                {t.image_url ? (
                                                    <img src={t.image_url} alt="Ticket" className="w-full h-full object-contain p-1" />
                                                ) : (
                                                    <FiImage size={18} className="text-gray-500" />
                                                )}
                                            </div>
                                            <span className="text-2xl font-black text-white whitespace-nowrap">{t.price}€</span>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            className="px-6 py-2 text-sm"
                                            disabled={(t.stock ?? 0) <= 0}
                                            onClick={async () => {
                                                try {
                                                    await axios.post(route('cart.items.add'), { kind: 'ticket', event_ticket_type_id: t.id, quantity: 1 });
                                                    router.visit(route('cart.index'), { preserveScroll: true });
                                                } catch (e) {
                                                    if (e?.response?.status === 401) {
                                                        window.location.href = route('login');
                                                        return;
                                                    }
                                                    alert(e?.response?.data?.message ?? 'No se pudo añadir el ticket');
                                                }
                                            }}
                                        >
                                            {(t.stock ?? 0) <= 0 ? 'Agotado' : 'Añadir'}
                                        </Button>
                                    </div>
                                    <div className="mt-3 text-xs text-gray-500">stock {t.stock ?? 0}</div>
                                </motion.div>
                            )) : (
                                <div className="col-span-full py-12 text-center glass-card">
                                    <p className="text-gray-500">No hay tickets disponibles en este momento.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
