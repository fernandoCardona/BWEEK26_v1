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
                            <h4 className="text-white font-bold mb-6">Legal</h4>
                            <ul className="space-y-4 text-gray-500">
                                <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Términos</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
                    <p>© 2026 Bears Week Sitges. Todos los derechos reservados. <span className="ml-2 px-2 py-1 rounded bg-white/5 border border-white/10">v{version}</span></p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-accent-primary transition-colors">Instagram</a>
                        <a href="#" className="hover:text-accent-primary transition-colors">Telegram</a>
                        <a href="#" className="hover:text-accent-primary transition-colors">WhatsApp</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
