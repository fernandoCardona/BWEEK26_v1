import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function Navigation() {
    const { url, props } = usePage();
    const [scrolled, setScrolled] = useState(false);
    const [loginOpen, setLoginOpen] = useState(false);
    const locales = props.available_locales || { es: 'Español', ca: 'Català', en: 'English' };
    const [menu, setMenu] = useState({
        about: [],
        events: [],
        magazine: [],
        recomendations: [],
        store: [],
    });

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        ['about', 'events', 'magazine', 'recomendations', 'store'].forEach(async (cat) => {
            try {
                const res = await axios.get(`/menu/${cat}/items`);
                setMenu((m) => ({ ...m, [cat]: res.data.pages || [] }));
            } catch (e) {
                // ignore
            }
        });
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-lg border-b border-white/10 py-4' : 'bg-transparent py-6'}`}>
            <div className="container mx-auto px-6 flex items-center justify-between">
                <Link href="/" className="group flex items-center space-x-2">
                    <span className="text-2xl font-bold tracking-tighter hover:text-accent-primary transition-colors">
                        BEARS <span className="text-accent-primary group-hover:text-white transition-colors">SITGES</span> WEEK
                    </span>
                </Link>

                <ul className="hidden md:flex items-center space-x-8">
                    {/* ABOUT with custom dropdown */}
                    <li className="relative group">
                        <Link href="/about" className="nav-link">About</Link>
                        <div className="absolute left-0 top-full mt-2 hidden group-hover:block">
                            <div className="glass-card p-3">
                                <ul className="min-w-64">
                                    {[
                                        { label: 'Nosotros', slug: 'nosotros' },
                                        { label: 'Bs Info', slug: 'bs-info' },
                                        { label: 'Bears solidarios', slug: 'bears-solidarios' },
                                        { label: 'Galeria', slug: 'galeria' },
                                    ].map((p) => (
                                        <li key={p.slug}>
                                            <Link href={`/about/${p.slug}`} className="block px-3 py-2 text-sm text-gray-300 hover:text-white">
                                                {p.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </li>

                    {/* EVENTS with dropdown from content */}
                    <li className="relative group">
                        <Link href="/events" className="nav-link">Events</Link>
                        {menu.events?.length > 0 && (
                            <div className="absolute left-0 top-full mt-2 hidden group-hover:block">
                                <div className="glass-card p-3">
                                    <ul className="min-w-64">
                                        {[
                                            { label: 'Bears Sitges Meeting', slug: 'bears-sitges-meeting' },
                                            { label: 'Bears Sitges Week', slug: 'bears-sitges-week' },
                                        ].map((p) => (
                                            <li key={p.slug}>
                                                <Link href={`/events/${p.slug}`} className="block px-3 py-2 text-sm text-gray-300 hover:text-white">
                                                    {p.label}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </li>

                    {/* MAGAZINE direct link to noticias (no dropdown) */}
                    <li>
                        <Link href="/magazine/noticias" className="nav-link">Magazine</Link>
                    </li>

                    {/* STORE direct link to ecommerce */}
                    <li>
                        <Link href="/shop" className="nav-link">Store</Link>
                    </li>

                    {/* RECOMMENDATIONS with custom dropdown */}
                    <li className="relative group">
                        <Link href="/recomendations" className="nav-link">Recomendations</Link>
                        <div className="absolute left-0 top-full mt-2 hidden group-hover:block">
                            <div className="glass-card p-3">
                                <ul className="min-w-64">
                                    {[
                                        { label: 'Alojamiento', slug: 'alojamiento' },
                                        { label: '¿Donde comer?', slug: 'donde-comer' },
                                        { label: 'Bares, Pubs, Clubs', slug: 'bares-pubs-clubs' },
                                        { label: '¿Donde ir de compras?', slug: 'compras' },
                                        { label: 'Saunas - Apps de citas', slug: 'saunas-citas-and-more' },
                                        { label: 'Transfers, viajes, excursiones', slug: 'transfers-viajes-y-excursiones' },
                                        { label: 'Otros recomendados', slug: 'otros-recomendados' },
                                        { label: 'Brothered', slug: 'brothered' },
                                    ].map((p) => (
                                        <li key={p.slug}>
                                            <Link href={`/recomendations/${p.slug}`} className="block px-3 py-2 text-sm text-gray-300 hover:text-white">
                                                {p.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </li>
                </ul>

                <div className="flex items-center space-x-6">
                    {/* Language dropdown styled like others */}
                    <div className="relative group">
                        <button className="nav-link flex items-center">ES</button>
                        <div className="absolute right-0 top-full mt-2 hidden group-hover:block">
                            <div className="glass-card p-2">
                                <ul className="min-w-36">
                                    {Object.entries(locales).map(([code, name]) => (
                                        <li key={code}>
                                            <a href="#" className="block px-3 py-2 text-sm text-gray-300 hover:text-white">
                                                {code.toUpperCase()} — {name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {props.auth?.user ? (
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="btn-secondary py-2 px-5 text-sm"
                            >
                                Salir
                            </Link>
                        ) : (
                            <>
                                <button onClick={() => setLoginOpen(true)} className="btn-primary py-2 px-5 text-sm">Acceder</button>
                                <Link href="/register" className="btn-secondary py-2 px-5 text-sm">Registro</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden absolute right-6 top-5">
                <button
                    aria-label="Toggle menu"
                    className="glass-card px-3 py-2"
                    onClick={() => setLoginOpen((o) => !o)}
                >
                    <span className="block w-6 h-0.5 bg-white mb-1"></span>
                    <span className="block w-6 h-0.5 bg-white mb-1"></span>
                    <span className="block w-6 h-0.5 bg-white"></span>
                </button>
            </div>

            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: loginOpen ? '100vh' : 0, opacity: loginOpen ? 1 : 0 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="fixed inset-x-0 top-0 z-40 bg-gradient-to-b from-black via-black/95 to-black/90 overflow-hidden md:hidden"
            >
                <div className="px-6 pt-20 pb-12 space-y-6">
                    <Link href="/about" className="block text-2xl font-bold tracking-tight">About</Link>
                    <div className="pl-4 space-y-2">
                        <Link href="/about/nosotros" className="block text-gray-400 hover:text-white">Nosotros</Link>
                        <Link href="/about/bs-info" className="block text-gray-400 hover:text-white">Bs Info</Link>
                        <Link href="/about/bears-solidarios" className="block text-gray-400 hover:text-white">Bears solidarios</Link>
                        <Link href="/about/galeria" className="block text-gray-400 hover:text-white">Galeria</Link>
                    </div>
                    <Link href="/events" className="block text-2xl font-bold tracking-tight">Events</Link>
                    <div className="pl-4 space-y-2">
                        <Link href="/events/bears-sitges-meeting" className="block text-gray-400 hover:text-white">Bears Sitges Meeting</Link>
                        <Link href="/events/bears-sitges-week" className="block text-gray-400 hover:text-white">Bears Sitges Week</Link>
                    </div>
                    <Link href="/magazine/noticias" className="block text-2xl font-bold tracking-tight">Magazine</Link>
                    <Link href="/shop" className="block text-2xl font-bold tracking-tight">Store</Link>
                    <Link href="/recomendations" className="block text-2xl font-bold tracking-tight">Recomendations</Link>
                    <div className="pl-4 space-y-2">
                        <Link href="/recomendations/alojamiento" className="block text-gray-400 hover:text-white">Alojamiento</Link>
                        <Link href="/recomendations/donde-comer" className="block text-gray-400 hover:text-white">¿Donde comer?</Link>
                        <Link href="/recomendations/bares-pubs-clubs" className="block text-gray-400 hover:text-white">Bares, Pubs, Clubs</Link>
                        <Link href="/recomendations/compras" className="block text-gray-400 hover:text-white">¿Donde ir de compras?</Link>
                        <Link href="/recomendations/saunas-citas-and-more" className="block text-gray-400 hover:text-white">Saunas - Apps de citas</Link>
                        <Link href="/recomendations/transfers-viajes-y-excursiones" className="block text-gray-400 hover:text-white">Transfers, viajes, excursiones</Link>
                        <Link href="/recomendations/otros-recomendados" className="block text-gray-400 hover:text-white">Otros recomendados</Link>
                        <Link href="/recomendations/brothered" className="block text-gray-400 hover:text-white">Brothered</Link>
                    </div>
                    <div className="pt-6">
                        {props.auth?.user ? (
                            <Link href={route('logout')} method="post" as="button" className="btn-secondary w-full py-3">Salir</Link>
                        ) : (
                            <button onClick={() => setLoginOpen(true)} className="btn-primary w-full py-3">Acceder</button>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Login Modal */}
            {loginOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="glass-card p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">Acceder</h2>
                            <button onClick={() => setLoginOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <div className="space-y-3">
                            <input type="email" placeholder="Email" className="w-full form-input" />
                            <input type="password" placeholder="Password" className="w-full form-input" />
                            <div className="flex items-center justify-between">
                                <Link href="/login" className="btn-primary px-4 py-2 text-sm">Ir a Login</Link>
                                <Link href="/register" className="text-sm text-gray-400 hover:text-white">Crear cuenta</Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
