import React, { useEffect, useMemo, useRef, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { router, useForm } from '@inertiajs/react';
import useLockBodyScroll from '@/hooks/useLockBodyScroll';
import { FiChevronDown, FiPlus, FiTrash2 } from 'react-icons/fi';
import { computeEndDay, formatDMYFromYMD, normalizeTimeHM } from '@/utils/date';

export default function Edit({ event, parents, defaults, can }) {
    const isCreate = !event;
    const [confirmDialog, setConfirmDialog] = useState(null);
    useLockBodyScroll(!!confirmDialog);
    const ticketTypes = event?.ticket_types ?? [];
    const [openProgramDay, setOpenProgramDay] = useState(null);
    const [openProgramItem, setOpenProgramItem] = useState(null);
    const [subeventMode, setSubeventMode] = useState(!!(defaults?.parent_event_id ?? event?.parent_event_id));

    const getHashDay = () => {
        if (typeof window === 'undefined') return null;
        const h = String(window.location.hash || '').replace(/^#/, '');
        const m = h.match(/day=(\d{4}-\d{2}-\d{2})/);
        return m?.[1] ?? null;
    };

    const initialStart = event?.start_at ? new Date(event.start_at) : null;
    const initialEnd = event?.end_at ? new Date(event.end_at) : null;

    const bannerInputRef = useRef(null);
    const logoInputRef = useRef(null);
    const flyerInputRef = useRef(null);
    const sponsorInputRef = useRef(null);

    const form = useForm({
        parent_event_id: defaults?.parent_event_id ?? event?.parent_event_id ?? '',
        name: event?.name ?? '',
        description: event?.description ?? '',
        address: event?.address ?? '',
        location: event?.location ?? '',
        google_maps_url: event?.google_maps_url ?? '',
        external_ticket_url: event?.external_ticket_url ?? '',
        start_date: initialStart ? formatDateYMD(initialStart) : '',
        end_date: initialEnd ? formatDateYMD(initialEnd) : '',
        start_time: initialStart ? formatTimeHM(initialStart) : '',
        end_time: initialEnd ? formatTimeHM(initialEnd) : '',
        is_active: event?.is_active ?? true,
        banner: null,
        logo: null,
        flyer: null,
    });

    useEffect(() => {
        const start = event?.start_at ? new Date(event.start_at) : null;
        const end = event?.end_at ? new Date(event.end_at) : null;
        setSubeventMode(!!(defaults?.parent_event_id ?? event?.parent_event_id));
        form.setData(() => ({
            parent_event_id: defaults?.parent_event_id ?? event?.parent_event_id ?? '',
            name: event?.name ?? '',
            description: event?.description ?? '',
            address: event?.address ?? '',
            location: event?.location ?? '',
            google_maps_url: event?.google_maps_url ?? '',
            external_ticket_url: event?.external_ticket_url ?? '',
            start_date: start ? formatDateYMD(start) : '',
            end_date: end ? formatDateYMD(end) : '',
            start_time: start ? formatTimeHM(start) : '',
            end_time: end ? formatTimeHM(end) : '',
            is_active: event?.is_active ?? true,
            banner: null,
            logo: null,
            flyer: null,
        }));
        form.clearErrors();
    }, [event?.id, defaults?.parent_event_id]);

    const sponsorForm = useForm({
        name: '',
        website_url: '',
        logo: null,
    });

    const subeventForm = useForm({
        day_date: '',
        start_time: '',
        end_time: '',
        name: '',
        description: '',
        location: '',
        address: '',
        google_maps_url: '',
        external_ticket_url: '',
        flyer: null,
        is_active: true,
        tickets_enabled: false,
        ticket_code: 'vip',
        ticket_price: '',
        ticket_stock: 0,
        ticket_external_purchase_url: '',
        ticket_image: null,
    });

    const ticketTypeForm = useForm({
        code: '',
        price: '',
        stock: 0,
        external_purchase_url: '',
        image: null,
        is_active: true,
    });

    const [ticketTypeEdits, setTicketTypeEdits] = useState({});
    const [ticketTypeImages, setTicketTypeImages] = useState({});
    const ticketTypeInputRefs = useRef({});

    useEffect(() => {
        const next = {};
        for (const t of ticketTypes ?? []) {
            next[t.id] = {
                price: t.price ?? '',
                stock: t.stock ?? 0,
                external_purchase_url: t.external_purchase_url ?? '',
                is_active: t.is_active ?? true,
            };
        }
        setTicketTypeEdits(next);
        setTicketTypeImages({});
    }, [event?.id, ticketTypes.length]);

    const bannerPreview = useMemo(() => {
        if (form.data.banner instanceof File) return URL.createObjectURL(form.data.banner);
        return event?.banner_url ?? null;
    }, [form.data.banner, event?.banner_url]);

    const logoPreview = useMemo(() => {
        if (form.data.logo instanceof File) return URL.createObjectURL(form.data.logo);
        return event?.logo_url ?? null;
    }, [form.data.logo, event?.logo_url]);

    const flyerPreview = useMemo(() => {
        if (form.data.flyer instanceof File) return URL.createObjectURL(form.data.flyer);
        return event?.flyer_url ?? null;
    }, [form.data.flyer, event?.flyer_url]);

    const flyerName = useMemo(() => {
        if (form.data.flyer instanceof File) return form.data.flyer.name;
        return event?.flyer_url ? 'Flyer cargado' : 'Ningún archivo seleccionado';
    }, [form.data.flyer, event?.flyer_url]);

    const sponsorPreview = useMemo(() => {
        if (sponsorForm.data.logo instanceof File) return URL.createObjectURL(sponsorForm.data.logo);
        return null;
    }, [sponsorForm.data.logo]);

    const [sponsorAddOpen, setSponsorAddOpen] = useState(false);
    const [sponsorEdits, setSponsorEdits] = useState({});

    useEffect(() => {
        const next = {};
        for (const s of event?.sponsors ?? []) {
            next[s.id] = {
                name: s.name ?? '',
                website_url: s.website_url ?? '',
            };
        }
        setSponsorEdits(next);
    }, [event?.id, event?.sponsors]);

    useEffect(() => {
        if (!event) return;
        const hashDay = getHashDay();
        if (hashDay) {
            setOpenProgramDay(hashDay);
            setOpenProgramItem(null);
            return;
        }
        if (!event?.start_at) return;
        const d = new Date(event.start_at);
        const key = d.toISOString().slice(0, 10);
        setOpenProgramDay(key);
        setOpenProgramItem(null);
    }, [event?.id, event?.start_at]);

    const openConfirm = ({ title, message, confirmLabel, confirmVariant, onConfirm }) => {
        setConfirmDialog({
            title,
            message,
            confirmLabel: confirmLabel ?? 'Confirmar',
            confirmVariant: confirmVariant ?? 'primary',
            onConfirm,
        });
    };

    const saveEvent = () => {
        const normalizeTimes = (data) => ({
            ...data,
            start_time: data.start_time && String(data.start_time).length === 5 ? `${data.start_time}:00` : data.start_time,
            end_time: data.end_time && String(data.end_time).length === 5 ? `${data.end_time}:00` : data.end_time,
        });
        if (isCreate) {
            form.transform(normalizeTimes).post(route('admin.events.store'), {
                forceFormData: true,
                preserveScroll: true,
                onFinish: () => form.transform((d) => d),
            });
            return;
        }
        form.transform((data) => ({ ...normalizeTimes(data), _method: 'patch' })).post(route('admin.events.update', event.id), {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => form.transform((d) => d),
        });
    };

    const submitSponsor = () => {
        if (!event) return;
        sponsorForm.post(route('admin.events.sponsors.store', event.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                sponsorForm.reset();
                sponsorForm.clearErrors();
                setSponsorAddOpen(false);
            },
        });
    };

    const deleteSponsor = (sponsorId) => {
        if (!event) return;
        openConfirm({
            title: 'Eliminar sponsor',
            message: 'Esta acción es permanente. ¿Seguro que quieres eliminar este sponsor?',
            confirmLabel: 'Eliminar',
            confirmVariant: 'danger',
            onConfirm: () => router.delete(route('admin.events.sponsors.destroy', [event.id, sponsorId]), { preserveScroll: true }),
        });
    };

    const openCreateSubevent = (dayDate) => {
        if (!event || !dayDate) return;
        if (typeof window !== 'undefined') window.location.hash = `day=${dayDate}`;
        subeventForm.reset();
        subeventForm.setData({
            day_date: dayDate || '',
            start_time: '',
            end_time: '',
            name: '',
            description: '',
            location: form.data.location || '',
            address: form.data.address || '',
            google_maps_url: form.data.google_maps_url || '',
            external_ticket_url: '',
            is_active: true,
            flyer: null,
            tickets_enabled: false,
            ticket_code: 'vip',
            ticket_price: '',
            ticket_stock: 0,
            ticket_external_purchase_url: '',
            ticket_image: null,
        });
        subeventForm.clearErrors();
        setOpenProgramDay(dayDate);
        setOpenProgramItem('new');
    };

    const submitSubevent = () => {
        if (!event) return;
        if (typeof window !== 'undefined' && subeventForm.data.day_date) window.location.hash = `day=${subeventForm.data.day_date}`;
        subeventForm.post(route('admin.events.subevents.store', event.id), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                subeventForm.reset();
                subeventForm.clearErrors();
                setOpenProgramItem(null);
            },
        });
    };

    const saveSubeventChanges = (subeventId) => {
        if (!event) return;
        const payload = subeventEdits?.[subeventId];
        if (!payload?.day_date) return;

        if (typeof window !== 'undefined') window.location.hash = `day=${payload.day_date}`;

        const startDmy = formatDMYFromYMD(payload.day_date);
        const start = payload.start_time ? normalizeTimeHM(payload.start_time) : null;
        const end = payload.end_time ? normalizeTimeHM(payload.end_time) : null;
        const endYmd = start && end ? computeEndDay(payload.day_date, start, end) : payload.day_date;
        const endDmy = formatDMYFromYMD(endYmd);

        router.patch(
            route('admin.events.update', subeventId),
            {
                parent_event_id: event.id,
                name: payload.name ?? '',
                description: payload.description ?? '',
                address: payload.address ?? '',
                location: payload.location ?? '',
                google_maps_url: payload.google_maps_url ?? '',
                external_ticket_url: payload.external_ticket_url ?? '',
                start_date: startDmy,
                end_date: endDmy,
                start_time: start ? `${start}:00` : null,
                end_time: end ? `${end}:00` : null,
                is_active: payload.is_active ? 1 : 0,
            },
            { preserveScroll: true }
        );
    };

    const deleteSubevent = (subeventId) => {
        if (!event) return;
        openConfirm({
            title: 'Eliminar subevento',
            message: 'Esta acción es permanente. También elimina sus tickets e imágenes. ¿Seguro que quieres eliminarlo?',
            confirmLabel: 'Eliminar',
            confirmVariant: 'danger',
            onConfirm: () => router.delete(route('admin.events.subevents.destroy', [event.id, subeventId]), { preserveScroll: true }),
        });
    };

    const deleteDay = (dayDate) => {
        if (!event) return;
        openConfirm({
            title: 'Eliminar día',
            message: 'Esta acción es permanente. Se eliminarán todos los subeventos del día y sus imágenes. ¿Seguro que quieres eliminarlo?',
            confirmLabel: 'Eliminar',
            confirmVariant: 'danger',
            onConfirm: () => router.delete(route('admin.events.days.destroy', [event.id, dayDate]), { preserveScroll: true }),
        });
    };

    const [subeventEdits, setSubeventEdits] = useState({});
    const [subeventTicketsEnabled, setSubeventTicketsEnabled] = useState({});
    const [ticketDrafts, setTicketDrafts] = useState({});

    useEffect(() => {
        const nextEdits = {};
        const nextTickets = {};
        const nextTicketDrafts = {};
        for (const s of event?.subevents ?? []) {
            const startIso = s.start_at;
            const endIso = s.end_at;
            const start = startIso ? new Date(startIso) : null;
            const end = endIso ? new Date(endIso) : null;
            const day = s.event_date_ymd || (start ? start.toISOString().slice(0, 10) : '');
            nextEdits[s.id] = {
                day_date: day,
                start_time: start ? start.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '',
                end_time: end ? end.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '',
                name: s.name ?? '',
                description: s.description ?? '',
                location: s.location ?? '',
                address: s.address ?? '',
                google_maps_url: s.google_maps_url ?? '',
                external_ticket_url: s.external_ticket_url ?? '',
                is_active: s.is_active ?? true,
            };
            nextTickets[s.id] = (s.ticket_types?.length ?? 0) > 0;
            nextTicketDrafts[s.id] = { code: 'vip', price: '', stock: 0, external_purchase_url: '', image: null };
        }
        setSubeventEdits(nextEdits);
        setSubeventTicketsEnabled(nextTickets);
        setTicketDrafts(nextTicketDrafts);
    }, [event?.id, event?.subevents]);

    const subeventsByDay = useMemo(() => {
        const map = new Map();
        for (const s of event?.subevents ?? []) {
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
        return map;
    }, [event?.subevents]);

    const eventDays = useMemo(() => {
        const startYmd = event?.start_ymd;
        const endYmd = event?.end_ymd;
        if (!startYmd || !endYmd) return [];
        const days = [];
        const [sy, sm, sd] = startYmd.split('-').map((v) => Number(v));
        const [ey, em, ed] = endYmd.split('-').map((v) => Number(v));
        const cur = new Date(Date.UTC(sy, (sm ?? 1) - 1, sd ?? 1));
        const last = new Date(Date.UTC(ey, (em ?? 1) - 1, ed ?? 1));
        while (cur.getTime() <= last.getTime()) {
            days.push(cur.toISOString().slice(0, 10));
            cur.setUTCDate(cur.getUTCDate() + 1);
        }
        const disabled = new Set(event?.disabled_days ?? []);
        return days.filter((d) => !disabled.has(d));
    }, [event?.start_ymd, event?.end_ymd]);

    const submitTicketType = () => {
        if (!event) return;
        ticketTypeForm.post(route('admin.events.ticket-types.upsert', event.id), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                ticketTypeForm.reset();
                ticketTypeForm.clearErrors();
            },
        });
    };

    const deleteTicketType = (ticketTypeId) => {
        if (!event) return;
        openConfirm({
            title: 'Eliminar ticket',
            message: 'Esta acción es permanente. ¿Seguro que quieres eliminar este ticket?',
            confirmLabel: 'Eliminar',
            confirmVariant: 'danger',
            onConfirm: () => router.delete(route('admin.events.ticket-types.destroy', [event.id, ticketTypeId]), { preserveScroll: true }),
        });
    };

    const deleteTicketTypeImage = (ticketTypeId) => {
        if (!event) return;
        openConfirm({
            title: 'Eliminar imagen del ticket',
            message: '¿Seguro que quieres eliminar la imagen de este ticket?',
            confirmLabel: 'Eliminar',
            confirmVariant: 'danger',
            onConfirm: () => router.delete(route('admin.events.ticket-types.image.destroy', [event.id, ticketTypeId]), { preserveScroll: true }),
        });
    };

    const saveTicketType = (t) => {
        if (!event) return;
        const ed = ticketTypeEdits?.[t.id] ?? {};
        const img = ticketTypeImages?.[t.id] ?? null;
        const payload = {
            code: t.code,
            price: ed.price ?? t.price ?? 0,
            stock: ed.stock ?? t.stock ?? 0,
            external_purchase_url: ed.external_purchase_url ?? t.external_purchase_url ?? '',
            is_active: ed.is_active ? 1 : 0,
            image: img,
        };
        openConfirm({
            title: 'Guardar ticket',
            message: '¿Quieres guardar los cambios de este ticket?',
            confirmLabel: 'Guardar',
            confirmVariant: 'primary',
            onConfirm: () =>
                router.post(route('admin.events.ticket-types.upsert', event.id), payload, {
                    preserveScroll: true,
                    forceFormData: true,
                    onSuccess: () => setTicketTypeImages((prev) => ({ ...prev, [t.id]: null })),
                }),
        });
    };

    const destroy = () => {
        if (!event) return;
        router.delete(route('admin.events.destroy', event.id));
    };

    const confirmSaveEvent = () => {
        openConfirm({
            title: 'Guardar cambios',
            message: '¿Quieres guardar los cambios de este evento?',
            confirmLabel: 'Guardar',
            confirmVariant: 'primary',
            onConfirm: saveEvent,
        });
    };

    const confirmSaveSubevent = (subeventId) => {
        openConfirm({
            title: 'Guardar subevento',
            message: '¿Quieres guardar los cambios de este subevento?',
            confirmLabel: 'Guardar',
            confirmVariant: 'primary',
            onConfirm: () => saveSubeventChanges(subeventId),
        });
    };

    const confirmSaveDay = (dayDate, daySubevents) => {
        openConfirm({
            title: 'Guardar día',
            message: '¿Quieres guardar los cambios de este día?',
            confirmLabel: 'Guardar',
            confirmVariant: 'primary',
            onConfirm: () => {
                if (!event) return;
                const payload = (daySubevents ?? []).map((s, i) => {
                    const ed = subeventEdits?.[s.id] ?? {};
                    return {
                        id: s.id,
                        day_date: ed.day_date ?? dayDate,
                        start_time: ed.start_time ? normalizeTimeHM(ed.start_time) : null,
                        end_time: ed.end_time ? normalizeTimeHM(ed.end_time) : null,
                        name: ed.name ?? s.name ?? '',
                        description: ed.description ?? '',
                        location: ed.location ?? '',
                        address: ed.address ?? '',
                        google_maps_url: ed.google_maps_url ?? '',
                        external_ticket_url: ed.external_ticket_url ?? '',
                        is_active: (ed.is_active ?? true) ? 1 : 0,
                        sort_order: i,
                    };
                });
                router.patch(route('admin.events.days.update', [event.id, dayDate]), { subevents: payload }, { preserveScroll: true });
            },
        });
    };

    return (
        <AdminLayout active="events" headTitle={`Admin • ${isCreate ? 'Crear evento' : 'Editar evento'}`}>
            <div className="w-full">
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="min-w-0">
                        <h2 className="text-3xl font-black tracking-tight">{isCreate ? 'Crear evento' : 'Editar evento'}</h2>
                        <p className="text-gray-400">{isCreate ? 'Configura la información del evento.' : 'Actualiza la información del evento.'}</p>
                    </div>
                </div>

                <div className="glass-card p-6">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Tipo</label>
                                <div className="space-y-3">
                                    <Toggle
                                        checked={!!subeventMode}
                                        disabled={!can?.toggle_active}
                                        onChange={(checked) => {
                                            setSubeventMode(checked);
                                            if (!checked) {
                                                form.setData('parent_event_id', '');
                                                return;
                                            }
                                            if (defaults?.parent_event_id) {
                                                form.setData('parent_event_id', defaults.parent_event_id);
                                            }
                                        }}
                                        label={subeventMode ? 'Subevento' : 'Evento principal'}
                                    />
                                    {!!subeventMode && (
                                        <CustomSelect
                                            label="Evento principal"
                                            value={form.data.parent_event_id}
                                            disabled={!can?.toggle_active}
                                            error={form.errors.parent_event_id}
                                            options={[
                                                { value: '', label: 'Selecciona un evento' },
                                                ...(parents ?? []).map((p) => ({ value: p.id, label: p.name?.es || p.name?.en || p.id })),
                                            ]}
                                            onChange={(val) => form.setData('parent_event_id', val)}
                                        />
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Activo</label>
                                <div className="flex items-center justify-end gap-5">
                                    <label className="inline-flex items-center gap-3 text-sm text-gray-300 select-none">
                                        <span className="text-xs text-gray-400">{form.data.is_active ? 'Activo' : 'Inactivo'}</span>
                                        <span className="relative inline-flex items-center">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={!!form.data.is_active}
                                                disabled={!can?.toggle_active}
                                                onChange={(e) => form.setData('is_active', e.target.checked)}
                                            />
                                            <span className="w-11 h-6 bg-white/10 border border-white/10 rounded-full peer peer-checked:bg-accent-primary/60 peer-checked:border-accent-primary/40 transition-colors" />
                                            <span className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                                        </span>
                                    </label>
                                    {!isCreate && can?.delete && (
                                        <button
                                            type="button"
                                            className="px-6 py-3 text-sm rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white transition-colors"
                                            onClick={() =>
                                                openConfirm({
                                                    title: 'Eliminar evento',
                                                    message: 'Esta acción es permanente. ¿Seguro que quieres eliminar este evento?',
                                                    confirmLabel: 'Eliminar',
                                                    confirmVariant: 'danger',
                                                    onConfirm: destroy,
                                                })
                                            }
                                        >
                                            Eliminar
                                        </button>
                                    )}
                                </div>
                                {form.errors.is_active && <div className="text-xs text-red-400 mt-1">{form.errors.is_active}</div>}
                            </div>
                        </div>

                        <Field label="Nombre del evento" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} error={form.errors.name} />
                        <TextArea
                            label="Descripción"
                            value={form.data.description}
                            onChange={(e) => form.setData('description', e.target.value)}
                            error={form.errors.description}
                        />
                        <Field label="Dirección" value={form.data.address} onChange={(e) => form.setData('address', e.target.value)} error={form.errors.address} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field
                                label="Localización (pueblo/ciudad, país)"
                                value={form.data.location}
                                onChange={(e) => form.setData('location', e.target.value)}
                                error={form.errors.location}
                                placeholder="Sitges, España"
                            />
                            <Field
                                label="URL Google Maps (opcional)"
                                value={form.data.google_maps_url}
                                onChange={(e) => form.setData('google_maps_url', e.target.value)}
                                error={form.errors.google_maps_url}
                                placeholder="https://maps.google.com/..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field
                                label="Fecha inicio"
                                type="date"
                                value={form.data.start_date}
                                onChange={(e) => form.setData('start_date', e.target.value)}
                                error={form.errors.start_date}
                            />
                            <Field
                                label="Fecha fin"
                                type="date"
                                value={form.data.end_date}
                                onChange={(e) => form.setData('end_date', e.target.value)}
                                error={form.errors.end_date}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field
                                label="Hora inicio"
                                type="time"
                                value={form.data.start_time}
                                onChange={(e) => form.setData('start_time', e.target.value)}
                                error={form.errors.start_time}
                            />
                            <Field
                                label="Hora fin"
                                type="time"
                                value={form.data.end_time}
                                onChange={(e) => form.setData('end_time', e.target.value)}
                                error={form.errors.end_time}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <FilePicker
                                label="Banner"
                                previewUrl={bannerPreview}
                                buttonText="Seleccionar banner"
                                fileName={form.data.banner?.name || (event?.banner_url ? 'Banner cargado' : 'Ningún archivo seleccionado')}
                                inputRef={bannerInputRef}
                                onPick={() => bannerInputRef.current?.click()}
                                onFile={(f) => form.setData('banner', f)}
                                onRemove={
                                    event?.banner_url
                                        ? () =>
                                              openConfirm({
                                                  title: 'Eliminar banner',
                                                  message: '¿Seguro que quieres eliminar el banner?',
                                                  confirmLabel: 'Eliminar',
                                                  confirmVariant: 'danger',
                                                  onConfirm: () => router.delete(route('admin.events.banner.destroy', event.id), { preserveScroll: true }),
                                              })
                                        : null
                                }
                                error={form.errors.banner}
                                variant="banner"
                            />
                            <FilePicker
                                label="Logo"
                                previewUrl={logoPreview}
                                buttonText="Seleccionar logo"
                                fileName={form.data.logo?.name || (event?.logo_url ? 'Logo cargado' : 'Ningún archivo seleccionado')}
                                inputRef={logoInputRef}
                                onPick={() => logoInputRef.current?.click()}
                                onFile={(f) => form.setData('logo', f)}
                                onRemove={
                                    event?.logo_url
                                        ? () =>
                                              openConfirm({
                                                  title: 'Eliminar logo',
                                                  message: '¿Seguro que quieres eliminar el logo?',
                                                  confirmLabel: 'Eliminar',
                                                  confirmVariant: 'danger',
                                                  onConfirm: () => router.delete(route('admin.events.logo.destroy', event.id), { preserveScroll: true }),
                                              })
                                        : null
                                }
                                error={form.errors.logo}
                                variant="square"
                            />
                            <FilePicker
                                label="Flyer"
                                previewUrl={flyerPreview}
                                buttonText="Seleccionar flyer"
                                fileName={flyerName}
                                inputRef={flyerInputRef}
                                onPick={() => flyerInputRef.current?.click()}
                                onFile={(f) => form.setData('flyer', f)}
                                onRemove={
                                    event?.flyer_url
                                        ? () =>
                                              openConfirm({
                                                  title: 'Eliminar flyer',
                                                  message: '¿Seguro que quieres eliminar el flyer?',
                                                  confirmLabel: 'Eliminar',
                                                  confirmVariant: 'danger',
                                                  onConfirm: () => router.delete(route('admin.events.flyer.destroy', event.id), { preserveScroll: true }),
                                              })
                                        : null
                                }
                                error={form.errors.flyer}
                                variant="banner"
                            />
                        </div>

                        {!isCreate && (
                            <div className="pt-2">
                                <div className="glass-card p-6 border border-white/10 bg-white/5">
                                    <div className="flex items-center justify-between gap-4 mb-6">
                                        <div>
                                            <h3 className="text-xl font-bold">Sponsors</h3>
                                            <p className="text-sm text-gray-400">Logos de patrocinadores asociados al evento.</p>
                                        </div>
                                        {can?.delete && (
                                            <button type="button" className="btn-secondary px-5 py-3 text-sm" onClick={() => setSponsorAddOpen((o) => !o)}>
                                                <span className="inline-flex items-center gap-2">
                                                    <FiPlus size={16} /> Añadir sponsor
                                                </span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        {(event?.sponsors ?? []).map((s) => (
                                            <div key={s.id} className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                                                <div className="w-24 h-24 rounded-2xl border border-white/10 bg-black/30 overflow-hidden flex items-center justify-center shrink-0">
                                                    {s.logo_url ? <img src={s.logo_url} alt={s.name ?? 'Sponsor'} className="w-full h-full object-contain p-3" /> : null}
                                                </div>
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                                    <Field
                                                        label="Nombre"
                                                        value={sponsorEdits?.[s.id]?.name ?? ''}
                                                        onChange={(e) => setSponsorEdits((prev) => ({ ...prev, [s.id]: { ...(prev?.[s.id] ?? {}), name: e.target.value } }))}
                                                        error={null}
                                                        placeholder="Sponsor"
                                                    />
                                                    <Field
                                                        label="URL web (opcional)"
                                                        value={sponsorEdits?.[s.id]?.website_url ?? ''}
                                                        onChange={(e) => setSponsorEdits((prev) => ({ ...prev, [s.id]: { ...(prev?.[s.id] ?? {}), website_url: e.target.value } }))}
                                                        error={null}
                                                        placeholder="https://..."
                                                    />
                                                </div>
                                                <div className="flex items-center gap-3 md:flex-col md:items-end">
                                                    {can?.delete && (
                                                        <button
                                                            type="button"
                                                            className="icon-btn icon-btn-gradient"
                                                            aria-label="Eliminar sponsor"
                                                            onClick={() => deleteSponsor(s.id)}
                                                        >
                                                            <FiTrash2 size={18} />
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="btn-secondary px-5 py-3 text-sm"
                                                        onClick={() => {
                                                            if (!event) return;
                                                            const payload = sponsorEdits?.[s.id] ?? { name: '', website_url: '' };
                                                            openConfirm({
                                                                title: 'Guardar sponsor',
                                                                message: '¿Quieres guardar los cambios de este sponsor?',
                                                                confirmLabel: 'Guardar',
                                                                confirmVariant: 'primary',
                                                                onConfirm: () => router.patch(route('admin.events.sponsors.update', [event.id, s.id]), payload, { preserveScroll: true }),
                                                            });
                                                        }}
                                                    >
                                                        Guardar
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {!((event?.sponsors ?? []).length) && <div className="text-gray-400">Todavía no hay sponsors.</div>}
                                    </div>

                                    {can?.delete && sponsorAddOpen && (
                                        <div className="p-5 bg-black/30 rounded-2xl border border-white/10">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Field
                                                    label="Nombre"
                                                    value={sponsorForm.data.name}
                                                    onChange={(e) => sponsorForm.setData('name', e.target.value)}
                                                    error={sponsorForm.errors.name}
                                                    placeholder="Sponsor"
                                                />
                                                <Field
                                                    label="URL web (opcional)"
                                                    value={sponsorForm.data.website_url}
                                                    onChange={(e) => sponsorForm.setData('website_url', e.target.value)}
                                                    error={sponsorForm.errors.website_url}
                                                    placeholder="https://..."
                                                />
                                            </div>
                                            <div className="mt-4">
                                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Logo</label>
                                                <input ref={sponsorInputRef} type="file" className="hidden" onChange={(e) => sponsorForm.setData('logo', e.target.files?.[0] ?? null)} />
                                                <div className="flex items-center gap-4">
                                                    <div className="w-28 h-28 rounded-2xl border border-white/10 bg-black/30 overflow-hidden flex items-center justify-center">
                                                        {sponsorPreview ? <img src={sponsorPreview} alt="Preview" className="w-full h-full object-contain p-3" /> : <span className="text-xs text-gray-600">Logo</span>}
                                                    </div>
                                                    <div className="flex-1 flex flex-col gap-3">
                                                        <button type="button" className="btn-secondary px-6 py-3 text-sm w-fit" onClick={() => sponsorInputRef.current?.click()}>
                                                            Seleccionar logo
                                                        </button>
                                                        {sponsorForm.errors.logo && <div className="text-xs text-red-400">{sponsorForm.errors.logo}</div>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-5 flex items-center justify-end gap-3">
                                                <button type="button" className="btn-secondary px-6 py-3 text-sm" onClick={() => setSponsorAddOpen(false)}>
                                                    Cancelar
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn-primary px-6 py-3 text-sm"
                                                    disabled={sponsorForm.processing}
                                                    onClick={() =>
                                                        openConfirm({
                                                            title: 'Guardar sponsor',
                                                            message: '¿Quieres guardar este sponsor?',
                                                            confirmLabel: 'Guardar',
                                                            confirmVariant: 'primary',
                                                            onConfirm: submitSponsor,
                                                        })
                                                    }
                                                >
                                                    Guardar sponsor
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="pt-2">
                            <div className="glass-card p-6 border border-white/10 bg-white/5">
                                <div className="flex items-center justify-between gap-4 mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold">Programa</h3>
                                        <p className="text-sm text-gray-400">Días del evento con subeventos (colapsable).</p>
                                    </div>
                                </div>

                                {!event ? (
                                    <div className="text-gray-400">Guarda el evento para poder gestionar el programa.</div>
                                ) : (
                                    <div className="space-y-3">
                                        {eventDays.map((day) => {
                                            const isOpen = openProgramDay === day;
                                            const daySubevents = subeventsByDay.get(day) ?? [];

                                            return (
                                                <div key={day} className="rounded-3xl border border-white/10 bg-black/30 overflow-hidden">
                                                    <div className="w-full px-6 py-5 flex items-center justify-between gap-4">
                                                        <button
                                                            type="button"
                                                            className="min-w-0 flex-1 text-left"
                                                            onClick={() => {
                                                                if (typeof window !== 'undefined') window.location.hash = `day=${day}`;
                                                                setOpenProgramDay((cur) => {
                                                                    const next = cur === day ? null : day;
                                                                    if (next) {
                                                                        openCreateSubevent(day);
                                                                    } else {
                                                                        setOpenProgramItem(null);
                                                                    }
                                                                    return next;
                                                                });
                                                            }}
                                                        >
                                                            <div>
                                                                <div className="text-xs font-black uppercase tracking-widest text-gray-500">Día</div>
                                                                <div className="text-lg font-black">{formatDMYFromYMD(day)}</div>
                                                            </div>
                                                        </button>
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                type="button"
                                                                className="icon-btn icon-btn-gradient bg-red-600/80 hover:bg-red-600"
                                                                aria-label="Eliminar día"
                                                                onClick={() => deleteDay(day)}
                                                            >
                                                                <FiTrash2 size={22} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="icon-btn icon-btn-gradient"
                                                                aria-label="Abrir/cerrar día"
                                                                onClick={() => {
                                                                    if (typeof window !== 'undefined') window.location.hash = `day=${day}`;
                                                                    setOpenProgramDay((cur) => {
                                                                        const next = cur === day ? null : day;
                                                                        if (next) {
                                                                            openCreateSubevent(day);
                                                                        } else {
                                                                            setOpenProgramItem(null);
                                                                        }
                                                                        return next;
                                                                    });
                                                                }}
                                                            >
                                                                <FiChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} size={20} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {isOpen && (
                                                        <div className="px-6 pb-6">
                                                            <div className="flex flex-wrap items-center justify-end gap-3 mb-4">
                                                                <button type="button" className="btn-secondary px-5 py-3 text-sm" onClick={() => openCreateSubevent(day)}>
                                                                    <span className="inline-flex items-center gap-2">
                                                                        <FiPlus size={16} /> Añadir subevento
                                                                    </span>
                                                                </button>
                                                                {daySubevents.length > 0 ? (
                                                                    <button
                                                                        type="button"
                                                                        className="btn-primary px-5 py-3 text-sm"
                                                                        onClick={() => confirmSaveDay(day, daySubevents)}
                                                                    >
                                                                        Guardar día
                                                                    </button>
                                                                ) : null}
                                                            </div>

                                                            <div className="space-y-3">
                                                                {openProgramItem === 'new' && openProgramDay === day && (
                                                                    <div className="p-5 rounded-3xl border border-white/10 bg-white/5">
                                                                        <div className="flex items-center justify-between gap-4 mb-4">
                                                                            <div className="font-black">Nuevo subevento</div>
                                                                        </div>

                                                                        <div className="space-y-4">
                                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                                <div>
                                                                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Inicio</label>
                                                                                    <input
                                                                                        type="time"
                                                                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3"
                                                                                        value={subeventForm.data.start_time}
                                                                                        onChange={(e) => subeventForm.setData('start_time', e.target.value)}
                                                                                    />
                                                                                    {subeventForm.errors.start_time && <div className="text-xs text-red-400 mt-1">{subeventForm.errors.start_time}</div>}
                                                                                </div>
                                                                                <div>
                                                                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Fin</label>
                                                                                    <input
                                                                                        type="time"
                                                                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3"
                                                                                        value={subeventForm.data.end_time}
                                                                                        onChange={(e) => subeventForm.setData('end_time', e.target.value)}
                                                                                    />
                                                                                    {subeventForm.errors.end_time && <div className="text-xs text-red-400 mt-1">{subeventForm.errors.end_time}</div>}
                                                                                </div>
                                                                                <div className="flex items-end justify-end">
                                                                                    <button type="button" className="btn-secondary px-6 py-3 text-sm" onClick={() => setOpenProgramItem(null)}>
                                                                                        Cancelar
                                                                                    </button>
                                                                                </div>
                                                                            </div>

                                                                            <Field
                                                                                label="Nombre"
                                                                                value={subeventForm.data.name}
                                                                                onChange={(e) => subeventForm.setData('name', e.target.value)}
                                                                                error={subeventForm.errors.name}
                                                                                placeholder="Nombre del subevento"
                                                                            />

                                                                            <TextArea
                                                                                label="Descripción"
                                                                                value={subeventForm.data.description}
                                                                                onChange={(e) => subeventForm.setData('description', e.target.value)}
                                                                                error={subeventForm.errors.description}
                                                                            />

                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                <Field
                                                                                    label="Localización"
                                                                                    value={subeventForm.data.location}
                                                                                    onChange={(e) => subeventForm.setData('location', e.target.value)}
                                                                                    error={subeventForm.errors.location}
                                                                                    placeholder="Sitges, España"
                                                                                />
                                                                                <Field
                                                                                    label="Dirección"
                                                                                    value={subeventForm.data.address}
                                                                                    onChange={(e) => subeventForm.setData('address', e.target.value)}
                                                                                    error={subeventForm.errors.address}
                                                                                    placeholder="Dirección"
                                                                                />
                                                                            </div>

                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                <Field
                                                                                    label="URL Google Maps (opcional)"
                                                                                    value={subeventForm.data.google_maps_url}
                                                                                    onChange={(e) => subeventForm.setData('google_maps_url', e.target.value)}
                                                                                    error={subeventForm.errors.google_maps_url}
                                                                                    placeholder="https://maps.google.com/..."
                                                                                />
                                                                                <Field
                                                                                    label="URL compra externa (opcional)"
                                                                                    value={subeventForm.data.external_ticket_url}
                                                                                    onChange={(e) => subeventForm.setData('external_ticket_url', e.target.value)}
                                                                                    error={subeventForm.errors.external_ticket_url}
                                                                                    placeholder="https://..."
                                                                                />
                                                                            </div>

                                                                            <div>
                                                                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Flyer del subevento (opcional)</label>
                                                                                <div className="flex items-center gap-4">
                                                                                    <div className="w-28 h-20 rounded-2xl border border-white/10 bg-black/40 overflow-hidden flex items-center justify-center">
                                                                                        {subeventForm.data.flyer instanceof File ? (
                                                                                            <img src={URL.createObjectURL(subeventForm.data.flyer)} alt="Flyer" className="w-full h-full object-cover" />
                                                                                        ) : (
                                                                                            <span className="text-xs text-gray-500">Sin</span>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="flex-1 flex flex-wrap items-center gap-3">
                                                                                        <input
                                                                                            id={`new-subevent-flyer-${day}`}
                                                                                            type="file"
                                                                                            className="hidden"
                                                                                            onChange={(e) => subeventForm.setData('flyer', e.target.files?.[0] ?? null)}
                                                                                        />
                                                                                        <button
                                                                                            type="button"
                                                                                            className="btn-secondary px-6 py-3 text-sm"
                                                                                            onClick={() => document.getElementById(`new-subevent-flyer-${day}`)?.click()}
                                                                                        >
                                                                                            Subir flyer
                                                                                        </button>
                                                                                        {subeventForm.data.flyer ? (
                                                                                            <button type="button" className="btn-secondary px-6 py-3 text-sm" onClick={() => subeventForm.setData('flyer', null)}>
                                                                                                Quitar flyer
                                                                                            </button>
                                                                                        ) : null}
                                                                                    </div>
                                                                                </div>
                                                                                {subeventForm.errors.flyer && <div className="text-xs text-red-400 mt-1">{subeventForm.errors.flyer}</div>}
                                                                            </div>

                                                                            <Toggle
                                                                                checked={!!subeventForm.data.tickets_enabled}
                                                                                onChange={(checked) => subeventForm.setData('tickets_enabled', checked)}
                                                                                label="Habilitar tickets para este subevento"
                                                                            />

                                                                            {subeventForm.data.tickets_enabled && (
                                                                                <div className="p-4 rounded-2xl border border-white/10 bg-black/30">
                                                                                    <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Crear ticket</div>
                                                                                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                                                                        <CustomSelect
                                                                                            label="Tipo"
                                                                                            value={subeventForm.data.ticket_code}
                                                                                            options={[
                                                                                                { value: 'vip', label: 'VIP' },
                                                                                                { value: 'standard', label: 'Standard' },
                                                                                            ]}
                                                                                            onChange={(val) => subeventForm.setData('ticket_code', val)}
                                                                                            error={subeventForm.errors.ticket_code}
                                                                                        />
                                                                                        <Field
                                                                                            label="Link compra (opcional)"
                                                                                            value={subeventForm.data.ticket_external_purchase_url}
                                                                                            onChange={(e) => subeventForm.setData('ticket_external_purchase_url', e.target.value)}
                                                                                            error={subeventForm.errors.ticket_external_purchase_url}
                                                                                            placeholder="https://..."
                                                                                        />
                                                                                        <Field
                                                                                            label="Precio (€)"
                                                                                            value={subeventForm.data.ticket_price}
                                                                                            onChange={(e) => subeventForm.setData('ticket_price', e.target.value)}
                                                                                            error={subeventForm.errors.ticket_price}
                                                                                            placeholder="0.00"
                                                                                        />
                                                                                        <Field
                                                                                            label="Stock"
                                                                                            value={subeventForm.data.ticket_stock}
                                                                                            onChange={(e) => subeventForm.setData('ticket_stock', e.target.value)}
                                                                                            error={subeventForm.errors.ticket_stock}
                                                                                            placeholder="0"
                                                                                        />
                                                                                        <div className="flex items-end">
                                                                                            <label className="btn-secondary px-6 py-3 text-sm w-full text-center cursor-pointer">
                                                                                                Imagen
                                                                                                <input
                                                                                                    type="file"
                                                                                                    className="hidden"
                                                                                                    onChange={(e) => subeventForm.setData('ticket_image', e.target.files?.[0] ?? null)}
                                                                                                />
                                                                                            </label>
                                                                                        </div>
                                                                                        <div className="flex items-end">
                                                                                            <button type="button" className="btn-primary w-full px-6 py-3 text-sm" disabled={subeventForm.processing} onClick={submitSubevent}>
                                                                                                Crear subevento + ticket
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            <div className="flex items-center justify-end gap-3 pt-2">
                                                                                {!subeventForm.data.tickets_enabled && (
                                                                                    <button type="button" className="btn-primary px-6 py-3 text-sm" disabled={subeventForm.processing} onClick={submitSubevent}>
                                                                                        Crear subevento
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {daySubevents.map((s) => {
                                                                    const isItemOpen = openProgramItem === `se:${s.id}`;
                                                                    const ed = subeventEdits?.[s.id];
                                                                    const ticketsEnabled = !!subeventTicketsEnabled?.[s.id];
                                                                    const ticketDraft = ticketDrafts?.[s.id] ?? { code: 'vip', price: '', stock: 0, external_purchase_url: '', image: null };
                                                                    const ticketImagePreview = ticketDraft?.image instanceof File ? URL.createObjectURL(ticketDraft.image) : null;

                                                                    return (
                                                                        <div key={s.id} className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
                                                                            <div className="w-full px-5 py-4 flex items-center justify-between gap-4">
                                                                                <button
                                                                                    type="button"
                                                                                    className="min-w-0 flex-1 text-left"
                                                                                    onClick={() => setOpenProgramItem((cur) => (cur === `se:${s.id}` ? null : `se:${s.id}`))}
                                                                                >
                                                                                    <div className="min-w-0">
                                                                                        <div className="font-black truncate">{s.name}</div>
                                                                                        <div className="text-xs text-gray-500 mt-1">
                                                                                            {formatIsoTimeRange(s.start_at, s.end_at)}
                                                                                            {(s.ticket_types?.length ?? 0) > 0 ? ' • tickets' : ''}
                                                                                            {s.external_ticket_url ? ' • externo' : ''}
                                                                                        </div>
                                                                                    </div>
                                                                                </button>
                                                                                    <div className="flex items-center gap-3">
                                                                                    <button
                                                                                        type="button"
                                                                                        className="icon-btn icon-btn-gradient bg-red-600/80 hover:bg-red-600"
                                                                                        aria-label="Eliminar subevento"
                                                                                        onClick={() => deleteSubevent(s.id)}
                                                                                    >
                                                                                            <FiTrash2 size={22} />
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        className="icon-btn icon-btn-gradient"
                                                                                        aria-label="Abrir/cerrar subevento"
                                                                                        onClick={() => setOpenProgramItem((cur) => (cur === `se:${s.id}` ? null : `se:${s.id}`))}
                                                                                    >
                                                                                        <FiChevronDown className={`transition-transform ${isItemOpen ? 'rotate-180' : ''}`} size={20} />
                                                                                    </button>
                                                                                </div>
                                                                            </div>

                                                                            {isItemOpen && (
                                                                                <div className="px-5 pb-5 space-y-4">
                                                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                                        <div>
                                                                                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Inicio</label>
                                                                                            <input
                                                                                                type="time"
                                                                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3"
                                                                                                value={ed?.start_time ?? ''}
                                                                                                onChange={(e) => setSubeventEdits((prev) => ({ ...prev, [s.id]: { ...(prev?.[s.id] ?? {}), start_time: e.target.value } }))}
                                                                                            />
                                                                                        </div>
                                                                                        <div>
                                                                                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Fin</label>
                                                                                            <input
                                                                                                type="time"
                                                                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3"
                                                                                                value={ed?.end_time ?? ''}
                                                                                                onChange={(e) => setSubeventEdits((prev) => ({ ...prev, [s.id]: { ...(prev?.[s.id] ?? {}), end_time: e.target.value } }))}
                                                                                            />
                                                                                        </div>
                                                                                        <div className="flex items-end justify-end">
                                                                                            <button
                                                                                                type="button"
                                                                                                className="btn-secondary px-6 py-3 text-sm"
                                                                                                onClick={() => confirmSaveSubevent(s.id)}
                                                                                            >
                                                                                                Guardar cambios
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>

                                                                                    <Field
                                                                                        label="Nombre"
                                                                                        value={ed?.name ?? ''}
                                                                                        onChange={(e) => setSubeventEdits((prev) => ({ ...prev, [s.id]: { ...(prev?.[s.id] ?? {}), name: e.target.value } }))}
                                                                                        error={null}
                                                                                    />
                                                                                    <TextArea
                                                                                        label="Descripción"
                                                                                        value={ed?.description ?? ''}
                                                                                        onChange={(e) => setSubeventEdits((prev) => ({ ...prev, [s.id]: { ...(prev?.[s.id] ?? {}), description: e.target.value } }))}
                                                                                        error={null}
                                                                                    />
                                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                        <Field
                                                                                            label="Localización"
                                                                                            value={ed?.location ?? ''}
                                                                                            onChange={(e) => setSubeventEdits((prev) => ({ ...prev, [s.id]: { ...(prev?.[s.id] ?? {}), location: e.target.value } }))}
                                                                                            error={null}
                                                                                        />
                                                                                        <Field
                                                                                            label="Dirección"
                                                                                            value={ed?.address ?? ''}
                                                                                            onChange={(e) => setSubeventEdits((prev) => ({ ...prev, [s.id]: { ...(prev?.[s.id] ?? {}), address: e.target.value } }))}
                                                                                            error={null}
                                                                                        />
                                                                                    </div>
                                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                        <Field
                                                                                            label="URL Google Maps (opcional)"
                                                                                            value={ed?.google_maps_url ?? ''}
                                                                                            onChange={(e) => setSubeventEdits((prev) => ({ ...prev, [s.id]: { ...(prev?.[s.id] ?? {}), google_maps_url: e.target.value } }))}
                                                                                            error={null}
                                                                                            placeholder="https://maps.google.com/..."
                                                                                        />
                                                                                        <Field
                                                                                            label="URL compra externa (opcional)"
                                                                                            value={ed?.external_ticket_url ?? ''}
                                                                                            onChange={(e) => setSubeventEdits((prev) => ({ ...prev, [s.id]: { ...(prev?.[s.id] ?? {}), external_ticket_url: e.target.value } }))}
                                                                                            error={null}
                                                                                            placeholder="https://..."
                                                                                        />
                                                                                    </div>

                                                                                    <div>
                                                                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Flyer del subevento (opcional)</label>
                                                                                        <div className="flex items-center gap-4">
                                                                                            <div className="w-28 h-20 rounded-2xl border border-white/10 bg-black/40 overflow-hidden flex items-center justify-center">
                                                                                                {s.flyer_url ? <img src={s.flyer_url} alt="Flyer" className="w-full h-full object-cover" /> : <span className="text-xs text-gray-500">Sin</span>}
                                                                                            </div>
                                                                                            <div className="flex-1 flex flex-wrap items-center gap-3">
                                                                                                <input
                                                                                                    id={`subevent-flyer-${s.id}`}
                                                                                                    type="file"
                                                                                                    className="hidden"
                                                                                                    onChange={(e) => router.post(route('admin.events.flyer.store', s.id), { flyer: e.target.files?.[0] ?? null }, { preserveScroll: true, forceFormData: true })}
                                                                                                />
                                                                                                <button type="button" className="btn-secondary px-6 py-3 text-sm" onClick={() => document.getElementById(`subevent-flyer-${s.id}`)?.click()}>
                                                                                                    Subir flyer
                                                                                                </button>
                                                                                                {s.flyer_url ? (
                                                                                                    <button type="button" className="btn-secondary px-6 py-3 text-sm" onClick={() => router.delete(route('admin.events.flyer.destroy', s.id), { preserveScroll: true })}>
                                                                                                        Eliminar flyer
                                                                                                    </button>
                                                                                                ) : null}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>

                                                                                    {can?.manage_ticket_types && (
                                                                                        <div className="pt-2">
                                                                                            <Toggle
                                                                                                checked={ticketsEnabled}
                                                                                                onChange={(checked) => setSubeventTicketsEnabled((prev) => ({ ...prev, [s.id]: checked }))}
                                                                                                label="Habilitar tickets para este subevento"
                                                                                            />
                                                                                        </div>
                                                                                    )}

                                                                                    {can?.manage_ticket_types && ticketsEnabled && (
                                                                                        <div className="p-4 rounded-2xl border border-white/10 bg-black/30">
                                                                                            <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Tickets del subevento</div>
                                                                                            {(s.ticket_types?.length ?? 0) > 0 ? (
                                                                                                <div className="space-y-3 mb-5">
                                                                                                    {s.ticket_types.map((t) => (
                                                                                                        <div key={t.id} className="flex items-center justify-between gap-4 p-3 rounded-2xl border border-white/10 bg-white/5">
                                                                                                            <div className="min-w-0">
                                                                                                                <div className="text-sm font-black uppercase tracking-widest">{t.code}</div>
                                                                                                                <div className="text-xs text-gray-500">{t.price}€ • stock {t.stock}</div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    ))}
                                                                                                </div>
                                                                                            ) : (
                                                                                                <div className="text-sm text-gray-400 mb-5">Todavía no hay tickets creados.</div>
                                                                                            )}

                                                                                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                                                                                <CustomSelect
                                                                                                    label="Tipo"
                                                                                                    value={ticketDraft.code}
                                                                                                    options={[
                                                                                                        { value: 'vip', label: 'VIP' },
                                                                                                        { value: 'standard', label: 'Standard' },
                                                                                                    ]}
                                                                                                    onChange={(val) => setTicketDrafts((prev) => ({ ...prev, [s.id]: { ...(prev?.[s.id] ?? {}), code: val } }))}
                                                                                                />
                                                                                                <Field
                                                                                                    label="Link compra (opcional)"
                                                                                                    value={ticketDraft.external_purchase_url ?? ''}
                                                                                                    onChange={(e) => setTicketDrafts((prev) => ({ ...prev, [s.id]: { ...(prev?.[s.id] ?? {}), external_purchase_url: e.target.value } }))}
                                                                                                    error={null}
                                                                                                    placeholder="https://..."
                                                                                                />
                                                                                                <Field
                                                                                                    label="Precio (€)"
                                                                                                    value={ticketDraft.price}
                                                                                                    onChange={(e) => setTicketDrafts((prev) => ({ ...prev, [s.id]: { ...(prev?.[s.id] ?? {}), price: e.target.value } }))}
                                                                                                    error={null}
                                                                                                    placeholder="0.00"
                                                                                                />
                                                                                                <Field
                                                                                                    label="Stock"
                                                                                                    value={ticketDraft.stock}
                                                                                                    onChange={(e) => setTicketDrafts((prev) => ({ ...prev, [s.id]: { ...(prev?.[s.id] ?? {}), stock: e.target.value } }))}
                                                                                                    error={null}
                                                                                                    placeholder="0"
                                                                                                />
                                                                                                <div className="flex items-end justify-end gap-3">
                                                                                                    <input
                                                                                                        id={`ticket-image-${s.id}`}
                                                                                                        type="file"
                                                                                                        className="hidden"
                                                                                                        onChange={(e) => setTicketDrafts((prev) => ({ ...prev, [s.id]: { ...(prev?.[s.id] ?? {}), image: e.target.files?.[0] ?? null } }))}
                                                                                                    />
                                                                                                    <button type="button" className="btn-secondary px-6 py-3 text-sm" onClick={() => document.getElementById(`ticket-image-${s.id}`)?.click()}>
                                                                                                        Imagen
                                                                                                    </button>
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        className="btn-primary px-6 py-3 text-sm"
                                                                                                        onClick={() => {
                                                                                                            const payload = {
                                                                                                                code: ticketDraft.code,
                                                                                                                price: ticketDraft.price,
                                                                                                                stock: ticketDraft.stock,
                                                                                                                external_purchase_url: ticketDraft.external_purchase_url ?? '',
                                                                                                                image: ticketDraft.image ?? null,
                                                                                                                is_active: 1,
                                                                                                            };
                                                                                                            router.post(route('admin.events.ticket-types.upsert', s.id), payload, { preserveScroll: true, forceFormData: true });
                                                                                                        }}
                                                                                                    >
                                                                                                        Crear ticket
                                                                                                    </button>
                                                                                                </div>
                                                                                                {ticketImagePreview ? (
                                                                                                    <div className="md:col-span-5 flex items-center gap-4 pt-2">
                                                                                                        <div className="w-28 h-20 rounded-2xl border border-white/10 bg-black/40 overflow-hidden flex items-center justify-center">
                                                                                                            <img src={ticketImagePreview} alt="Ticket" className="w-full h-full object-cover" />
                                                                                                        </div>
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            className="btn-secondary px-6 py-3 text-sm"
                                                                                                            onClick={() => setTicketDrafts((prev) => ({ ...prev, [s.id]: { ...(prev?.[s.id] ?? {}), image: null } }))}
                                                                                                        >
                                                                                                            Quitar imagen
                                                                                                        </button>
                                                                                                    </div>
                                                                                                ) : null}
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}

                                                                {!daySubevents.length && openProgramItem !== 'new' && <div className="text-gray-400">Sin subeventos para este día.</div>}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {!eventDays.length && <div className="text-gray-400">Define fechas de inicio y fin para listar los días.</div>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {!isCreate && (
                            <div className="pt-2" id="tickets">
                                <div className="glass-card p-6 border border-white/10 bg-white/5">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                                        <div>
                                            <h3 className="text-xl font-bold">Tickets</h3>
                                            <p className="text-sm text-gray-400">Crea y gestiona múltiples tipos de ticket para este evento o subevento.</p>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <Field
                                            label="URL compra externa (opcional)"
                                            value={form.data.external_ticket_url}
                                            onChange={(e) => form.setData('external_ticket_url', e.target.value)}
                                            error={form.errors.external_ticket_url}
                                            placeholder="https://..."
                                        />
                                    </div>

                                    {ticketTypes.length ? (
                                        <div className="space-y-3 mb-6">
                                            {ticketTypes.map((t) => {
                                                const ed = ticketTypeEdits?.[t.id] ?? {};
                                                const draftImage = ticketTypeImages?.[t.id] ?? null;
                                                const preview = draftImage instanceof File ? URL.createObjectURL(draftImage) : t.image_url;
                                                const fileName = draftImage instanceof File ? draftImage.name : t.image_url ? 'Imagen cargada' : 'Sin imagen';

                                                return (
                                                    <div key={t.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                                            <div className="min-w-0">
                                                                <p className="font-black text-sm uppercase tracking-widest">{t.code}</p>
                                                                <p className="text-xs text-gray-500">{(ed?.is_active ?? t.is_active) ? 'activo' : 'inactivo'}</p>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <button type="button" className="btn-secondary px-5 py-3 text-sm" onClick={() => saveTicketType(t)}>
                                                                    Guardar
                                                                </button>
                                                                {can?.manage_ticket_types && (
                                                                    <button
                                                                        type="button"
                                                                        className="px-5 py-3 text-sm rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white transition-colors"
                                                                        onClick={() => deleteTicketType(t.id)}
                                                                    >
                                                                        Eliminar
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-28 h-28 rounded-2xl border border-white/10 bg-black/30 overflow-hidden flex items-center justify-center">
                                                                    {preview ? <img src={preview} alt={t.code} className="w-full h-full object-contain" /> : <span className="text-xs text-gray-500">Sin</span>}
                                                                </div>
                                                                <div className="flex-1 min-w-0 flex flex-col gap-2">
                                                                    <input
                                                                        type="file"
                                                                        className="hidden"
                                                                        ref={(el) => {
                                                                            if (!el) return;
                                                                            ticketTypeInputRefs.current[t.id] = el;
                                                                        }}
                                                                        onChange={(e) => setTicketTypeImages((prev) => ({ ...prev, [t.id]: e.target.files?.[0] ?? null }))}
                                                                    />
                                                                    <button type="button" className="btn-secondary px-6 py-3 text-sm w-fit" onClick={() => ticketTypeInputRefs.current?.[t.id]?.click()}>
                                                                        Seleccionar imagen
                                                                    </button>
                                                                    <span className="text-sm text-gray-300 truncate">{fileName}</span>
                                                                    {t.image_url ? (
                                                                        <button type="button" className="btn-secondary px-6 py-3 text-sm w-fit" onClick={() => deleteTicketTypeImage(t.id)}>
                                                                            Eliminar imagen
                                                                        </button>
                                                                    ) : null}
                                                                </div>
                                                            </div>

                                                            <Field
                                                                label="Link compra (opcional)"
                                                                value={ed.external_purchase_url ?? ''}
                                                                onChange={(e) =>
                                                                    setTicketTypeEdits((prev) => ({
                                                                        ...prev,
                                                                        [t.id]: { ...(prev?.[t.id] ?? {}), external_purchase_url: e.target.value },
                                                                    }))
                                                                }
                                                                error={null}
                                                                placeholder="https://..."
                                                            />

                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                <Field
                                                                    label="Precio (€)"
                                                                    value={ed.price ?? ''}
                                                                    onChange={(e) => setTicketTypeEdits((prev) => ({ ...prev, [t.id]: { ...(prev?.[t.id] ?? {}), price: e.target.value } }))}
                                                                    error={null}
                                                                    placeholder="0.00"
                                                                />
                                                                <Field
                                                                    label="Stock"
                                                                    value={ed.stock ?? 0}
                                                                    onChange={(e) => setTicketTypeEdits((prev) => ({ ...prev, [t.id]: { ...(prev?.[t.id] ?? {}), stock: e.target.value } }))}
                                                                    error={null}
                                                                    placeholder="0"
                                                                />
                                                                <div className="flex items-end">
                                                                    <label className="inline-flex items-center gap-3 text-sm text-gray-300 select-none">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="rounded border-white/20 bg-white/5"
                                                                            checked={!!(ed.is_active ?? true)}
                                                                            onChange={(e) => setTicketTypeEdits((prev) => ({ ...prev, [t.id]: { ...(prev?.[t.id] ?? {}), is_active: e.target.checked } }))}
                                                                        />
                                                                        Activo
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 mb-6">Todavía no hay tipos de ticket configurados.</p>
                                    )}

                                    {can?.manage_ticket_types && (
                                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                            <Field
                                                label="Código"
                                                value={ticketTypeForm.data.code}
                                                onChange={(e) => ticketTypeForm.setData('code', String(e.target.value).toUpperCase().replace(/\s+/g, '_'))}
                                                error={ticketTypeForm.errors.code}
                                                placeholder="VIP, STANDARD, EARLY_BIRD..."
                                            />
                                            <Field
                                                label="Link compra (opcional)"
                                                value={ticketTypeForm.data.external_purchase_url}
                                                onChange={(e) => ticketTypeForm.setData('external_purchase_url', e.target.value)}
                                                error={ticketTypeForm.errors.external_purchase_url}
                                                placeholder="https://..."
                                            />
                                            <Field
                                                label="Precio (€)"
                                                value={ticketTypeForm.data.price}
                                                onChange={(e) => ticketTypeForm.setData('price', e.target.value)}
                                                error={ticketTypeForm.errors.price}
                                                placeholder="0.00"
                                            />
                                            <Field
                                                label="Stock"
                                                value={ticketTypeForm.data.stock}
                                                onChange={(e) => ticketTypeForm.setData('stock', e.target.value)}
                                                error={ticketTypeForm.errors.stock}
                                                placeholder="0"
                                            />
                                            <div className="flex items-end">
                                                <div className="w-full flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-2xl border border-white/10 bg-black/30 overflow-hidden flex items-center justify-center shrink-0">
                                                        {ticketTypeForm.data.image instanceof File ? (
                                                            <img src={URL.createObjectURL(ticketTypeForm.data.image)} alt="Ticket" className="w-full h-full object-contain" />
                                                        ) : (
                                                            <span className="text-xs text-gray-500">Sin</span>
                                                        )}
                                                    </div>
                                                    <label className="btn-secondary px-6 py-3 text-sm w-full text-center cursor-pointer">
                                                        Seleccionar imagen
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            onChange={(e) => ticketTypeForm.setData('image', e.target.files?.[0] ?? null)}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="flex items-end">
                                                <button
                                                    type="button"
                                                    className="btn-primary w-full px-6 py-3 text-sm"
                                                    disabled={ticketTypeForm.processing}
                                                    onClick={() =>
                                                        openConfirm({
                                                            title: 'Guardar ticket',
                                                            message: '¿Quieres guardar este ticket?',
                                                            confirmLabel: 'Guardar',
                                                            confirmVariant: 'primary',
                                                            onConfirm: submitTicketType,
                                                        })
                                                    }
                                                >
                                                    Guardar ticket
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <button type="button" className="btn-primary px-6 py-3 text-sm" disabled={form.processing} onClick={confirmSaveEvent}>
                                Guardar
                            </button>
                            <LinkBack />
                        </div>
                    </div>
                </div>
            </div>
            {confirmDialog && (
                <ConfirmDialog
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    confirmLabel={confirmDialog.confirmLabel}
                    confirmVariant={confirmDialog.confirmVariant}
                    onCancel={() => setConfirmDialog(null)}
                    onConfirm={() => {
                        const fn = confirmDialog.onConfirm;
                        setConfirmDialog(null);
                        fn?.();
                    }}
                />
            )}
        </AdminLayout>
    );
}

function Field({ label, type, step, value, onChange, error, placeholder }) {
    return (
        <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{label}</label>
            <input
                type={type}
                step={step}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
            />
            {error && <div className="text-xs text-red-400 mt-1">{error}</div>}
        </div>
    );
}

function CustomSelect({ label, value, onChange, error, disabled, options }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    const selected = useMemo(() => {
        return options?.find((o) => String(o.value) === String(value)) ?? options?.[0] ?? { value: '', label: '' };
    }, [options, value]);

    useEffect(() => {
        const onDoc = (e) => {
            if (!rootRef.current) return;
            if (rootRef.current.contains(e.target)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, []);

    return (
        <div ref={rootRef} className="relative">
            {label ? <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{label}</label> : null}
            <button
                type="button"
                disabled={disabled}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pr-10 text-left flex items-center justify-between gap-3 disabled:opacity-60"
                onClick={() => setOpen((o) => !o)}
            >
                <span className="truncate text-gray-200">{selected?.label ?? ''}</span>
                <FiChevronDown className={`shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} size={18} />
            </button>
            {open && !disabled && (
                <div className="absolute z-30 mt-2 w-full rounded-2xl border border-white/10 bg-black/90 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/60">
                    <div className="max-h-72 overflow-auto py-2">
                        {(options ?? []).map((o) => {
                            const isActive = String(o.value) === String(value);
                            return (
                                <button
                                    key={String(o.value)}
                                    type="button"
                                    className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                                        isActive ? 'bg-white/10 text-white' : 'text-gray-200 hover:bg-white/5'
                                    }`}
                                    onClick={() => {
                                        onChange?.(o.value);
                                        setOpen(false);
                                    }}
                                >
                                    {o.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
            {error && <div className="text-xs text-red-400 mt-1">{error}</div>}
        </div>
    );
}

function Toggle({ checked, onChange, disabled, label }) {
    return (
        <label className={`inline-flex items-center justify-between gap-4 w-full p-4 rounded-2xl border border-white/10 bg-white/5 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
            <div className="text-sm font-bold text-gray-200">{label}</div>
            <span className="relative inline-flex items-center">
                <input type="checkbox" className="sr-only peer" checked={!!checked} disabled={disabled} onChange={(e) => onChange?.(e.target.checked)} />
                <span className="w-12 h-7 bg-white/10 border border-white/10 rounded-full peer peer-checked:bg-accent-primary/60 peer-checked:border-accent-primary/40 transition-colors" />
                <span className="absolute left-0.5 top-0.5 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
            </span>
        </label>
    );
}

function TextArea({ label, value, onChange, error }) {
    return (
        <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{label}</label>
            <textarea className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 min-h-32" value={value} onChange={onChange} />
            {error && <div className="text-xs text-red-400 mt-1">{error}</div>}
        </div>
    );
}

function FilePicker({ label, previewUrl, buttonText, fileName, inputRef, onPick, onFile, onRemove, error, variant }) {
    const previewBoxClass =
        variant === 'banner'
            ? 'w-full aspect-[16/7] rounded-3xl'
            : 'w-36 h-36 rounded-3xl';

    return (
        <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{label}</label>
            <input ref={inputRef} type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
            <div className="space-y-4">
                <div className={`${previewBoxClass} border border-white/10 bg-black/30 overflow-hidden flex items-center justify-center`}>
                    {previewUrl ? <img src={previewUrl} alt={label} className="w-full h-full object-contain" /> : <span className="text-xs text-gray-500">Sin</span>}
                </div>
                <div className="flex flex-col gap-2">
                    <button type="button" className="btn-secondary px-6 py-3 text-sm w-fit" onClick={onPick}>
                        {buttonText}
                    </button>
                    {onRemove && (
                        <button type="button" className="btn-secondary px-6 py-3 text-sm w-fit" onClick={onRemove}>
                            Eliminar {label.toLowerCase()}
                        </button>
                    )}
                    <span className="text-sm text-gray-300 truncate">{fileName}</span>
                    {error && <div className="text-xs text-red-400">{error}</div>}
                </div>
            </div>
        </div>
    );
}

function ConfirmDialog({ title, message, confirmLabel, confirmVariant, onCancel, onConfirm }) {
    const confirmClass =
        confirmVariant === 'danger'
            ? 'px-6 py-3 text-sm rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white transition-colors'
            : 'btn-primary px-6 py-3 text-sm';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6" onClick={onCancel}>
            <div className="glass-card max-w-lg w-full p-6 border border-white/10 bg-white/10 shadow-2xl shadow-black/60" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-2xl font-black tracking-tight mb-2">{title}</h3>
                <p className="text-gray-400 mb-6">{message}</p>
                <div className="flex items-center justify-end gap-3">
                    <button type="button" className="btn-secondary px-6 py-3 text-sm" onClick={onCancel}>
                        Cancelar
                    </button>
                    <button type="button" className={confirmClass} onClick={onConfirm}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

function LinkBack() {
    return (
        <a href={route('admin.events.index')} className="btn-secondary px-6 py-3 text-sm">
            Volver
        </a>
    );
}

function formatDateDMY(d) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}

function formatDateYMD(d) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
}

function formatTimeHM(d) {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
}

function formatIsoTimeRange(startIso, endIso) {
    if (!startIso) return '';
    const start = new Date(startIso);
    const end = endIso ? new Date(endIso) : null;
    const st = start.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    if (!end) return st;
    const et = end.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    return `${st} – ${et}`;
}
