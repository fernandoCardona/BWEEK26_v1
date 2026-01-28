import React, { useMemo, useState } from 'react';
import Layout from '@/Layouts/Layout';
import axios from 'axios';
import { Link } from '@inertiajs/react';

export default function Index({ cart: initialCart }) {
    const [cart, setCart] = useState(initialCart);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const items = cart?.items ?? [];

    const total = useMemo(() => {
        return items.reduce((sum, item) => sum + Number(item.unit_price) * Number(item.quantity), 0);
    }, [items]);

    const refresh = async () => {
        const res = await axios.get(route('cart.data'));
        setCart(res.data);
    };

    const updateQty = async (itemId, quantity) => {
        setError(null);
        setSuccess(null);
        try {
            const res = await axios.patch(route('cart.items.update', itemId), { quantity });
            setCart(res.data);
        } catch (e) {
            setError(e?.response?.data?.message ?? 'No se pudo actualizar el carrito');
        }
    };

    const remove = async (itemId) => {
        setError(null);
        setSuccess(null);
        try {
            const res = await axios.delete(route('cart.items.remove', itemId));
            setCart(res.data);
        } catch (e) {
            setError(e?.response?.data?.message ?? 'No se pudo eliminar el item');
        }
    };

    const checkout = async () => {
        setError(null);
        setSuccess(null);
        setProcessing(true);
        try {
            const res = await axios.post(route('checkout.stripe'));
            const url = res.data?.url;
            if (url) {
                window.location.href = url;
            } else {
                setError('No se pudo iniciar el pago');
            }
        } catch (e) {
            setError(e?.response?.data?.message ?? 'No se pudo completar el checkout');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Layout>
            <div className="pt-32 pb-20 px-6">
                <div className="container mx-auto max-w-4xl">
                    <div className="flex items-start justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter mb-2">Carrito</h1>
                            <p className="text-gray-400">Revisa tus productos antes de finalizar.</p>
                        </div>
                        <Link href="/shop" className="btn-secondary px-6 py-3 text-sm">
                            Seguir comprando
                        </Link>
                    </div>

                    {error && <div className="mb-4 text-sm text-red-400">{error}</div>}
                    {success && <div className="mb-4 text-sm text-green-400">{success}</div>}

                    <div className="glass-card p-6">
                        {!items.length ? (
                            <p className="text-gray-400">Tu carrito está vacío.</p>
                        ) : (
                            <div className="space-y-4">
                                {items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <div className="min-w-0">
                                            <p className="font-black text-sm truncate">
                                                {item.kind === 'ticket'
                                                    ? `${(item.ticket_type?.code ?? 'TICKET').toUpperCase()} • ${
                                                          typeof item.event?.name === 'object' ? item.event?.name?.es ?? 'Evento' : item.event?.name ?? 'Evento'
                                                      }`
                                                    : typeof item.product?.name === 'object'
                                                    ? item.product?.name?.es ?? 'Producto'
                                                    : item.product?.name ?? 'Producto'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {item.unit_price}€ • stock{' '}
                                                {item.kind === 'ticket' ? item.ticket_type?.stock ?? '-' : item.product?.stock ?? '-'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button type="button" className="btn-secondary px-3 py-2 text-sm" onClick={() => updateQty(item.id, Math.max(0, item.quantity - 1))}>
                                                -
                                            </button>
                                            <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                                            <button type="button" className="btn-secondary px-3 py-2 text-sm" onClick={() => updateQty(item.id, item.quantity + 1)}>
                                                +
                                            </button>
                                            <button type="button" className="px-4 py-2 text-sm rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white transition-colors" onClick={() => remove(item.id)}>
                                                Quitar
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                    <div className="text-gray-400">Total</div>
                                    <div className="text-2xl font-black">{total.toFixed(2)}€</div>
                                </div>

                                <button type="button" className="btn-primary w-full py-3 text-sm" disabled={processing} onClick={checkout}>
                                    Finalizar compra
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
