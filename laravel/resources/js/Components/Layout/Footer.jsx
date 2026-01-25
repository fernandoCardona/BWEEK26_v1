import React from 'react';

export default function Footer() {
    const version = import.meta.env.VITE_APP_VERSION || 'dev';
    return (
        <footer className="py-20 border-t border-white/10 bg-black">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-12 md:space-y-0 text-center md:text-left">
                    <div>
                        <h2 className="text-3xl font-black tracking-tighter mb-4">
                            BEARS<span className="text-accent-primary">WEEK</span>
                        </h2>
                        <p className="max-w-xs text-gray-500">
                            El festival Bears número uno del mundo.
                            Sitges, España. Una experiencia legendaria.
                        </p>
                    </div>

                    <div className="flex space-x-12">
                        <div>
                            <h4 className="text-white font-bold mb-6">Enlaces</h4>
                            <ul className="space-y-4 text-gray-500">
                                <li><a href="#" className="hover:text-white transition-colors">Eventos</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Tickets</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Alojamiento</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-gradient font-bold mb-6">Legal</h4>
                            <ul className="space-y-4 text-gray-500">
                                <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Términos</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
                    <p>© 2026 Bears Week Sitges. Todos los derechos reservados.</p>
                    <div className="flex items-center gap-6 mt-4 md:mt-0">
                        <a href="#" className="text-gray-500 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-accent-primary hover:via-accent-secondary hover:to-accent-tertiary transition-colors" aria-label="Instagram">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5"/>
                                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/>
                                <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
                            </svg>
                        </a>
                        <a href="#" className="text-gray-500 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-accent-primary hover:via-accent-secondary hover:to-accent-tertiary transition-colors" aria-label="Telegram">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                <path d="M21 3L3 10l6 2 2 6 10-15z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M9 12l12-9" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                        </a>
                        <a href="#" className="text-gray-500 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-accent-primary hover:via-accent-secondary hover:to-accent-tertiary transition-colors" aria-label="WhatsApp">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                <path d="M20 12a8 8 0 1 1-15.5 3.5L3 21l5.5-1.5A8 8 0 1 1 20 12z" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M8.5 9.5c.5 2 2.5 3.5 3.5 4l1.5-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
