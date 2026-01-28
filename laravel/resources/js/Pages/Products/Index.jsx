import React from 'react';
import Layout from '@/Layouts/Layout';
import Button from '@/Components/UI/Button';
import { motion } from 'framer-motion';
import { Link, router } from '@inertiajs/react';
import axios from 'axios';

export default function Index({ products }) {
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
                                    {/* Placeholder Image */}
                                    <div className="w-full h-full flex items-center justify-center text-gray-700 font-bold text-4xl italic">
                                        BW26
                                    </div>
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
                </div>
            </div>
        </Layout>
    );
}
