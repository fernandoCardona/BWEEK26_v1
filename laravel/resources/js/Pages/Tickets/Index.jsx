import React from 'react';
import Layout from '@/Layouts/Layout';
import Button from '@/Components/UI/Button';
import { motion } from 'framer-motion';
import { Link } from '@inertiajs/react';
import { formatDMY } from '@/utils/date';

export default function Index({ events }) {
    return (
        <Layout>
            <div className="pt-32 pb-20 px-6">
                <div className="container mx-auto">
                    <header className="mb-16" data-aos="fade-right">
                        <span className="text-accent-secondary font-bold tracking-widest uppercase text-xs mb-4 block">Bears Week Sitges 2026</span>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase">
                            RESERVA TU <br />
                            <span className="text-gradient">EXPERIENCIA</span>
                        </h1>
                    </header>

                    <div className="space-y-6">
                        {events.length > 0 ? events.map((event, index) => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="glass-card hover:bg-white/10 transition-all flex flex-col md:flex-row items-center gap-8 p-6 md:p-10"
                            >
                                <div className="w-full md:w-44 text-center md:border-r border-white/10 pr-0 md:pr-8">
                                    <span className="text-accent-primary text-xl md:text-2xl font-black block leading-none">
                                        {formatDMY(event.start_at) || '--'}
                                    </span>
                                    <span className="text-gray-500 text-xs uppercase font-bold tracking-widest block mt-2">
                                        {formatDMY(event.end_at) ? `hasta ${formatDMY(event.end_at)}` : ''}
                                    </span>
                                </div>
                                <div className="flex-grow text-center md:text-left">
                                    <h3 className="text-3xl font-bold mb-2 uppercase tracking-tight">{event.name}</h3>
                                    <p className="text-gray-400 text-sm">{event.description}</p>
                                    <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        <span className="flex items-center">
                                            <span className="w-1.5 h-1.5 rounded-full bg-accent-secondary mr-2" /> {event.address || 'Sitges'}
                                        </span>
                                        {event.start_at && event.end_at && (
                                            <span className="flex items-center">
                                                <span className="w-1.5 h-1.5 rounded-full bg-accent-tertiary mr-2" />{' '}
                                                {formatDMY(event.start_at)} – {formatDMY(event.end_at)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-2">
                                    <Link href={`/events/${event.id}`} className="w-full md:w-auto">
                                        <Button variant="primary" className="w-full md:w-auto">
                                            Ver evento
                                        </Button>
                                    </Link>
                                </div>
                            </motion.div>
                        )) : (
                            <div className="py-20 text-center glass-card">
                                <p className="text-gray-500">Estamos preparando el calendario. Vuelve pronto.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
