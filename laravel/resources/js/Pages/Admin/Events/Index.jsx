import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Link } from '@inertiajs/react';

export default function Index({ events, can }) {
    return (
        <AdminLayout active="events" headTitle="Admin • Events">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-3xl font-black tracking-tight">Eventos</h2>
                        {can?.create && (
                            <Link href={route('admin.events.create')} className="btn-primary py-3 px-6 text-sm">
                                Crear evento
                            </Link>
                        )}
                    </div>

                    <div className="glass-card p-6">
                        {events?.length ? (
                            <div className="space-y-3">
                                {events.map((e) => (
                                    <div key={e.id} className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-2.5 h-2.5 rounded-full ${e.is_active ? 'bg-accent-primary' : 'bg-white/20'}`} />
                                                    <p className="font-black text-lg truncate">{e.name}</p>
                                                </div>
                                                <p className="text-sm text-gray-400 mt-1">
                                                    {formatRange(e.start_at, e.end_at)} {e.address ? `• ${e.address}` : ''}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {can?.create && (
                                                    <Link
                                                        href={route('admin.events.create', { parent_event_id: e.id })}
                                                        className="btn-secondary px-5 py-3 text-sm"
                                                    >
                                                        Crear subevento
                                                    </Link>
                                                )}
                                                <Link href={route('admin.events.edit', e.id)} className="btn-primary px-5 py-3 text-sm">
                                                    Editar
                                                </Link>
                                            </div>
                                        </div>

                                        {e.subevents?.length ? (
                                            <div className="mt-4 space-y-2 pl-5 border-l border-white/10">
                                                {e.subevents.map((s) => (
                                                    <Link
                                                        key={s.id}
                                                        href={route('admin.events.edit', s.id)}
                                                        className="block p-3 rounded-2xl border border-white/10 hover:bg-white/5 transition-colors"
                                                    >
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-3">
                                                                    <span className={`w-2 h-2 rounded-full ${s.is_active ? 'bg-accent-primary' : 'bg-white/20'}`} />
                                                                    <p className="font-bold text-sm truncate">{s.name}</p>
                                                                </div>
                                                                <p className="text-xs text-gray-500 mt-1 truncate">{formatRange(s.start_at, s.end_at)}</p>
                                                            </div>
                                                            <span className="text-[10px] uppercase tracking-widest text-gray-500">subevent</span>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400">No hay eventos todavía.</p>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function formatRange(startAt, endAt) {
    if (!startAt) return '-';
    const start = new Date(startAt).toLocaleString();
    const end = endAt ? new Date(endAt).toLocaleString() : null;
    return end ? `${start} → ${end}` : start;
}

