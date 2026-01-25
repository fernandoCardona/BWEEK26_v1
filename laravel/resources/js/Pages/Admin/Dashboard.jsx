import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { motion } from 'framer-motion';

export default function Dashboard({ stats }) {
    return (
        <AdminLayout active="overview" headTitle="Admin • Overview" subtitle="Bears Sitges Week 2026 • Live Monitoring">
            <div className="container mx-auto">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                        <StatCard title="Ventas Netas" value="42,150€" trend="+18%" color="primary" />
                        <StatCard title="Chatbot Active" value="1,204" trend="Live" color="secondary" />
                        <StatCard title="Lead Score Avg" value="68/100" trend="+5" color="tertiary" />
                        <StatCard title="Sync AI Status" value="Healthy" trend="100%" color="success" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 glass-card">
                            <h3 className="text-xl font-bold mb-8 flex items-center">
                                <div className="w-2 h-2 rounded-full bg-accent-primary mr-3 animate-pulse" />
                                Interacciones del Asistente (Realtime)
                            </h3>
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-accent-primary/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary to-accent-tertiary flex items-center justify-center text-xs font-bold">U{i}</div>
                                            <div>
                                                <p className="font-bold text-sm">Usuario #{1020 + i}</p>
                                                <p className="text-xs text-gray-500">Intención: Compra de tickets</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] bg-success/10 text-success px-2 py-1 rounded font-bold uppercase">Ticket Emitido</span>
                                            <p className="text-[10px] text-gray-600 mt-1">Hace {i * 2} min</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="glass-card flex flex-col justify-between">
                            <div>
                                <h3 className="text-xl font-bold mb-6">Estado de la Colección</h3>
                                <div className="space-y-6">
                                    <CategoryProgress label="Tickets VIP" percent={85} color="bg-accent-secondary" />
                                    <CategoryProgress label="Pool Party" percent={40} color="bg-accent-primary" />
                                    <CategoryProgress label="Merch" percent={12} color="bg-accent-tertiary" />
                                </div>
                            </div>
                            <button className="w-full mt-10 py-4 rounded-2xl border border-white/10 hover:bg-white/5 font-bold transition-all">
                                Gestionar Inventario →
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AdminLayout>
    );
}

function StatCard({ title, value, trend, color }) {
    const borderColors = {
        primary: 'border-accent-primary/20',
        secondary: 'border-accent-secondary/20',
        tertiary: 'border-accent-tertiary/20',
        success: 'border-success/20',
    };

    return (
        <div className={`glass-card ${borderColors[color]}`}>
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-4 block">{title}</span>
            <div className="flex items-end justify-between">
                <span className="text-4xl font-black">{value}</span>
                <span className="text-accent-primary text-xs font-bold">{trend}</span>
            </div>
        </div>
    );
}

function CategoryProgress({ label, percent, color }) {
    return (
        <div>
            <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-gray-500 uppercase tracking-widest">{label}</span>
                <span>{percent}%</span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    className={`h-full ${color}`}
                />
            </div>
        </div>
    );
}

