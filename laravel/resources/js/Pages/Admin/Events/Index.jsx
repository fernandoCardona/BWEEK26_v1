import React, { useMemo, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import { FiChevronDown } from 'react-icons/fi';
import { formatDMY, formatTimeHM } from '@/utils/date';

export default function Index({ events, can }) {
    const [openDayByEvent, setOpenDayByEvent] = useState({});

    const byEventDays = useMemo(() => {
        const out = {};
        for (const e of events ?? []) {
            const map = new Map();
            for (const s of e.subevents ?? []) {
                const key = s.event_date_ymd || '';
                if (!map.has(key)) map.set(key, []);
                map.get(key).push(s);
            }
            for (const [key, list] of map.entries()) {
                list.sort((a, b) => {
                    const ao = Number(a.sort_order ?? 0);
                    const bo = Number(b.sort_order ?? 0);
                    if (ao !== bo) return ao < bo ? -1 : 1;
                    const as = a.start_at ?? '';
                    const bs = b.start_at ?? '';
                    return as < bs ? -1 : as > bs ? 1 : 0;
                });
                map.set(key, list);
            }
            const keys = Array.from(map.keys()).filter(Boolean).sort();
            out[e.id] = { keys, map };
        }
        return out;
    }, [events]);

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

                                        {(e.subevents?.length ?? 0) > 0 ? (
                                            <div className="mt-5 pt-5 border-t border-white/10">
                                                <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Programa (por días)</div>
                                                <div className="space-y-2">
                                                    {(byEventDays?.[e.id]?.keys ?? []).map((day) => {
                                                        const openDay = openDayByEvent?.[e.id] ?? null;
                                                        const isOpen = openDay === day;
                                                        const items = byEventDays?.[e.id]?.map?.get(day) ?? [];

                                                        return (
                                                            <div key={day} className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
                                                                <button
                                                                    type="button"
                                                                    className="w-full px-4 py-3 flex items-center justify-between gap-4 text-left"
                                                                    onClick={() =>
                                                                        setOpenDayByEvent((prev) => ({ ...prev, [e.id]: prev?.[e.id] === day ? null : day }))
                                                                    }
                                                                >
                                                                    <div className="min-w-0">
                                                                        <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Día</div>
                                                                        <div className="font-black">{formatDMYFromYMD(day)}</div>
                                                                    </div>
                                                                    <FiChevronDown className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} size={18} />
                                                                </button>

                                                                {isOpen && (
                                                                    <div className="p-3 space-y-2 border-t border-white/10">
                                                                        {items.map((s) => (
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
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
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
    const start = new Date(startAt);
    const end = endAt ? new Date(endAt) : null;
    const startLabel = `${formatDMY(start)} ${formatTimeHM(start)}`;
    if (!end) return startLabel;
    const endLabel = `${formatDMY(end)} ${formatTimeHM(end)}`;
    return `${startLabel} → ${endLabel}`;
}

function formatDMYFromYMD(ymd) {
    const [yyyy, mm, dd] = String(ymd ?? '').split('-');
    if (!yyyy || !mm || !dd) return ymd;
    return `${dd}-${mm}-${yyyy}`;
}
