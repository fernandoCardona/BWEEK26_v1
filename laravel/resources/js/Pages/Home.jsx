import React from 'react';
import Layout from '@/Layouts/Layout';
import Button from '@/Components/UI/Button';
import { motion } from 'framer-motion';

export default function Home() {
    return (
        <Layout>
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Background Shapes with smoother motion */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <motion.div
                        animate={{
                            x: [0, 100, 0],
                            y: [0, -50, 0],
                            scale: [1, 1.1, 1],
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-20 -left-20 w-[800px] h-[800px] bg-accent-primary/10 rounded-full blur-[150px]"
                    />
                    <motion.div
                        animate={{
                            x: [0, -100, 0],
                            y: [0, 50, 0],
                            scale: [1.1, 1, 1.1],
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute -bottom-40 -right-40 w-[900px] h-[900px] bg-accent-tertiary/5 rounded-full blur-[180px]"
                    />
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <span className="inline-block px-6 py-2 rounded-full bg-white/5 border border-white/10 text-accent-primary text-xs font-bold tracking-widest uppercase mb-8">
                                Sitges • 5-14 Septiembre 2026
                            </span>
                            <h1 className="text-7xl md:text-[120px] font-black tracking-tighter mb-8 leading-[0.9] text-white">
                                WE ARE <br />
                                BEARS <span className="text-gradient">WEEK</span>
                            </h1>
                            <p className="max-w-xl mx-auto text-lg md:text-xl text-gray-400 mb-12 font-medium leading-relaxed">
                                El epicentro mundial de la cultura bear.
                                Un viaje de libertad, música y comunidad frente al mar.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                <Button variant="primary" className="w-full sm:w-auto">
                                    Conseguir Tickets
                                </Button>
                                <Button variant="secondary" className="w-full sm:w-auto">
                                    Explorar Galería
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Vertical Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-4"
                >
                    <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold">Scroll</span>
                    <div className="w-px h-12 bg-gradient-to-b from-accent-primary to-transparent" />
                </motion.div>
            </section>

            {/* Bento Grid - Events Preview */}
            <section className="py-32 px-6">
                <div className="container mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                        <div>
                            <span className="text-accent-primary font-bold tracking-widest uppercase text-xs mb-4 block">Eventos Destacados</span>
                            <h2 className="text-5xl md:text-7xl font-black tracking-tighter">EL PROGRAMA</h2>
                        </div>
                        <Button variant="ghost">Ver calendario completo →</Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 min-h-[800px]">
                        {/* Big Card */}
                        <div className="md:col-span-2 md:row-span-2 glass-card group overflow-hidden relative" data-aos="fade-up">
                            <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <span className="text-sm font-bold text-accent-primary mb-2 block">MAIN EVENT</span>
                                    <h3 className="text-4xl font-bold mb-4">Playa Bear Opening</h3>
                                </div>
                                <p className="text-gray-400 max-w-sm">
                                    La inauguración oficial en el chiringuito de la costa. Música, sol y miles de osos.
                                </p>
                            </div>
                        </div>

                        {/* Smaller Cards */}
                        <div className="glass-card md:col-span-1 group" data-aos="fade-up" data-aos-delay="100">
                            <h4 className="text-xl font-bold mb-2">Pool Party</h4>
                            <p className="text-sm text-gray-500">Hotel Terraza</p>
                        </div>

                        <div className="glass-card md:col-span-1 border-accent-secondary/20 group" data-aos="fade-up" data-aos-delay="200">
                            <h4 className="text-xl font-bold mb-2 text-accent-secondary">VIP Gala</h4>
                            <p className="text-sm text-gray-500">Casino Prado</p>
                        </div>

                        <div className="glass-card md:col-span-2 group flex items-center justify-between" data-aos="fade-up" data-aos-delay="300">
                            <div>
                                <h4 className="text-2xl font-bold mb-1">Pop-up Shop</h4>
                                <p className="text-sm text-gray-500">Exclusive Merchandising</p>
                            </div>
                            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                                →
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
}
