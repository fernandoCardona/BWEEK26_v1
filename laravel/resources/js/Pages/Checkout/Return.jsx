import React, { useEffect, useMemo, useState } from 'react';
import Layout from '@/Layouts/Layout';
import axios from 'axios';
import TicketTemplate from '@/Components/TicketTemplate';

function ConfettiOverlay({ active }) {
    const pieces = useMemo(() => {
        return Array.from({ length: 40 }).map((_, i) => ({
            id: i,
            left: Math.round(Math.random() * 100),
            delay: Math.random() * 1.2,
            duration: 2.5 + Math.random() * 1.5,
            size: 6 + Math.round(Math.random() * 6),
            color: ['#22c55e', '#a855f7', '#f59e0b', '#38bdf8', '#fb7185'][i % 5],
        }));
    }, []);

    if (!active) return null;

    return (
        <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
            {pieces.map((p) => (
                <div
                    key={p.id}
                    style={{
                        position: 'absolute',
                        top: -20,
                        left: `${p.left}%`,
                        width: p.size,
                        height: p.size * 1.6,
                        background: p.color,
                        opacity: 0.9,
                        transform: `rotate(${(p.id * 37) % 180}deg)`,
                        animation: `confetti-fall ${p.duration}s linear ${p.delay}s 1`,
                    }}
                />
            ))}
            <style>{`
                @keyframes confetti-fall {
                    0% { transform: translateY(-20px) rotate(0deg); }
                    100% { transform: translateY(110vh) rotate(720deg); }
                }
            `}</style>
        </div>
    );
}

export default function Return({ order_id }) {
    const orderId = String(order_id || '');
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('pending');
    const [payload, setPayload] = useState(null);
    const [error, setError] = useState(null);
    const [showSuccess, setShowSuccess] = useState(true);

    const done = useMemo(() => String(status).toLowerCase() === 'completed', [status]);
    const failed = useMemo(() => String(status).toLowerCase() === 'failed', [status]);

    useEffect(() => {
        let timer = null;
        let stopped = false;

        const tick = async () => {
            if (stopped) return;
            if (!orderId) {
                setError('Falta el identificador del pedido.');
                setLoading(false);
                return;
            }

            try {
                const res = await axios.get(route('order.status', orderId), { headers: { Accept: 'application/json' } });
                setPayload(res.data);
                setStatus(res.data?.status || 'pending');
                setLoading(false);
            } catch (e) {
                setError(e?.response?.data?.message ?? 'No se pudo verificar el estado del pago.');
                setLoading(false);
            }
        };

        tick();
        timer = setInterval(() => {
            if (!done && !failed) tick();
        }, 3000);

        return () => {
            stopped = true;
            if (timer) clearInterval(timer);
        };
    }, [orderId, done, failed]);

    const tickets = payload?.tickets ?? [];

    useEffect(() => {
        if (done) setShowSuccess(true);
    }, [done]);

    return (
        <Layout>
            <ConfettiOverlay active={done && showSuccess} />
            <div className="pt-32 pb-20 px-6">
                <div className="container mx-auto max-w-4xl">
                    <h1 className="text-4xl font-black tracking-tighter mb-2">Pago</h1>
                    <p className="text-gray-400 mb-8">Estamos verificando la operación con la pasarela.</p>

                    {error ? <div className="glass-card p-6 text-red-400">{error}</div> : null}

                    {!error ? (
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Pedido</div>
                                    <div className="text-sm font-black truncate">{orderId || '—'}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Estado</div>
                                    <div className={`text-sm font-black ${done ? 'text-emerald-400' : failed ? 'text-red-400' : 'text-amber-400'}`}>
                                        {String(status || 'pending').toUpperCase()}
                                    </div>
                                </div>
                            </div>

                            {loading ? <div className="mt-6 text-gray-400 text-sm">Procesando…</div> : null}

                            {done && showSuccess ? (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6" onClick={() => setShowSuccess(false)}>
                                    <div
                                        className="glass-card max-w-4xl w-full p-6 border border-white/10 bg-white/10 shadow-2xl shadow-black/60"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Éxito</div>
                                                <div className="text-2xl font-black mt-1">¡Pago confirmado!</div>
                                                <div className="text-sm text-gray-400 mt-1">Tus tickets ya están disponibles.</div>
                                            </div>
                                            <button className="btn-secondary px-4 py-2 text-sm" onClick={() => setShowSuccess(false)}>
                                                Cerrar
                                            </button>
                                        </div>

                                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {tickets.map((t) => (
                                                <TicketTemplate key={t.id} ticket={t} event={t.event} user={t.user} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            {failed ? (
                                <div className="mt-8">
                                    <div className="text-red-300 font-black text-lg">Pago fallido</div>
                                    <div className="text-gray-400 text-sm mt-1">No se ha completado el cobro. Puedes reintentar desde el carrito.</div>
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>
        </Layout>
    );
}
