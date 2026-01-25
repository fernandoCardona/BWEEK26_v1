import React from 'react';
import UserLayout from '@/Layouts/UserLayout';

export default function Store({ tickets }) {
    return (
        <UserLayout active="store" headTitle="Mi cuenta • Store" title="MI CUENTA" subtitle="Tickets y compras • Gestión">
            <div className="glass-card p-6">
                <h2 className="text-xl font-bold mb-6">Mis tickets</h2>
                {tickets?.length ? (
                    <div className="space-y-3">
                        {tickets.map((t) => (
                            <div key={t.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div>
                                    <p className="font-bold text-sm">{t.event?.name?.es || t.event?.name?.en || 'Evento'}</p>
                                    <p className="text-xs text-gray-500">{t.ticket_type}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold">{t.price}€</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{t.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400">Todavía no tienes tickets asociados a tu cuenta.</p>
                )}
            </div>

            <div className="glass-card p-6 mt-8">
                <h2 className="text-xl font-bold mb-6">Merchandising</h2>
                <p className="text-gray-400">Historial y gestión de compras de merchandising pendiente de implementación.</p>
            </div>
        </UserLayout>
    );
}

