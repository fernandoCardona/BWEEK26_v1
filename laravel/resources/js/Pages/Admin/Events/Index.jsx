import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Link, router } from '@inertiajs/react';
import { FiChevronDown, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { formatDMY, formatTimeHM } from '@/utils/date';

export default function Index({ events, can }) {
    const [openEventId, setOpenEventId] = useState(null);
    const [openDayByEvent, setOpenDayByEvent] = useState({});
    const [selectedSubeventByEvent, setSelectedSubeventByEvent] = useState({});

    const byEventDays = useMemo(() => {
        const out = {};
        for (const e of events ?? []) {
            const map = new Map();
            for (const s of e.subevents ?? []) {
                const key = s.event_date_ymd || (s.start_at ? String(s.start_at).slice(0, 10) : '') || '';
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
            out[e.id] = { map };
        }
        return out;
    }, [events]);

    const eventDaysById = useMemo(() => {
        const out = {};
        for (const e of events ?? []) {
            const startYmd = e.start_ymd;
            const endYmd = e.end_ymd;
            if (!startYmd || !endYmd) {
                out[e.id] = [];
                continue;
            }
            const days = [];
            const [sy, sm, sd] = String(startYmd).split('-').map((v) => Number(v));
            const [ey, em, ed] = String(endYmd).split('-').map((v) => Number(v));
            const cur = new Date(Date.UTC(sy, (sm ?? 1) - 1, sd ?? 1));
            const last = new Date(Date.UTC(ey, (em ?? 1) - 1, ed ?? 1));
            while (cur.getTime() <= last.getTime()) {
                days.push(cur.toISOString().slice(0, 10));
                cur.setUTCDate(cur.getUTCDate() + 1);
            }
            const disabled = new Set(e.disabled_days ?? []);
            out[e.id] = days.filter((d) => !disabled.has(d));
        }
        return out;
    }, [events]);

    useEffect(() => {
        if (!openEventId) return;
        const days = eventDaysById?.[openEventId] ?? [];
        const cur = openDayByEvent?.[openEventId] ?? null;
        if (cur && days.includes(cur)) return;
        const dayKeys = Array.from(byEventDays?.[openEventId]?.map?.keys?.() ?? []).filter(Boolean).sort();
        const firstWithSubevents = dayKeys.find((d) => days.includes(d)) ?? null;
        setOpenDayByEvent((prev) => ({ ...prev, [openEventId]: firstWithSubevents ?? days?.[0] ?? null }));
    }, [openEventId, eventDaysById]);

    const confirmAndDeleteDay = (eventId, day) => {
        if (!can?.manage_program) return;
        if (!window.confirm('¿Seguro que quieres eliminar este día y todos sus subeventos?')) return;
        router.delete(route('admin.events.days.destroy', [eventId, day]), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setOpenEventId(eventId);
                setOpenDayByEvent((prev) => ({ ...prev, [eventId]: null }));
                setSelectedSubeventByEvent((prev) => ({ ...prev, [eventId]: null }));
            },
        });
    };

    const confirmAndDeleteSubevent = (eventId, subeventId) => {
        if (!can?.manage_program) return;
        if (!window.confirm('¿Seguro que quieres eliminar este subevento?')) return;
        router.delete(route('admin.events.subevents.destroy', [eventId, subeventId]), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setOpenEventId(eventId);
                setSelectedSubeventByEvent((prev) => ({ ...prev, [eventId]: null }));
            },
        });
    };

    const openEvent = (eventId) => {
        const willOpen = openEventId !== eventId;
        setOpenEventId(willOpen ? eventId : null);
        setSelectedSubeventByEvent((prev) => ({ ...prev, [eventId]: null }));
        if (willOpen) {
            const allowedDays = eventDaysById?.[eventId] ?? [];
            const dayKeys = Array.from(byEventDays?.[eventId]?.map?.keys?.() ?? []).filter(Boolean).sort();
            const firstWithSubevents = dayKeys.find((d) => allowedDays.includes(d)) ?? null;
            const firstDay = firstWithSubevents ?? allowedDays?.[0] ?? null;
            setOpenDayByEvent((prev) => ({ ...prev, [eventId]: firstDay }));
        }
    };

    const openDay = (eventId, day) => {
        setSelectedSubeventByEvent((prev) => ({ ...prev, [eventId]: null }));
        setOpenDayByEvent((prev) => ({ ...prev, [eventId]: day }));
        if (typeof window !== 'undefined') {
            requestAnimationFrame(() => {
                document.getElementById(`day-${eventId}-${day}`)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
            });
        }
    };

    const toggleDay = (eventId, day) => {
        setSelectedSubeventByEvent((prev) => ({ ...prev, [eventId]: null }));
        setOpenDayByEvent((prev) => ({ ...prev, [eventId]: prev?.[eventId] === day ? null : day }));
    };

    const breadcrumb = useMemo(() => {
        const currentEvent = (events ?? []).find((e) => e.id === openEventId) ?? null;
        const currentDay = openEventId ? (openDayByEvent?.[openEventId] ?? null) : null;
        const currentSubeventId = openEventId ? (selectedSubeventByEvent?.[openEventId] ?? null) : null;
        const currentSubevent = currentSubeventId
            ? (byEventDays?.[openEventId]?.map?.get(currentDay ?? '') ?? []).find((s) => s.id === currentSubeventId) ??
              (currentEvent?.subevents ?? []).find((s) => s.id === currentSubeventId) ??
              null
            : null;

        return { currentEvent, currentDay, currentSubevent };
    }, [events, openEventId, openDayByEvent, selectedSubeventByEvent, byEventDays]);

    return (
        <AdminLayout active="events" headTitle="Admin • Events">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-12">
                    <div className="flex items-center justify-between mb-6">
                        <div className="min-w-0">
                            <h2 className="text-3xl font-black tracking-tight">Eventos</h2>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                                <button
                                    type="button"
                                    className="hover:text-white transition-colors font-bold"
                                    onClick={() => {
                                        setOpenEventId(null);
                                        setOpenDayByEvent({});
                                        setSelectedSubeventByEvent({});
                                    }}
                                >
                                    Evento general
                                </button>
                                {breadcrumb.currentEvent ? (
                                    <>
                                        <span className="text-gray-600">{'>'}</span>
                                        <button
                                            type="button"
                                            className="hover:text-white transition-colors font-bold truncate max-w-[40ch]"
                                            onClick={() => openEvent(breadcrumb.currentEvent.id)}
                                            title={breadcrumb.currentEvent.name}
                                        >
                                            {breadcrumb.currentEvent.name}
                                        </button>
                                    </>
                                ) : null}
                                {breadcrumb.currentEvent && breadcrumb.currentDay ? (
                                    <>
                                        <span className="text-gray-600">{'>'}</span>
                                        <button
                                            type="button"
                                            className="hover:text-white transition-colors font-bold"
                                            onClick={() => openDay(breadcrumb.currentEvent.id, breadcrumb.currentDay)}
                                        >
                                            {formatDMYFromYMD(breadcrumb.currentDay)}
                                        </button>
                                    </>
                                ) : null}
                                {breadcrumb.currentEvent && breadcrumb.currentSubevent ? (
                                    <>
                                        <span className="text-gray-600">{'>'}</span>
                                        <span className="text-white font-black truncate max-w-[40ch]" title={breadcrumb.currentSubevent.name}>
                                            {breadcrumb.currentSubevent.name}
                                        </span>
                                    </>
                                ) : null}
                            </div>
                        </div>
                        {can?.create_event && (
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
                                            <button
                                                type="button"
                                                className="min-w-0 text-left"
                                                onClick={() => openEvent(e.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-2.5 h-2.5 rounded-full ${e.is_active ? 'bg-accent-primary' : 'bg-white/20'}`} />
                                                    <p className="font-black text-lg truncate">{e.name}</p>
                                                </div>
                                                <p className="text-sm text-gray-400 mt-1">
                                                    {formatRange(e.start_at, e.end_at)} {e.address ? `• ${e.address}` : ''}
                                                </p>
                                            </button>
                                            <div className="flex items-center gap-3">
                                                {can?.create_event && (
                                                    <Link
                                                        href={`${route('admin.events.edit', e.id)}#program`}
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

                                        {openEventId === e.id ? (
                                            <div className="mt-5 pt-5 border-t border-white/10">
                                                <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Programa (por días)</div>
                                                <div className="space-y-2">
                                                    {(eventDaysById?.[e.id] ?? []).map((day) => {
                                                        const currentOpenDay = openDayByEvent?.[e.id] ?? null;
                                                        const isOpen = currentOpenDay === day;
                                                        const items = byEventDays?.[e.id]?.map?.get(day) ?? [];

                                                        return (
                                                            <div key={day} id={`day-${e.id}-${day}`} className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
                                                                <div className="w-full px-4 py-3 flex items-center justify-between gap-4">
                                                                    <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openDay(e.id, day)}>
                                                                        <div className="min-w-0">
                                                                            <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Día</div>
                                                                            <div className="font-black">{formatDMYFromYMD(day)}</div>
                                                                        </div>
                                                                    </button>
                                                                    <div className="flex items-center gap-2">
                                                                        {can?.manage_program && (
                                                                            <>
                                                                                <Link
                                                                                    href={`${route('admin.events.edit', e.id)}#day=${encodeURIComponent(day)}`}
                                                                                    className="icon-btn icon-btn-gradient"
                                                                                    aria-label="Editar día"
                                                                                >
                                                                                    <FiEdit2 size={23} />
                                                                                </Link>
                                                                                <button
                                                                                    type="button"
                                                                                    className="icon-btn icon-btn-gradient text-red-500 hover:text-red-400"
                                                                                    aria-label="Eliminar día"
                                                                                    onClick={() => confirmAndDeleteDay(e.id, day)}
                                                                                >
                                                                                    <FiTrash2 size={26} />
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                        <button
                                                                            type="button"
                                                                            className="icon-btn icon-btn-gradient"
                                                                            aria-label="Abrir/cerrar día"
                                                                            onClick={() => toggleDay(e.id, day)}
                                                                        >
                                                                            <FiChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} size={20} />
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {isOpen && (
                                                                    <div className="p-3 space-y-2 border-t border-white/10">
                                                                        {items.length ? (
                                                                            items.map((s) => (
                                                                                <div
                                                                                    key={s.id}
                                                                                    className={`p-3 rounded-2xl border border-white/10 transition-colors ${
                                                                                        selectedSubeventByEvent?.[e.id] === s.id ? 'bg-white/10' : 'hover:bg-white/5'
                                                                                    }`}
                                                                                    id={`subevent-${s.id}`}
                                                                                    role="button"
                                                                                    tabIndex={0}
                                                                                    onClick={() => {
                                                                                        setSelectedSubeventByEvent((prev) => ({ ...prev, [e.id]: s.id }));
                                                                                        if (typeof window !== 'undefined') {
                                                                                            requestAnimationFrame(() => {
                                                                                                document.getElementById(`subevent-${s.id}`)?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
                                                                                            });
                                                                                        }
                                                                                    }}
                                                                                    onKeyDown={(ev) => {
                                                                                        if (ev.key === 'Enter' || ev.key === ' ') {
                                                                                            setSelectedSubeventByEvent((prev) => ({ ...prev, [e.id]: s.id }));
                                                                                            if (typeof window !== 'undefined') {
                                                                                                requestAnimationFrame(() => {
                                                                                                    document.getElementById(`subevent-${s.id}`)?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
                                                                                                });
                                                                                            }
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <div className="flex items-start justify-between gap-4">
                                                                                        <div className="min-w-0">
                                                                                            <div className="flex items-center gap-3">
                                                                                                <span className={`w-2 h-2 rounded-full ${s.is_active ? 'bg-accent-primary' : 'bg-white/20'}`} />
                                                                                                <p className="font-bold text-sm truncate">{s.name}</p>
                                                                                            </div>
                                                                                            <p className="text-xs text-gray-500 mt-1 truncate">{formatRange(s.start_at, s.end_at)}</p>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <Link
                                                                                                href={`${route('admin.events.edit', e.id)}#day=${encodeURIComponent(
                                                                                                    (s.start_at ? String(s.start_at).slice(0, 10) : '') || (s.event_date ? String(s.event_date).slice(0, 10) : '')
                                                                                                )}&subevent=${encodeURIComponent(s.id)}`}
                                                                                                className="icon-btn icon-btn-gradient"
                                                                                                aria-label="Editar subevento"
                                                                                            >
                                                                                                <FiEdit2 size={23} />
                                                                                            </Link>
                                                                                            {can?.manage_program && (
                                                                                                <button
                                                                                                    type="button"
                                                                                                    className="icon-btn icon-btn-gradient text-red-500 hover:text-red-400"
                                                                                                    aria-label="Eliminar subevento"
                                                                                                    onClick={() => confirmAndDeleteSubevent(e.id, s.id)}
                                                                                                >
                                                                                                    <FiTrash2 size={26} />
                                                                                                </button>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ))
                                                                        ) : (
                                                                            <div className="text-gray-500 text-sm px-1 py-2">Sin subeventos para este día.</div>
                                                                        )}
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
