import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';

export default function Navigation() {
    const { url, props } = usePage();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-lg border-b border-white/10 py-4' : 'bg-transparent py-6'}`}>
            <div className="container mx-auto px-6 flex items-center justify-between">
                <Link href="/" className="group flex items-center space-x-2">
                    <span className="text-2xl font-bold tracking-tighter hover:text-accent-primary transition-colors">
                        BEARS<span className="text-accent-primary group-hover:text-white transition-colors">WEEK</span>
                    </span>
                </Link>

                <ul className="hidden md:flex items-center space-x-8">
                    <li><Link href="#events" className="nav-link">Eventos</Link></li>
                    <li><Link href="#tickets" className="nav-link">Entradas</Link></li>
                    <li><Link href="#about" className="nav-link">Sobre Nosotros</Link></li>
                </ul>

                <div className="flex items-center space-x-6">
                    <select className="bg-transparent text-sm border-none focus:ring-0 cursor-pointer text-gray-400 hover:text-white transition-colors">
                        <option value="es">ES</option>
                        <option value="ca">CA</option>
                        <option value="en">EN</option>
                    </select>

                    <Link href="/login" className="btn-primary py-2 px-5 text-sm">
                        Acceder
                    </Link>
                </div>
            </div>
        </nav>
    );
}
