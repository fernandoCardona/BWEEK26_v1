import React, { useMemo, useState } from 'react';
import UserLayout from '@/Layouts/UserLayout';
import useLockBodyScroll from '@/hooks/useLockBodyScroll';

export default function Store({ transactions, cart }) {
    const [openTxId, setOpenTxId] = useState(null);
    const openTx = useMemo(() => (transactions || []).find((t) => t.id === openTxId) ?? null, [openTxId, transactions]);
    useLockBodyScroll(!!openTx);

    const cartItems = cart?.items ?? [];
    const cartTotal = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + Number(item.unit_price || 0) * Number(item.quantity || 0), 0).toFixed(2);
    }, [cartItems]);

    return (
        <UserLayout active="store" headTitle="Mi cuenta • Store" title="MI CUENTA" subtitle="Tickets y compras • Gestión">
            <div className="glass-card p-6">
                <h2 className="text-xl font-bold mb-6">Carrito</h2>
                {cartItems.length ? (
                    <div className="space-y-3">
                        {cartItems.map((i) => (
                            <div key={i.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                                <div className="min-w-0">
                                    <p className="font-bold text-sm truncate">{i.product?.name?.es || i.product?.name?.en || 'Producto'}</p>
                                    <p className="text-xs text-gray-500">x{i.quantity}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold">{i.unit_price}€</p>
                                </div>
                            </div>
                        ))}
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-sm text-gray-400">Total</span>
                            <span className="text-lg font-black">{cartTotal}€</span>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-400">Tu carrito está vacío.</p>
                )}
            </div>

            <div className="glass-card p-6 mt-8">
                <h2 className="text-xl font-bold mb-6">Transacciones</h2>
                {transactions?.length ? (
                    <div className="space-y-3">
                        {transactions.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setOpenTxId(t.id)}
                                className="w-full text-left p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm truncate">
                                            {t.type === 'ticket' ? 'Tickets' : t.type === 'merch' ? 'Merchandising' : 'Transacción'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {t.created_at ? new Date(t.created_at).toLocaleString() : '-'} • {t.items?.length ?? 0} items
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-black">{t.total_amount}€</p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">{t.status}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400">Todavía no hay transacciones asociadas a tu cuenta.</p>
                )}
            </div>

            {openTx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6" onClick={() => setOpenTxId(null)}>
                    <div
                        className="glass-card max-w-2xl w-full p-6 border border-white/10 bg-white/10 shadow-2xl shadow-black/60"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4 mb-6">
                            <div className="min-w-0">
                                <h3 className="text-2xl font-black tracking-tight truncate">
                                    {openTx.type === 'ticket' ? 'Transacción de tickets' : openTx.type === 'merch' ? 'Transacción de merch' : 'Transacción'}
                                </h3>
                                <p className="text-sm text-gray-400">
                                    {openTx.created_at ? new Date(openTx.created_at).toLocaleString() : '-'} • {openTx.status}
                                </p>
                            </div>
                            <button className="btn-secondary px-4 py-2 text-sm" onClick={() => setOpenTxId(null)}>
                                Cerrar
                            </button>
                        </div>

                        <div className="space-y-3">
                            {(openTx.items ?? []).map((it) => (
                                <div key={it.id} className="flex items-start justify-between gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm truncate">{it.title || 'Item'}</p>
                                        {it.ticket?.event && (
                                            <p className="text-xs text-gray-500 truncate">{it.ticket.event.name?.es || it.ticket.event.name?.en || 'Evento'}</p>
                                        )}
                                        <p className="text-xs text-gray-500">x{it.quantity}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-bold">{it.total_price}€</p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">{it.kind}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between pt-6">
                            <span className="text-sm text-gray-400">Total</span>
                            <span className="text-2xl font-black">{openTx.total_amount}€</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Una transacción realizada no se puede editar.</p>
                    </div>
                </div>
            )}
        </UserLayout>
    );
}
