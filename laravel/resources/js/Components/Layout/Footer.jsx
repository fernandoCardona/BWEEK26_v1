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
                    <p>© 2026 <span className="text-gradient">Bears Sitges Week</span>. Todos los derechos reservados.</p>
                    <div className="flex items-center gap-6 mt-4 md:mt-0">
                        <a href="#" className="group text-gray-500 transition-colors" aria-label="Instagram">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                <defs>
                                    <linearGradient id="bearGrad" x1="0" y1="0" x2="24" y2="0">
                                        <stop offset="0%" stopColor="#5B3A2A"/>
                                        <stop offset="50%" stopColor="#CC7A00"/>
                                        <stop offset="100%" stopColor="#F1C232"/>
                                    </linearGradient>
                                </defs>
                                <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" className="opacity-100 group-hover:opacity-0"/>
                                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" className="opacity-100 group-hover:opacity-0"/>
                                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" className="opacity-100 group-hover:opacity-0"/>
                                <rect x="3" y="3" width="18" height="18" rx="5" stroke="url(#bearGrad)" strokeWidth="1.5" className="opacity-0 group-hover:opacity-100"/>
                                <circle cx="12" cy="12" r="4" stroke="url(#bearGrad)" strokeWidth="1.5" className="opacity-0 group-hover:opacity-100"/>
                                <circle cx="17.5" cy="6.5" r="1" fill="#F1C232" className="opacity-0 group-hover:opacity-100"/>
                            </svg>
                        </a>
                        <a href="#" className="group text-gray-500 transition-colors" aria-label="Telegram">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                <defs>
                                    <linearGradient id="bearGrad2" x1="0" y1="0" x2="24" y2="0">
                                        <stop offset="0%" stopColor="#5B3A2A"/>
                                        <stop offset="50%" stopColor="#CC7A00"/>
                                        <stop offset="100%" stopColor="#F1C232"/>
                                    </linearGradient>
                                </defs>
                                <path d="M21 3L3 10l6 2 2 6 10-15z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-100 group-hover:opacity-0"/>
                                <path d="M9 12l12-9" stroke="currentColor" strokeWidth="1.5" className="opacity-100 group-hover:opacity-0"/>
                                <path d="M21 3L3 10l6 2 2 6 10-15z" stroke="url(#bearGrad2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100"/>
                                <path d="M9 12l12-9" stroke="url(#bearGrad2)" strokeWidth="1.5" className="opacity-0 group-hover:opacity-100"/>
                            </svg>
                        </a>
                        <a href="#" className="group text-gray-500 transition-colors" aria-label="WhatsApp">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                <defs>
                                    <linearGradient id="bearGrad3" x1="0" y1="0" x2="24" y2="0">
                                        <stop offset="0%" stopColor="#5B3A2A"/>
                                        <stop offset="50%" stopColor="#CC7A00"/>
                                        <stop offset="100%" stopColor="#F1C232"/>
                                    </linearGradient>
                                </defs>
                                <path d="M20 12a8 8 0 1 1-15.5 3.5L3 21l5.5-1.5A8 8 0 1 1 20 12z" stroke="currentColor" strokeWidth="1.5" className="opacity-100 group-hover:opacity-0"/>
                                <path d="M8.5 9.5c.5 2 2.5 3.5 3.5 4l1.5-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="opacity-100 group-hover:opacity-0"/>
                                <path d="M20 12a8 8 0 1 1-15.5 3.5L3 21l5.5-1.5A8 8 0 1 1 20 12z" stroke="url(#bearGrad3)" strokeWidth="1.5" className="opacity-0 group-hover:opacity-100"/>
                                <path d="M8.5 9.5c.5 2 2.5 3.5 3.5 4l1.5-1" stroke="url(#bearGrad3)" strokeWidth="1.5" strokeLinecap="round" className="opacity-0 group-hover:opacity-100"/>
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
