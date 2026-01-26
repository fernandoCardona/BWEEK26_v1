import React, { useState, useEffect, useRef } from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiLogOut, FiShoppingCart, FiUser, FiX } from 'react-icons/fi';
import useLockBodyScroll from '@/hooks/useLockBodyScroll';

export default function Navigation() {
    const { url, props } = usePage();
    const [scrolled, setScrolled] = useState(false);
    const [loginOpen, setLoginOpen] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [openKey, setOpenKey] = useState(null);
    const closeTimer = useRef(null);
    const locales = { es: 'ES', ca: 'CA', en: 'EN', fr: 'FR', it: 'IT', de: 'DE' };
    const currentLocale = (props.locale || 'es').toUpperCase();
    const [menu, setMenu] = useState({
        about: [],
        events: [],
        magazine: [],
        recomendations: [],
        store: [],
    });

    useLockBodyScroll(loginOpen);

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

    const loginForm = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [forgotSent, setForgotSent] = useState(false);
    const forgotForm = useForm({
        email: '',
    });

    const [registerStep, setRegisterStep] = useState('request');

    const registerRequestForm = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const registerVerifyForm = useForm({
        email: '',
        verification_code: '',
    });

    const closeAuthModal = () => {
        setLoginOpen(false);
        setAuthMode('login');
        setRegisterStep('request');
        setForgotSent(false);
        loginForm.reset('password');
        forgotForm.reset();
        registerRequestForm.reset('password', 'password_confirmation');
        registerVerifyForm.reset('verification_code');
        loginForm.clearErrors();
        forgotForm.clearErrors();
        registerRequestForm.clearErrors();
        registerVerifyForm.clearErrors();
    };

    const openLoginModal = () => {
        setAuthMode('login');
        setLoginOpen(true);
    };

    const openRegisterModal = () => {
        setAuthMode('register');
        setRegisterStep('request');
        setLoginOpen(true);
    };

    const submitLogin = (e) => {
        e.preventDefault();
        loginForm.post(route('login'), {
            onSuccess: () => closeAuthModal(),
            onFinish: () => loginForm.reset('password'),
        });
    };

    const submitForgot = (e) => {
        e.preventDefault();
        setForgotSent(false);
        forgotForm.post(route('password.email'), {
            onSuccess: () => setForgotSent(true),
        });
    };

    const submitRegisterRequestCode = (e) => {
        e.preventDefault();
        registerRequestForm.post(route('register.request_code'), {
            onSuccess: () => {
                setRegisterStep('code');
                registerVerifyForm.setData('email', registerRequestForm.data.email);
                registerRequestForm.reset('password', 'password_confirmation');
            },
        });
    };

    const submitRegisterVerifyCode = (e) => {
        e.preventDefault();
        registerVerifyForm.post(route('register'), {
            onSuccess: () => closeAuthModal(),
            onFinish: () => registerVerifyForm.reset('verification_code'),
        });
    };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-lg border-b border-white/10 py-4' : 'bg-transparent py-6'}`}>
            <div className="container mx-auto px-6 flex items-center justify-between">
                <Link href="/" className="group flex items-center space-x-2">
                    <span className="text-2xl font-bold tracking-tighter text-gradient">
                        BEARS SITGES WEEK
                    </span>
                </Link>

                <ul className="hidden md:flex items-center space-x-8">
                    {/* ABOUT with custom dropdown */}
                    <li
                        className="relative group"
                        onMouseEnter={() => {
                            if (closeTimer.current) clearTimeout(closeTimer.current);
                            setOpenKey('about');
                        }}
                        onMouseLeave={() => {
                            closeTimer.current = setTimeout(() => setOpenKey(null), 120);
                        }}
                    >
                        <Link href="/about" className="nav-link">About</Link>
                        <div className={`absolute left-0 top-full ${openKey==='about' ? 'opacity-100 visible' : 'opacity-0 invisible'} transition-all duration-200`}>
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
                    <li
                        className="relative group"
                        onMouseEnter={() => {
                            if (closeTimer.current) clearTimeout(closeTimer.current);
                            setOpenKey('events');
                        }}
                        onMouseLeave={() => {
                            closeTimer.current = setTimeout(() => setOpenKey(null), 120);
                        }}
                    >
                        <Link href="/events" className="nav-link">Events</Link>
                        {menu.events?.length > 0 && (
                            <div className={`absolute left-0 top-full ${openKey==='events' ? 'opacity-100 visible' : 'opacity-0 invisible'} transition-all duration-200`}>
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
                    <li
                        className="relative group"
                        onMouseEnter={() => {
                            if (closeTimer.current) clearTimeout(closeTimer.current);
                            setOpenKey('recomendations');
                        }}
                        onMouseLeave={() => {
                            closeTimer.current = setTimeout(() => setOpenKey(null), 120);
                        }}
                    >
                        <Link href="/recomendations" className="nav-link">Recomendations</Link>
                        <div className={`absolute left-0 top-full ${openKey==='recomendations' ? 'opacity-100 visible' : 'opacity-0 invisible'} transition-all duration-200`}>
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
                    {/* Language dropdown accessible */}
                    <div
                        className="relative"
                        onMouseEnter={() => {
                            if (closeTimer.current) clearTimeout(closeTimer.current);
                            setOpenKey('lang');
                        }}
                        onMouseLeave={() => {
                            closeTimer.current = setTimeout(() => setOpenKey(null), 120);
                        }}
                    >
                        <button className="nav-link flex items-center">{currentLocale}</button>
                        <div className={`absolute right-0 top-full ${openKey==='lang' ? 'opacity-100 visible' : 'opacity-0 invisible'} transition-all duration-200`}>
                            <div className="glass-card p-2">
                                <ul className="min-w-36">
                                    {Object.entries(locales).map(([code]) => (
                                        <li key={code}>
                                            <a href="#" className="block px-3 py-2 text-sm text-gray-300 hover:text-white">
                                                {code.toUpperCase()}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {props.auth?.user ? (
                        <div className="flex items-center gap-4">
                            <Link href={route('cart.index')} className="icon-btn" aria-label="Carrito">
                                <FiShoppingCart size={20} />
                            </Link>
                            <div className="icon-btn">
                                <FiUser size={20} />
                            </div>
                            <Link href={route('logout')} method="post" as="button" className="icon-btn" aria-label="Logout">
                                <FiLogOut size={20} />
                            </Link>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setMobileOpen(false);
                                    setOpenKey(null);
                                    openLoginModal();
                                }}
                                className="btn-primary py-2 px-5 text-sm"
                            >
                                Acceder
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden absolute right-6 top-5">
                <button
                    aria-label="Toggle menu"
                    className="glass-card px-3 py-2"
                    onClick={() => setMobileOpen((o) => !o)}
                >
                    <span className="block w-6 h-0.5 bg-white mb-1"></span>
                    <span className="block w-6 h-0.5 bg-white mb-1"></span>
                    <span className="block w-6 h-0.5 bg-white"></span>
                </button>
            </div>

            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: mobileOpen ? '100vh' : 0, opacity: mobileOpen ? 1 : 0 }}
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
                            <button
                                onClick={() => {
                                    setMobileOpen(false);
                                    setOpenKey(null);
                                    openLoginModal();
                                }}
                                className="btn-primary w-full py-3"
                            >
                                Acceder
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Login Modal */}
            {loginOpen && (
                <div
                    className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-black/70 backdrop-blur-sm p-6"
                    onClick={closeAuthModal}
                >
                    <div
                        className="relative glass-card p-8 w-full max-w-md border border-white/10 bg-white/10 shadow-2xl shadow-black/60"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button onClick={closeAuthModal} className="absolute top-4 right-4 text-gray-400 hover:text-white" aria-label="Cerrar">
                            <FiX size={20} />
                        </button>
                        {authMode === 'register' ? (
                            <>
                                <div className="relative flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-black tracking-tight">Crear cuenta</h2>
                                </div>
                                {registerStep === 'request' ? (
                                    <form onSubmit={submitRegisterRequestCode} className="space-y-4">
                                        <div>
                                            <input
                                                type="text"
                                                placeholder="Nombre"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                                                value={registerRequestForm.data.name}
                                                onChange={(e) => registerRequestForm.setData('name', e.target.value)}
                                            />
                                            {registerRequestForm.errors.name && <div className="text-xs text-red-400 mt-1">{registerRequestForm.errors.name}</div>}
                                        </div>
                                        <div>
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                                                value={registerRequestForm.data.email}
                                                onChange={(e) => registerRequestForm.setData('email', e.target.value)}
                                            />
                                            {registerRequestForm.errors.email && <div className="text-xs text-red-400 mt-1">{registerRequestForm.errors.email}</div>}
                                        </div>
                                        <div>
                                            <input
                                                type="password"
                                                placeholder="Password"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                                                value={registerRequestForm.data.password}
                                                onChange={(e) => registerRequestForm.setData('password', e.target.value)}
                                            />
                                            {registerRequestForm.errors.password && <div className="text-xs text-red-400 mt-1">{registerRequestForm.errors.password}</div>}
                                        </div>
                                        <div>
                                            <input
                                                type="password"
                                                placeholder="Confirmar password"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                                                value={registerRequestForm.data.password_confirmation}
                                                onChange={(e) => registerRequestForm.setData('password_confirmation', e.target.value)}
                                            />
                                            {registerRequestForm.errors.password_confirmation && <div className="text-xs text-red-400 mt-1">{registerRequestForm.errors.password_confirmation}</div>}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Al crear la cuenta aceptas <Link href="/privacy-policy" className="link-hover-gradient">Política de Privacidad</Link> y <Link href="/cookies-policy" className="link-hover-gradient">Política de Cookies</Link>.
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <button type="submit" className="btn-primary px-6 py-3 text-sm" disabled={registerRequestForm.processing}>Enviar código</button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    registerRequestForm.reset('password', 'password_confirmation');
                                                    registerRequestForm.clearErrors();
                                                    setAuthMode('login');
                                                }}
                                                className="btn-secondary px-6 py-3 text-sm"
                                            >
                                                Ya tengo cuenta
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <form onSubmit={submitRegisterVerifyCode} className="space-y-4">
                                        <p className="text-sm text-gray-400">
                                            Hemos enviado un código de 6 dígitos a <span className="text-white">{registerVerifyForm.data.email}</span>.
                                        </p>
                                        <div>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="Código de verificación"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                                                value={registerVerifyForm.data.verification_code}
                                                onChange={(e) => registerVerifyForm.setData('verification_code', e.target.value)}
                                            />
                                            {registerVerifyForm.errors.verification_code && <div className="text-xs text-red-400 mt-1">{registerVerifyForm.errors.verification_code}</div>}
                                            {registerVerifyForm.errors.email && <div className="text-xs text-red-400 mt-1">{registerVerifyForm.errors.email}</div>}
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <button type="submit" className="btn-primary px-6 py-3 text-sm" disabled={registerVerifyForm.processing}>Verificar y crear cuenta</button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    registerVerifyForm.reset('verification_code');
                                                    registerVerifyForm.clearErrors();
                                                    setRegisterStep('request');
                                                }}
                                                className="btn-secondary px-6 py-3 text-sm"
                                            >
                                                Reenviar
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </>
                        ) : authMode === 'forgot' ? (
                            <>
                                <div className="relative flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-black tracking-tight">Recuperar contraseña</h2>
                                </div>
                                {forgotSent ? (
                                    <div className="space-y-4">
                                        <p className="text-sm text-gray-400">
                                            Si el email existe, te hemos enviado un enlace para cambiar tu contraseña.
                                        </p>
                                        <button type="button" className="btn-secondary w-full py-3 text-sm" onClick={() => setAuthMode('login')}>
                                            Volver a acceder
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={submitForgot} className="space-y-4">
                                        <p className="text-sm text-gray-400">
                                            Introduce tu email y te enviaremos un enlace seguro para restablecer la contraseña.
                                        </p>
                                        <div>
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                                                value={forgotForm.data.email}
                                                onChange={(e) => forgotForm.setData('email', e.target.value)}
                                            />
                                            {forgotForm.errors.email && <div className="text-xs text-red-400 mt-1">{forgotForm.errors.email}</div>}
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <button type="submit" className="btn-primary px-6 py-3 text-sm" disabled={forgotForm.processing}>
                                                Enviar enlace
                                            </button>
                                            <button type="button" className="btn-secondary px-6 py-3 text-sm" onClick={() => setAuthMode('login')}>
                                                Cancelar
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="relative flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-black tracking-tight">Acceder</h2>
                                </div>
                                <form onSubmit={submitLogin} className="space-y-4">
                                    <div>
                                        <input
                                            type="email"
                                            placeholder="Email"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                                            value={loginForm.data.email}
                                            onChange={(e) => loginForm.setData('email', e.target.value)}
                                        />
                                        {loginForm.errors.email && <div className="text-xs text-red-400 mt-1">{loginForm.errors.email}</div>}
                                    </div>
                                    <div>
                                        <input
                                            type="password"
                                            placeholder="Password"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                                            value={loginForm.data.password}
                                            onChange={(e) => loginForm.setData('password', e.target.value)}
                                        />
                                        {loginForm.errors.password && <div className="text-xs text-red-400 mt-1">{loginForm.errors.password}</div>}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 text-sm text-gray-400 select-none">
                                            <input
                                                type="checkbox"
                                                className="rounded border-white/20 bg-white/5"
                                                checked={loginForm.data.remember}
                                                onChange={(e) => loginForm.setData('remember', e.target.checked)}
                                            />
                                            Recordarme
                                        </label>
                                        <button
                                            type="button"
                                            className="text-sm text-gray-300 hover:text-white"
                                            onClick={() => {
                                                forgotForm.setData('email', loginForm.data.email);
                                                setForgotSent(false);
                                                setAuthMode('forgot');
                                            }}
                                        >
                                            ¿Olvidaste tu contraseña?
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <button type="submit" className="btn-primary px-6 py-3 text-sm" disabled={loginForm.processing}>Entrar</button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                loginForm.reset('password');
                                                loginForm.clearErrors();
                                                setForgotSent(false);
                                                setAuthMode('register');
                                            }}
                                            className="btn-secondary px-6 py-3 text-sm"
                                        >
                                            Crear cuenta
                                        </button>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        <Link href="/privacy-policy" className="link-hover-gradient">Política de Privacidad</Link>
                                        <span className="mx-2">•</span>
                                        <Link href="/cookies-policy" className="link-hover-gradient">Política de Cookies</Link>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Auth icons fixed removed; now inline with language dropdown */}
        </nav>
    );
}
