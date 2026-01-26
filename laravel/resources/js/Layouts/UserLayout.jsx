import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import Layout from '@/Layouts/Layout';
import { motion as m } from 'framer-motion';

export default function UserLayout({
    active = 'overview',
    title = 'MI CUENTA',
    subtitle = 'Resumen personal • Compras y tickets',
    headTitle = 'Mi cuenta',
    children,
}) {
    const { props } = usePage();
    const user = props?.auth?.user;
    const displayName = user?.nickname || title;
    const tabs = [
        { key: 'overview', label: 'Overview', href: route('user.dashboard') },
        { key: 'store', label: 'Store', href: route('user.store') },
        { key: 'settings', label: 'Settings', href: route('profile.edit') },
    ];

    return (
        <Layout>
            <Head title={headTitle} />
            <div className="pt-32 pb-20 px-6">
                <div className="container mx-auto">
                    <m.header
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
                    >
                        <div>
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 uppercase">
                                <span className="text-gradient">{displayName}</span>
                            </h1>
                            <p className="text-gray-400 font-medium">{subtitle}</p>
                        </div>
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                            {tabs.map((t) => (
                                <Link
                                    key={t.key}
                                    href={t.href}
                                    className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                                        active === t.key
                                            ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/20'
                                            : 'text-gray-500 hover:text-white'
                                    }`}
                                >
                                    {t.label}
                                </Link>
                            ))}
                        </div>
                    </m.header>
                    {children}
                </div>
            </div>
        </Layout>
    );
}
