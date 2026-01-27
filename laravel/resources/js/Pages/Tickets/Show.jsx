import React, { useMemo, useState } from 'react';
import Layout from '@/Layouts/Layout';
import { Link, usePage } from '@inertiajs/react';
import { FiChevronDown } from 'react-icons/fi';
import { formatDMY, formatDMYFromYMD, formatTimeHM } from '@/utils/date';

export default function Show({ event }) {
    const { props } = usePage();
    const isAuthed = !!props?.auth?.user;

    const programByDay = useMemo(() => {
        const items = event?.program_items ?? [];
        const map = new Map();
        for (const item of items) {
            const key = item.day_date ?? 'unknown';
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(item);
        }
        const days = Array.from(map.entries())
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
            .map(([day, items]) => ({
                day,
                items,
            }));
        return days;
    }, [event?.program_items]);

    const [openDay, setOpenDay] = useState(programByDay[0]?.day ?? null);

    const startAt = event?.start_at ? new Date(event.start_at) : null;
    const endAt = event?.end_at ? new Date(event.end_at) : null;

    const dateRange = useMemo(() => {
        if (!startAt || !endAt) return null;
        return `${formatDMY(startAt)} – ${formatDMY(endAt)}`;
    }, [event?.start_at, event?.end_at]);

    return (
        <Layout>
            <div className="pt-32 pb-20 px-6">
                <div className="container mx-auto max-w-5xl">
                    <div className="glass-card p-8 md:p-10 border border-white/10 bg-white/5 overflow-hidden relative">
                        {event?.banner_url && (
                            <div className="absolute inset-0 opacity-30">
                                <img src={event.banner_url} alt="Banner" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="relative">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
                                <div className="min-w-0">
                                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">
                                        <span className="text-gradient">{event?.name}</span>
                                    </h1>
                                    {dateRange && <p className="text-gray-300 mt-3 font-medium">{dateRange}</p>}
                                    {event?.address && <p className="text-gray-500 mt-2">{event.address}</p>}
                                </div>
                                <div className="flex items-center gap-4">
                                    {event?.logo_url && (
                                        <div className="w-20 h-20 rounded-3xl border border-white/10 bg-black/30 overflow-hidden flex items-center justify-center">
                                            <img src={event.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                                        </div>
                                    )}
                                    <Link href="/events" className="btn-secondary px-6 py-3 text-sm">
                                        Volver
                                    </Link>
                                </div>
                            </div>

                            {event?.description && (
                                <div className="mt-8 text-gray-300 leading-relaxed whitespace-pre-line">{event.description}</div>
                            )}
                        </div>
                    </div>

                    {(event?.sponsors ?? []).length > 0 && (
                        <section className="mt-10">
                            <h2 className="text-xl font-black tracking-tight mb-4">Sponsors</h2>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {event.sponsors.map((s) => (
                                    <div key={s.id} className="glass-card p-4 border border-white/10 bg-white/5">
                                        <div className="aspect-square rounded-2xl bg-black/30 border border-white/10 overflow-hidden flex items-center justify-center">
                                            {s.logo_url ? <img src={s.logo_url} alt={s.name ?? 'Sponsor'} className="w-full h-full object-contain p-3" /> : null}
                                        </div>
                                        {s.name ? <div className="mt-2 text-xs text-gray-400 truncate">{s.name}</div> : null}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <section className="mt-10">
                        <h2 className="text-xl font-black tracking-tight mb-4">Programa</h2>
                        {!programByDay.length ? (
                            <div className="glass-card p-8 border border-white/10 bg-white/5 text-gray-400">
                                Programa disponible próximamente.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {programByDay.map((d) => (
                                    <div key={d.day} className="glass-card border border-white/10 bg-white/5 overflow-hidden">
                                        <button
                                            type="button"
                                            className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left"
                                            onClick={() => setOpenDay((cur) => (cur === d.day ? null : d.day))}
                                        >
                                            <div className="min-w-0">
                                                <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                                                    {formatDayLabel(d.day)}
                                                </div>
                                                <div className="text-lg font-black">{formatDayTitle(d.day)}</div>
                                            </div>
                                            <FiChevronDown className={`shrink-0 transition-transform ${openDay === d.day ? 'rotate-180' : ''}`} />
                                        </button>
                                        {openDay === d.day && (
                                            <div className="px-6 pb-6">
                                                <div className="space-y-4">
                                                    {d.items.map((item) => (
                                                        <div key={item.id} className="p-4 rounded-2xl border border-white/10 bg-black/30">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="min-w-0">
                                                                    <div className="font-black">{item.title}</div>
                                                                    {item.description ? <div className="text-gray-400 mt-2 whitespace-pre-line">{item.description}</div> : null}
                                                                </div>
                                                                {(item.start_time || item.end_time) && (
                                                                    <div className="shrink-0 text-xs font-bold uppercase tracking-widest text-gray-400">
                                                                        {formatTimeRange(item.start_time, item.end_time)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {(event?.subevents ?? []).length > 0 && (
                        <section className="mt-10">
                            <div className="flex items-end justify-between gap-4 mb-4">
                                <div>
                                    <h2 className="text-xl font-black tracking-tight">Subeventos</h2>
                                    <p className="text-sm text-gray-400">Estos subeventos pueden tener sus propios tickets.</p>
                                </div>
                                {!isAuthed && <div className="text-xs text-gray-500">Accede para comprar tickets</div>}
                            </div>
                            <div className="space-y-3">
                                {event.subevents.map((s) => (
                                    <div key={s.id} className="glass-card p-6 border border-white/10 bg-white/5">
                                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="text-lg font-black">{s.name}</div>
                                                {s.description ? <div className="text-gray-400 mt-2">{s.description}</div> : null}
                                                <div className="text-xs text-gray-500 mt-3">
                                                    {formatDateTimeRange(s.start_at, s.end_at)}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                {(s.ticket_types ?? []).length ? (
                                                    s.ticket_types.map((t) => (
                                                        <span key={t.id} className="text-[10px] uppercase tracking-widest font-bold border border-white/10 bg-black/30 rounded-lg px-3 py-2">
                                                            {t.code} • {t.price}€ • stock {t.stock}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-gray-500">Tickets próximamente</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </Layout>
    );
}

function formatDayLabel(day) {
    try {
        const d = new Date(`${day}T00:00:00`);
        return d.toLocaleDateString('es', { weekday: 'long' }).toUpperCase();
    } catch {
        return 'DÍA';
    }
}

function formatDayTitle(day) {
    try {
        return formatDMYFromYMD(day);
    } catch {
        return day;
    }
}

function formatTimeRange(start, end) {
    if (start && end) return `${start} – ${end}`;
    if (start) return start;
    if (end) return end;
    return '';
}

function formatDateTimeRange(startIso, endIso) {
    if (!startIso) return '';
    const start = new Date(startIso);
    const end = endIso ? new Date(endIso) : null;
    const d = formatDMY(start);
    const st = formatTimeHM(start);
    if (!end) return `${d} • ${st}`;
    const ed = formatDMY(end);
    const et = formatTimeHM(end);
    return `${d} ${st} – ${ed} ${et}`;
}
