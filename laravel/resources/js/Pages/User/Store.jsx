import React, { useMemo, useState } from 'react';
import UserLayout from '@/Layouts/UserLayout';
import useLockBodyScroll from '@/hooks/useLockBodyScroll';
import { formatDMY, formatTimeHM } from '@/utils/date';
import { usePage } from '@inertiajs/react';

export default function Store({ transactions, cart }) {
    const { props } = usePage();
    const user = props?.auth?.user;
    const [openTxId, setOpenTxId] = useState(null);
    const openTx = useMemo(() => (transactions || []).find((t) => t.id === openTxId) ?? null, [openTxId, transactions]);
    useLockBodyScroll(!!openTx);

    const isSuccessStatus = (status) => {
        const key = String(status || '').toLowerCase();
        return key === 'completed' || key === 'success';
    };

    const statusMeta = (status) => {
        const key = String(status || '').toLowerCase();
        if (key === 'failed') return { label: 'FAILED', cls: 'text-red-400' };
        if (key === 'pending') return { label: 'PENDING', cls: 'text-amber-400' };
        if (key === 'completed' || key === 'success') return { label: 'SUCCESS', cls: 'text-emerald-400' };
        return { label: String(status || '').toUpperCase() || '—', cls: 'text-gray-500' };
    };

    const txSummary = (tx) => {
        const items = tx?.items ?? [];
        const first = items[0];
        const firstTitle = first?.title || first?.product?.name?.es || first?.product?.name?.en || (first?.ticket?.event?.name?.es || first?.ticket?.event?.name?.en) || 'Item';
        const extra = items.length > 1 ? ` +${items.length - 1}` : '';
        const hasTicket = items.some((it) => it?.kind === 'ticket' || !!it?.ticket);
        const ticketHint = hasTicket ? ' + ticket' : '';
        return `${firstTitle}${extra}${ticketHint}`;
    };

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
                                            {t.created_at ? `${formatDMY(t.created_at)} ${formatTimeHM(t.created_at)}` : '-'} • {t.items?.length ?? 0} items
                                        </p>
                                        <p className="text-xs text-gray-400 truncate mt-1">{txSummary(t)}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-black">{t.total_amount}€</p>
                                        <p className={`text-[10px] uppercase tracking-widest font-black ${statusMeta(t.status).cls}`}>{statusMeta(t.status).label}</p>
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
                        className="glass-card max-w-3xl w-full p-6 border border-white/10 bg-white/10 shadow-2xl shadow-black/60"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {(() => {
                            const items = openTx.items ?? [];
                            const subtotal = items.reduce((sum, it) => sum + Number(it.total_price || 0), 0);
                            const total = Number(openTx.total_amount || 0);
                            const taxes = Math.max(0, Number((total - subtotal).toFixed(2)));
                            const success = isSuccessStatus(openTx.status);
                            const docTitle = success ? 'INVOICE' : 'PRO FORMA INVOICE';
                            const note =
                                String(openTx.status || '').toLowerCase() === 'failed'
                                    ? 'Pago fallido. Documento provisional (pro forma) sin validez de factura.'
                                    : String(openTx.status || '').toLowerCase() === 'pending'
                                      ? 'Pago pendiente. Documento provisional (pro forma) hasta confirmación.'
                                      : success
                                        ? 'Factura emitida para tu compra.'
                                        : 'Documento provisional.';
                            return (
                                <>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="text-[11px] text-gray-500 uppercase tracking-widest font-bold">{docTitle}</div>
                                            <h3 className="text-2xl font-black tracking-tight truncate mt-1">
                                                {openTx.type === 'ticket' ? 'Tickets' : openTx.type === 'merch' ? 'Merchandising' : 'Transacción'}
                                            </h3>
                                            <div className="text-sm text-gray-400 flex items-center gap-3 mt-1">
                                                <span>{openTx.created_at ? `${formatDMY(openTx.created_at)} ${formatTimeHM(openTx.created_at)}` : '-'}</span>
                                                <span className={`uppercase tracking-widest font-black ${statusMeta(openTx.status).cls}`}>{statusMeta(openTx.status).label}</span>
                                            </div>
                                        </div>
                                        <button className="btn-secondary px-4 py-2 text-sm" onClick={() => setOpenTxId(null)}>
                                            Cerrar
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Bill To</div>
                                            <div className="text-sm font-black">{user?.name || '—'}</div>
                                            <div className="text-xs text-gray-400 mt-1">{user?.email || '—'}</div>
                                            {user?.address_line1 ? <div className="text-xs text-gray-400 mt-2">{user.address_line1}</div> : null}
                                            {user?.address_line2 ? <div className="text-xs text-gray-400">{user.address_line2}</div> : null}
                                            {(user?.postal_code || user?.city || user?.country) ? (
                                                <div className="text-xs text-gray-400">
                                                    {[user?.postal_code, user?.city, user?.country].filter(Boolean).join(' • ')}
                                                </div>
                                            ) : null}
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Details</div>
                                            <div className="text-xs text-gray-400">Invoice #: <span className="font-black text-gray-200">{openTx.id}</span></div>
                                            <div className="text-xs text-gray-400 mt-1">Currency: <span className="font-black text-gray-200">{(openTx.currency || 'EUR').toUpperCase()}</span></div>
                                            <div className="text-xs text-gray-400 mt-1">Items: <span className="font-black text-gray-200">{items.length}</span></div>
                                        </div>
                                    </div>

                                    <div className="mt-6 border border-white/10 rounded-2xl overflow-hidden">
                                        <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-white/5 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                                            <div className="col-span-6">Descripción</div>
                                            <div className="col-span-2 text-right">Cant.</div>
                                            <div className="col-span-2 text-right">Unit</div>
                                            <div className="col-span-2 text-right">Importe</div>
                                        </div>
                                        <div className="divide-y divide-white/10">
                                            {items.map((it) => (
                                                <div key={it.id} className="grid grid-cols-12 gap-3 px-4 py-3">
                                                    <div className="col-span-6 min-w-0">
                                                        <div className="text-sm font-black truncate">{it.title || 'Item'}</div>
                                                        {it.ticket?.event ? (
                                                            <div className="text-xs text-gray-400 truncate">{it.ticket.event.name?.es || it.ticket.event.name?.en || 'Evento'}</div>
                                                        ) : null}
                                                    </div>
                                                    <div className="col-span-2 text-right text-sm font-bold text-gray-200">{Number(it.quantity || 0)}</div>
                                                    <div className="col-span-2 text-right text-sm font-bold text-gray-200">{Number(it.unit_price || 0).toFixed(2)}€</div>
                                                    <div className="col-span-2 text-right text-sm font-black">{Number(it.total_price || 0).toFixed(2)}€</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                        <div className="text-xs text-gray-400">{note}</div>
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                            <div className="flex items-center justify-between text-sm text-gray-400">
                                                <span>Subtotal</span>
                                                <span className="font-black text-gray-200">{subtotal.toFixed(2)}€</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm text-gray-400 mt-2">
                                                <span>Impuestos</span>
                                                <span className="font-black text-gray-200">{taxes.toFixed(2)}€</span>
                                            </div>
                                            <div className="h-px bg-white/10 my-3" />
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-gray-300">Total</span>
                                                <span className="text-2xl font-black">{total.toFixed(2)}€</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
        </UserLayout>
    );
}
