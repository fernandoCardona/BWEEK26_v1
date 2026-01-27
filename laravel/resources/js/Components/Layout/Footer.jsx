import React from 'react';
import { Link } from '@inertiajs/react';
import { FaFacebookF, FaInstagram, FaTelegramPlane, FaWhatsapp } from 'react-icons/fa';

export default function Footer({ onOpenLegal }) {
    return (
        <footer className="py-20 border-t border-white/10 bg-black">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-12 md:space-y-0 text-center md:text-left">
                    <div>
                        <h2 className="text-3xl font-black tracking-tighter mb-4">
                            <span className="text-gradient">BEARS SITGES WEEK</span>
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
                                <li><Link href="/about" className="link-hover-gradient">About</Link></li>
                                <li><Link href="/events" className="link-hover-gradient">Eventos</Link></li>
                                <li><Link href="/program" className="link-hover-gradient">Programa</Link></li>
                                <li><Link href="/magazine" className="link-hover-gradient">Magazine</Link></li>
                                <li><Link href="/shop" className="link-hover-gradient">Tienda</Link></li>
                                <li><Link href="/recomendations" className="link-hover-gradient">Recomendaciones</Link></li>
                                <li><Link href="/me/tickets" className="link-hover-gradient">Tickets</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-6">Legal</h4>
                            <ul className="space-y-4 text-gray-500">
                                <li>
                                    <button type="button" className="link-hover-gradient" onClick={() => onOpenLegal?.('privacy')}>
                                        Política de privacidad
                                    </button>
                                </li>
                                <li>
                                    <button type="button" className="link-hover-gradient" onClick={() => onOpenLegal?.('terms')}>
                                        Términos y condiciones
                                    </button>
                                </li>
                                <li>
                                    <button type="button" className="link-hover-gradient" onClick={() => onOpenLegal?.('cookies')}>
                                        Política de cookies
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
                    <p>© 2026 Bears Sitges Week. Todos los derechos reservados.</p>
                    <div className="flex items-center gap-6 mt-4 md:mt-0">
                        <a href="#" className="icon-btn icon-btn-gradient" aria-label="Facebook">
                            <FaFacebookF size={22} />
                        </a>
                        <a href="#" className="icon-btn icon-btn-gradient" aria-label="Instagram">
                            <FaInstagram size={22} />
                        </a>
                        <a href="#" className="icon-btn icon-btn-gradient" aria-label="Telegram">
                            <FaTelegramPlane size={22} />
                        </a>
                        <a href="#" className="icon-btn icon-btn-gradient" aria-label="WhatsApp">
                            <FaWhatsapp size={22} />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
