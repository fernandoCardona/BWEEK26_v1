import React from 'react';
import UserLayout from '@/Layouts/UserLayout';

export default function Dashboard({ stats }) {
    return (
        <UserLayout active="overview" headTitle="Mi cuenta • Overview" title="MI CUENTA" subtitle="Resumen personal • Compras y tickets">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <StatCard title="Tickets totales" value={stats?.tickets_total ?? 0} />
                <StatCard title="Tickets activos" value={stats?.tickets_active ?? 0} />
                <StatCard title="Tickets validados" value={stats?.tickets_validated ?? 0} />
                <StatCard title="Compras merch" value={stats?.merch_purchases_total ?? 0} />
            </div>

            <div className="glass-card p-6">
                <p className="text-gray-400">
                    Este overview mostrará el resumen de tus tickets y compras (histórico, importes y estado). Lo dejamos ya
                    estructurado y lo iremos completando pestaña por pestaña.
                </p>
            </div>
        </UserLayout>
    );
}

function StatCard({ title, value }) {
    return (
        <div className="glass-card border border-white/10">
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-4 block">{title}</span>
            <div className="flex items-end justify-between">
                <span className="text-4xl font-black">{value}</span>
            </div>
        </div>
    );
}

