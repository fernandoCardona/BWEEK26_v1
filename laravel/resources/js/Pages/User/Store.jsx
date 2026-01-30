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
                            const doc = openTx.billing_document ?? null;
                            const isInvoice = doc?.kind === 'invoice';
                            const issuer = doc?.issuer ?? {};
                            const recipient = doc?.recipient ?? {};
                            const vatRate = Number(doc?.vat_rate ?? 21);
                            const fallbackLines = (openTx.items ?? []).map((it) => {
                                const qty = Number(it.quantity || 0);
                                const total = Number(it.total_price || 0);
                                const rate = vatRate / 100;
                                const base = rate > 0 ? total / (1 + rate) : total;
                                const vat = total - base;
                                return {
                                    id: it.id,
                                    description: it.title || 'Item',
                                    quantity: qty,
                                    unit_price: Number(it.unit_price || 0),
                                    total,
                                    vat_rate: vatRate,
                                    base: Number(base.toFixed(2)),
                                    vat: Number(vat.toFixed(2)),
                                };
                            });
                            const lines = doc?.lines ?? fallbackLines;
                            const baseAmount = Number(doc?.subtotal_amount ?? fallbackLines.reduce((sum, l) => sum + Number(l.base || 0), 0) ?? 0);
                            const vatAmount = Number(doc?.vat_amount ?? fallbackLines.reduce((sum, l) => sum + Number(l.vat || 0), 0) ?? 0);
                            const totalAmount = Number(doc?.total_amount ?? openTx.total_amount ?? fallbackLines.reduce((sum, l) => sum + Number(l.total || 0), 0) ?? 0);
                            const number = doc?.number ?? `PF-${String(openTx.created_at || '').slice(0, 4) || '0000'}-${String(openTx.id || '').slice(0, 6).toUpperCase()}`;
                            const note =
                                String(openTx.status || '').toLowerCase() === 'failed'
                                    ? 'Pago fallido. Documento provisional (proforma) sin validez de factura.'
                                    : String(openTx.status || '').toLowerCase() === 'pending'
                                      ? 'Pago pendiente. Documento provisional (proforma) hasta confirmación.'
                                      : isInvoice
                                        ? 'Factura emitida para tu compra.'
                                        : 'Documento provisional.';
                            return (
                                <>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="text-[11px] text-gray-500 uppercase tracking-widest font-bold">{isInvoice ? 'FACTURA' : 'FACTURA PROFORMA'}</div>
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
                                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Emisor</div>
                                            <div className="text-sm font-black">{issuer?.name || '—'}</div>
                                            {issuer?.tax_id ? <div className="text-xs text-gray-400 mt-1">NIF/CIF: {issuer.tax_id}</div> : null}
                                            {issuer?.address_line1 ? <div className="text-xs text-gray-400 mt-2">{issuer.address_line1}</div> : null}
                                            {issuer?.address_line2 ? <div className="text-xs text-gray-400">{issuer.address_line2}</div> : null}
                                            {[issuer?.postal_code, issuer?.city, issuer?.province, issuer?.country].filter(Boolean).length ? (
                                                <div className="text-xs text-gray-400">{[issuer?.postal_code, issuer?.city, issuer?.province, issuer?.country].filter(Boolean).join(' • ')}</div>
                                            ) : null}
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Cliente</div>
                                            <div className="text-sm font-black">{recipient?.name || user?.name || '—'}</div>
                                            <div className="text-xs text-gray-400 mt-1">{recipient?.email || user?.email || '—'}</div>
                                            {recipient?.phone || user?.phone ? <div className="text-xs text-gray-400 mt-1">{recipient?.phone || user?.phone}</div> : null}
                                            {recipient?.address_line1 || user?.address_line1 ? <div className="text-xs text-gray-400 mt-2">{recipient?.address_line1 || user?.address_line1}</div> : null}
                                            {recipient?.address_line2 || user?.address_line2 ? <div className="text-xs text-gray-400">{recipient?.address_line2 || user?.address_line2}</div> : null}
                                            {[recipient?.postal_code || user?.postal_code, recipient?.city || user?.city, recipient?.country || user?.country].filter(Boolean).length ? (
                                                <div className="text-xs text-gray-400">
                                                    {[recipient?.postal_code || user?.postal_code, recipient?.city || user?.city, recipient?.country || user?.country].filter(Boolean).join(' • ')}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="mt-6 border border-white/10 rounded-2xl overflow-hidden">
                                        <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-white/5 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                                            <div className="col-span-4">Concepto</div>
                                            <div className="col-span-2 text-right">Unid.</div>
                                            <div className="col-span-2 text-right">Precio (sin IVA)</div>
                                            <div className="col-span-1 text-right">IVA</div>
                                            <div className="col-span-1 text-right">Cuota</div>
                                            <div className="col-span-2 text-right">Importe</div>
                                        </div>
                                        <div className="divide-y divide-white/10">
                                            {(lines ?? []).map((l, idx) => {
                                                const qty = Number(l.quantity || 0);
                                                const base = Number(l.base || 0);
                                                const unitBase = qty > 0 ? base / qty : 0;
                                                const vat = Number(l.vat || 0);
                                                return (
                                                    <div key={l.id ?? `${idx}-${l.description}`} className="grid grid-cols-12 gap-3 px-4 py-3">
                                                        <div className="col-span-4 min-w-0">
                                                            <div className="text-sm font-black truncate">{l.description || 'Item'}</div>
                                                        </div>
                                                        <div className="col-span-2 text-right text-sm font-bold text-gray-200">{qty}</div>
                                                        <div className="col-span-2 text-right text-sm font-bold text-gray-200">{unitBase.toFixed(2)}€</div>
                                                        <div className="col-span-1 text-right text-sm font-bold text-gray-200">{vatRate.toFixed(0)}%</div>
                                                        <div className="col-span-1 text-right text-sm font-bold text-gray-200">{vat.toFixed(2)}€</div>
                                                        <div className="col-span-2 text-right text-sm font-black">{Number(l.total || 0).toFixed(2)}€</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                        <div className="text-xs text-gray-400">
                                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Documento</div>
                                            <div className="text-sm font-black">{number}</div>
                                            <div className="mt-3">{note}</div>
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                            <div className="flex items-center justify-between text-sm text-gray-400">
                                                <span>Base imponible</span>
                                                <span className="font-black text-gray-200">{baseAmount.toFixed(2)}€</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm text-gray-400 mt-2">
                                                <span>IVA ({vatRate.toFixed(0)}%)</span>
                                                <span className="font-black text-gray-200">{vatAmount.toFixed(2)}€</span>
                                            </div>
                                            <div className="h-px bg-white/10 my-3" />
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-gray-300">Total</span>
                                                <span className="text-2xl font-black">{totalAmount.toFixed(2)}€</span>
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
