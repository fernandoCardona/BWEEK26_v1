import React, { useEffect, useMemo, useRef, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { router, useForm } from '@inertiajs/react';
import useLockBodyScroll from '@/hooks/useLockBodyScroll';
import { FiChevronDown, FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import { formatDMYFromYMD, normalizeTimeHM } from '@/utils/date';
import { createPortal } from 'react-dom';

export default function Edit({ event, parents, defaults, can }) {
    const isCreate = !event;
    const [confirmDialog, setConfirmDialog] = useState(null);
    useLockBodyScroll(!!confirmDialog);
    const ticketTypes = event?.ticket_types ?? [];
    const [openProgramDay, setOpenProgramDay] = useState(null);
    const [openProgramItem, setOpenProgramItem] = useState(null);
    const programRef = useRef(null);
    const [dayEditOpen, setDayEditOpen] = useState(null);
    const [dayEditDate, setDayEditDate] = useState('');
    const [dayAddOpen, setDayAddOpen] = useState(false);
    const [dayAddDate, setDayAddDate] = useState('');
    const isSubeventEntity = !!event?.parent_event_id;
    const entityLabel = isSubeventEntity ? 'Subevento' : 'Evento';
    const displayName = (value) => (typeof value === 'string' ? value : value?.es ?? value?.en ?? '');
    const eventDisplayName = displayName(event?.name) || '';
    const parentEventObj = isSubeventEntity ? (parents ?? []).find((p) => p.id === event?.parent_event_id) ?? null : null;
    const parentEventDisplayName = parentEventObj ? displayName(parentEventObj?.name) || parentEventObj?.id : '';
    const currentEventDayYmd = event?.event_date_ymd || (event?.start_at ? String(event.start_at).slice(0, 10) : '') || '';

    const getHashDay = () => {
        if (typeof window === 'undefined') return null;
        const h = String(window.location.hash || '').replace(/^#/, '');
        const m = h.match(/day=(\d{4}-\d{2}-\d{2})/);
        return m?.[1] ?? null;
    };

    const getHashSubevent = () => {
        if (typeof window === 'undefined') return null;
        const h = String(window.location.hash || '').replace(/^#/, '');
        const m = h.match(/subevent=([0-9a-fA-F-]+)/);
        return m?.[1] ?? null;
    };

    const setHashDay = (day) => {
        if (typeof window === 'undefined') return;
        const nextHash = day ? `#day=${encodeURIComponent(day)}` : '';
        const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
        window.history.replaceState(null, '', nextUrl);
    };

    const initialStart = event?.start_at ? new Date(event.start_at) : null;
    const initialEnd = event?.end_at ? new Date(event.end_at) : null;

    const bannerInputRef = useRef(null);
    const logoInputRef = useRef(null);
    const flyerInputRef = useRef(null);
    const sponsorInputRef = useRef(null);

    const form = useForm({
        parent_event_id: event?.parent_event_id ?? '',
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
        form.setData(() => ({
            parent_event_id: event?.parent_event_id ?? '',
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

    useEffect(() => {
        if (!isCreate) return;
        const parentId = defaults?.parent_event_id;
        if (!parentId) return;
        router.visit(`${route('admin.events.edit', parentId)}#program`, { preserveScroll: true, preserveState: true, replace: true });
    }, [isCreate, defaults?.parent_event_id]);

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
        ticket_description: '',
        ticket_legal_terms: '',
        ticket_image: null,
    });

    const ticketTypeForm = useForm({
        code: 'vip',
        price: '',
        stock: 0,
        description: '',
        legal_terms: '',
        image: null,
        is_active: true,
    });
    const ticketTypeCreateImageRef = useRef(null);

    const [ticketTypeEdits, setTicketTypeEdits] = useState({});
    const [ticketTypeImages, setTicketTypeImages] = useState({});
    const ticketTypeInputRefs = useRef({});

    useEffect(() => {
        const next = {};
        const allTypes = [
            ...(ticketTypes ?? []),
            ...((event?.subevents ?? []).flatMap((s) => s?.ticket_types ?? []) ?? []),
        ];
        for (const t of allTypes) {
            next[t.id] = {
                price: t.price ?? '',
                stock: t.stock ?? 0,
                is_active: t.is_active ?? true,
                description: t.description ?? '',
                legal_terms: t.legal_terms ?? '',
            };
        }
        setTicketTypeEdits(next);
        setTicketTypeImages({});
    }, [event?.id, ticketTypes.length, (event?.subevents ?? []).map((s) => (s?.ticket_types ?? []).length).join(',')]);

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
        const hashSubevent = getHashSubevent();
        if (hashDay || hashSubevent) {
            const day = hashDay
                ? hashDay
                : (() => {
                      const s = (event?.subevents ?? []).find((x) => x.id === hashSubevent) ?? null;
                      return s?.event_date_ymd || (s?.start_at ? String(s.start_at).slice(0, 10) : '') || null;
                  })();
            if (day) setOpenProgramDay(day);
            if (hashSubevent) setOpenProgramItem(`se:${hashSubevent}`);
            if (typeof window !== 'undefined') {
                requestAnimationFrame(() => {
                    if (hashSubevent) document.getElementById(`subevent-${hashSubevent}`)?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
                    else if (day) document.getElementById(`day-${day}`)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
                });
            }
            return;
        }
        if (!event?.start_at) return;
        const d = new Date(event.start_at);
        const key = d.toISOString().slice(0, 10);
        setOpenProgramDay(key);
        setOpenProgramItem(null);
    }, [event?.id, event?.start_at, (event?.subevents ?? []).map((s) => s.id).join(',')]);

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
            end_date:
                isSubeventEntity && data.start_date
                    ? data.start_date
                    : data.end_date,
            start_time: data.start_time && String(data.start_time).length === 5 ? `${normalizeTimeHM(data.start_time)}:00` : data.start_time,
            end_time: data.end_time && String(data.end_time).length === 5 ? `${normalizeTimeHM(data.end_time)}:00` : data.end_time,
        });
        if (isCreate) {
            form.transform(normalizeTimes);
            form.post(route('admin.events.store'), {
                forceFormData: true,
                preserveScroll: true,
                preserveState: true,
                onFinish: () => form.transform((d) => d),
            });
            return;
        }
        form.transform((data) => ({ ...normalizeTimes(data), _method: 'patch' }));
        form.post(route('admin.events.update', event.id), {
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
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
        setHashDay(dayDate);
        setDayEditOpen(null);
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
            ticket_description: '',
            ticket_legal_terms: '',
            ticket_image: null,
        });
        subeventForm.clearErrors();
        setOpenProgramDay(dayDate);
        setOpenProgramItem('new');
    };

    const submitSubevent = () => {
        if (!event) return;
        if (subeventForm.data.day_date) setHashDay(subeventForm.data.day_date);
        setDayEditOpen(null);
        subeventForm.transform((data) => {
            const ticketsEnabled = !!data.tickets_enabled;
            const effectiveDay = openProgramDay || data.day_date;
            const payload = {
                day_date: effectiveDay,
                start_time: data.start_time ? normalizeTimeHM(data.start_time) : null,
                end_time: data.end_time ? normalizeTimeHM(data.end_time) : null,
                name: data.name,
                description: data.description || null,
                location: data.location || null,
                address: data.address || null,
                google_maps_url: data.google_maps_url || null,
                external_ticket_url: data.external_ticket_url || null,
                flyer: data.flyer ?? null,
                is_active: data.is_active ? 1 : 0,
                tickets_enabled: ticketsEnabled ? 1 : 0,
            };

            if (ticketsEnabled) {
                payload.ticket_code = data.ticket_code;
                payload.ticket_price = data.ticket_price;
                payload.ticket_stock = data.ticket_stock;
                payload.ticket_description = data.ticket_description || null;
                payload.ticket_legal_terms = data.ticket_legal_terms || null;
                payload.ticket_image = data.ticket_image ?? null;
            }

            return payload;
        });
        subeventForm.post(route('admin.events.subevents.store', event.id), {
            preserveScroll: true,
            preserveState: true,
            forceFormData: true,
            onSuccess: () => {
                const d = subeventForm.data.day_date || openProgramDay;
                if (d) {
                    setOpenProgramDay(d);
                    setHashDay(d);
                }
                subeventForm.reset();
                subeventForm.clearErrors();
                setOpenProgramItem(null);
            },
            onError: () => {
                setOpenProgramDay(subeventForm.data.day_date || openProgramDay);
                setOpenProgramItem('new');
            },
            onFinish: () => subeventForm.transform((d) => d),
        });
    };

    const saveSubeventChanges = (subeventId) => {
        if (!event) return;
        const payload = subeventEdits?.[subeventId];
        if (!payload?.day_date) return;

        setHashDay(payload.day_date);

        const start = payload.start_time ? normalizeTimeHM(payload.start_time) : null;
        const end = payload.end_time ? normalizeTimeHM(payload.end_time) : null;
        const startDmy = formatDMYFromYMD(payload.day_date);

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
                end_date: startDmy,
                start_time: start ? `${start}:00` : null,
                end_time: end ? `${end}:00` : null,
                is_active: payload.is_active ? 1 : 0,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setOpenProgramDay(payload.day_date);
                    setOpenProgramItem(null);
                },
            }
        );
    };

    const deleteSubevent = (subeventId) => {
        if (!event) return;
        openConfirm({
            title: 'Eliminar subevento',
            message: 'Esta acción es permanente. También elimina sus tickets e imágenes. ¿Seguro que quieres eliminarlo?',
            confirmLabel: 'Eliminar',
            confirmVariant: 'danger',
            onConfirm: () =>
                router.delete(route('admin.events.subevents.destroy', [event.id, subeventId]), {
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () => {
                        setOpenProgramItem((cur) => (cur === `se:${subeventId}` ? null : cur));
                    },
                }),
        });
    };

    const deleteDay = (dayDate) => {
        if (!event) return;
        openConfirm({
            title: 'Eliminar día',
            message: 'Esta acción es permanente. Se eliminarán todos los subeventos del día y sus imágenes. ¿Seguro que quieres eliminarlo?',
            confirmLabel: 'Eliminar',
            confirmVariant: 'danger',
            onConfirm: () =>
                router.delete(route('admin.events.days.destroy', [event.id, dayDate]), {
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () => {
                        if (openProgramDay === dayDate) {
                            setOpenProgramDay(null);
                            setOpenProgramItem(null);
                        }
                    },
                }),
        });
    };

    const submitAddDay = () => {
        if (!event) return;
        if (event?.parent_event_id) return;
        const ymd = String(dayAddDate || '').trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return;

        const start = String(form.data.start_date || '').trim();
        const end = String(form.data.end_date || '').trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return;

        const nextStart = ymd < start ? ymd : start;
        const nextEnd = ymd > end ? ymd : end;
        const willChangeRange = nextStart !== start || nextEnd !== end;

        const afterSuccess = () => {
            setDayAddOpen(false);
            setDayAddDate('');
            openCreateSubevent(ymd);
        };

        if (!willChangeRange) {
            router.patch(route('admin.events.days.update', [event.id, ymd]), { subevents: [] }, { preserveScroll: true, preserveState: true, onSuccess: afterSuccess });
            return;
        }

        router.patch(
            route('admin.events.update', event.id),
            {
                parent_event_id: form.data.parent_event_id,
                name: form.data.name,
                description: form.data.description,
                address: form.data.address,
                location: form.data.location,
                google_maps_url: form.data.google_maps_url,
                external_ticket_url: form.data.external_ticket_url,
                start_date: nextStart,
                end_date: nextEnd,
                start_time: form.data.start_time,
                end_time: form.data.end_time,
                is_active: form.data.is_active ? 1 : 0,
            },
            { preserveScroll: true, preserveState: true, onSuccess: afterSuccess }
        );
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
            nextTicketDrafts[s.id] = { code: 'vip', price: '', stock: 0, description: '', legal_terms: '', image: null };
        }
        setSubeventEdits(nextEdits);
        setSubeventTicketsEnabled(nextTickets);
        setTicketDrafts(nextTicketDrafts);
    }, [event?.id, event?.subevents]);

    const subeventsByDay = useMemo(() => {
        const map = new Map();
        for (const s of event?.subevents ?? []) {
            const key = s.event_date_ymd || (s.start_at ? String(s.start_at).slice(0, 10) : '') || '';
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(s);
        }
        for (const [key, list] of map.entries()) {
            list.sort((a, b) => {
                const as = a.start_at ?? '';
                const bs = b.start_at ?? '';
                if (as && bs && as !== bs) return as < bs ? -1 : 1;
                if (as && !bs) return -1;
                if (!as && bs) return 1;
                const ao = Number(a.sort_order ?? 0);
                const bo = Number(b.sort_order ?? 0);
                if (ao !== bo) return ao < bo ? -1 : 1;
                const an = a.name ?? '';
                const bn = b.name ?? '';
                return an < bn ? -1 : an > bn ? 1 : 0;
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
    }, [event?.start_ymd, event?.end_ymd, (event?.disabled_days ?? []).join(',')]);

    useEffect(() => {
        if (!openProgramDay) return;
        if (!eventDays.includes(openProgramDay)) {
            setOpenProgramDay(eventDays?.[0] ?? null);
            setOpenProgramItem(null);
        }
    }, [openProgramDay, eventDays]);

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

    const deleteTicketTypeFor = (ownerEventId, ticketTypeId) => {
        if (!ownerEventId) return;
        openConfirm({
            title: 'Eliminar ticket',
            message: 'Esta acción es permanente. ¿Seguro que quieres eliminar este ticket?',
            confirmLabel: 'Eliminar',
            confirmVariant: 'danger',
            onConfirm: () => router.delete(route('admin.events.ticket-types.destroy', [ownerEventId, ticketTypeId]), { preserveScroll: true }),
        });
    };

    const deleteTicketTypeImageFor = (ownerEventId, ticketTypeId) => {
        if (!ownerEventId) return;
        openConfirm({
            title: 'Eliminar imagen del ticket',
            message: '¿Seguro que quieres eliminar la imagen de este ticket?',
            confirmLabel: 'Eliminar',
            confirmVariant: 'danger',
            onConfirm: () => router.delete(route('admin.events.ticket-types.image.destroy', [ownerEventId, ticketTypeId]), { preserveScroll: true }),
        });
    };

    const saveTicketTypeFor = (ownerEventId, t) => {
        if (!ownerEventId) return;
        const ed = ticketTypeEdits?.[t.id] ?? {};
        const img = ticketTypeImages?.[t.id] ?? null;
        const payload = {
            code: t.code,
            price: ed.price ?? t.price ?? 0,
            stock: ed.stock ?? t.stock ?? 0,
            description: ed.description ?? t.description ?? '',
            legal_terms: ed.legal_terms ?? t.legal_terms ?? '',
            is_active: ed.is_active ? 1 : 0,
            image: img,
        };
        openConfirm({
            title: 'Guardar ticket',
            message: '¿Quieres guardar los cambios de este ticket?',
            confirmLabel: 'Guardar',
            confirmVariant: 'primary',
            onConfirm: () =>
                router.post(route('admin.events.ticket-types.upsert', ownerEventId), payload, {
                    preserveScroll: true,
                    forceFormData: true,
                    onSuccess: () => setTicketTypeImages((prev) => ({ ...prev, [t.id]: null })),
                }),
        });
    };

    const deleteTicketType = (ticketTypeId) => {
        if (!event) return;
        deleteTicketTypeFor(event.id, ticketTypeId);
    };

    const deleteTicketTypeImage = (ticketTypeId) => {
        if (!event) return;
        deleteTicketTypeImageFor(event.id, ticketTypeId);
    };

    const saveTicketType = (t) => {
        if (!event) return;
        saveTicketTypeFor(event.id, t);
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
                setDayEditOpen(null);
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
                router.patch(
                    route('admin.events.days.update', [event.id, dayDate]),
                    { subevents: payload },
                    {
                        preserveScroll: true,
                        preserveState: true,
                        onSuccess: () => {
                            setOpenProgramDay(dayDate);
                            setOpenProgramItem(null);
                        },
                    }
                );
            },
        });
    };

    const saveDayDate = () => {
        if (!event) return;
        const fromDay = dayEditOpen;
        const toDay = String(dayEditDate || '').trim();
        if (!fromDay || !/^\d{4}-\d{2}-\d{2}$/.test(toDay)) return;
        router.patch(
            route('admin.events.days.move', [event.id, fromDay]),
            { new_day_date: toDay },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setDayEditOpen(null);
                    setDayEditDate('');
                    setOpenProgramItem(null);
                    setOpenProgramDay(toDay);
                    setHashDay(toDay);
                    if (typeof window !== 'undefined') {
                        requestAnimationFrame(() => {
                            document.getElementById(`day-${toDay}`)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
                        });
                    }
                },
            }
        );
    };

    return (
        <AdminLayout active="events" headTitle={`Admin • ${isCreate ? `Crear ${entityLabel.toLowerCase()}` : `Editar ${entityLabel.toLowerCase()}`}`}>
            <div className="w-full">
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="min-w-0">
                        <h2 className="text-3xl font-black tracking-tight">{isCreate ? `Crear ${entityLabel.toLowerCase()}` : `Editar ${entityLabel.toLowerCase()}`}</h2>
                        <p className="text-gray-400">{isCreate ? `Configura la información del ${entityLabel.toLowerCase()}.` : `Actualiza la información del ${entityLabel.toLowerCase()}.`}</p>
                    </div>
                </div>

                <div className="glass-card p-6">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Jerarquía</label>
                                <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-gray-300">
                                    {isSubeventEntity ? (
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                className="hover:text-white transition-colors font-black"
                                                onClick={() => router.visit(route('admin.events.edit', event.parent_event_id), { preserveScroll: true })}
                                            >
                                                {parentEventDisplayName || event?.parent_event_id}
                                            </button>
                                            {currentEventDayYmd ? (
                                                <>
                                                    <span className="text-gray-600">{'>'}</span>
                                                    <button
                                                        type="button"
                                                        className="hover:text-white transition-colors font-bold"
                                                        onClick={() => {
                                                            const href = `${route('admin.events.edit', event.parent_event_id)}#day=${encodeURIComponent(currentEventDayYmd)}`;
                                                            router.visit(href, { preserveScroll: true });
                                                        }}
                                                    >
                                                        {formatDMYFromYMD(currentEventDayYmd)}
                                                    </button>
                                                </>
                                            ) : null}
                                            <span className="text-gray-600">{'>'}</span>
                                            <span className="text-white font-black">{eventDisplayName || event?.id}</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                className="hover:text-white transition-colors font-black"
                                                onClick={() => {
                                                    setOpenProgramItem(null);
                                                    setOpenProgramDay(null);
                                                    setHashDay(null);
                                                }}
                                            >
                                                {eventDisplayName || event?.id || 'Evento'}
                                            </button>
                                            {openProgramDay ? (
                                                <>
                                                    <span className="text-gray-600">{'>'}</span>
                                                    <button
                                                        type="button"
                                                        className="hover:text-white transition-colors font-bold"
                                                        onClick={() => {
                                                            setOpenProgramItem(null);
                                                            setOpenProgramDay(openProgramDay);
                                                            setHashDay(openProgramDay);
                                                            requestAnimationFrame(() => document.getElementById(`day-${openProgramDay}`)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }));
                                                        }}
                                                    >
                                                        {formatDMYFromYMD(openProgramDay)}
                                                    </button>
                                                </>
                                            ) : null}
                                            {openProgramItem?.startsWith('se:') ? (
                                                <>
                                                    <span className="text-gray-600">{'>'}</span>
                                                    <button
                                                        type="button"
                                                        className="hover:text-white transition-colors font-black"
                                                        onClick={() => {
                                                            const subeventId = openProgramItem.slice(3);
                                                            const selected = (event?.subevents ?? []).find((s) => s.id === subeventId) ?? null;
                                                            const ymd =
                                                                selected?.event_date_ymd || (selected?.start_at ? String(selected.start_at).slice(0, 10) : '') || openProgramDay || '';
                                                            if (ymd) {
                                                                setOpenProgramDay(ymd);
                                                                setHashDay(ymd);
                                                            }
                                                            setOpenProgramItem(openProgramItem);
                                                            requestAnimationFrame(() => document.getElementById(`subevent-${subeventId}`)?.scrollIntoView?.({ behavior: 'smooth', block: 'center' }));
                                                        }}
                                                    >
                                                        {displayName((event?.subevents ?? []).find((s) => s.id === openProgramItem.slice(3))?.name) || 'Subevento'}
                                                    </button>
                                                </>
                                            ) : null}
                                        </div>
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

                        <div className="flex flex-col md:flex-row md:items-end gap-4">
                            <div className="flex-1 min-w-0">
                                <Field label="Nombre del evento" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} error={form.errors.name} />
                            </div>
                            {!isSubeventEntity && (
                                <div className="w-full md:w-80">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Logo</label>
                                    <input
                                        ref={logoInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => form.setData('logo', e.target.files?.[0] ?? null)}
                                    />
                                    <TicketImageBox
                                        previewUrl={logoPreview}
                                        boxClass="w-20 h-20 rounded-3xl"
                                        onPick={() => logoInputRef.current?.click()}
                                        onDropFile={(f) => form.setData('logo', f)}
                                        onRemove={() => {
                                            if (form.data.logo instanceof File) {
                                                form.setData('logo', null);
                                                return;
                                            }
                                            if (event?.logo_url) {
                                                openConfirm({
                                                    title: 'Eliminar logo',
                                                    message: '¿Seguro que quieres eliminar el logo?',
                                                    confirmLabel: 'Eliminar',
                                                    confirmVariant: 'danger',
                                                    onConfirm: () => router.delete(route('admin.events.logo.destroy', event.id), { preserveScroll: true, preserveState: true }),
                                                });
                                            }
                                        }}
                                    />
                                    {form.errors.logo && <div className="text-xs text-red-400 mt-2">{form.errors.logo}</div>}
                                </div>
                            )}
                        </div>
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
                            {isSubeventEntity ? (
                                <>
                                    <Field
                                        label="Día"
                                        type="date"
                                        value={form.data.start_date}
                                        onChange={(e) => {
                                            form.setData('start_date', e.target.value);
                                            form.setData('end_date', e.target.value);
                                        }}
                                        error={form.errors.start_date}
                                    />
                                    <div className="hidden md:block" />
                                </>
                            ) : (
                                <>
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
                                </>
                            )}
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

                        {!isSubeventEntity ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Banner</label>
                                    <input
                                        ref={bannerInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => form.setData('banner', e.target.files?.[0] ?? null)}
                                    />
                                    <TicketImageBox
                                        previewUrl={bannerPreview}
                                        variant="banner"
                                        onPick={() => bannerInputRef.current?.click()}
                                        onDropFile={(f) => form.setData('banner', f)}
                                        onRemove={() => {
                                            if (form.data.banner instanceof File) {
                                                form.setData('banner', null);
                                                return;
                                            }
                                            if (event?.banner_url) {
                                                openConfirm({
                                                    title: 'Eliminar banner',
                                                    message: '¿Seguro que quieres eliminar el banner?',
                                                    confirmLabel: 'Eliminar',
                                                    confirmVariant: 'danger',
                                                    onConfirm: () => router.delete(route('admin.events.banner.destroy', event.id), { preserveScroll: true, preserveState: true }),
                                                });
                                            }
                                        }}
                                    />
                                    {form.errors.banner && <div className="text-xs text-red-400 mt-2">{form.errors.banner}</div>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Flyer</label>
                                    <input
                                        ref={flyerInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => form.setData('flyer', e.target.files?.[0] ?? null)}
                                    />
                                    <TicketImageBox
                                        previewUrl={flyerPreview}
                                        variant="banner"
                                        onPick={() => flyerInputRef.current?.click()}
                                        onDropFile={(f) => form.setData('flyer', f)}
                                        onRemove={() => {
                                            if (form.data.flyer instanceof File) {
                                                form.setData('flyer', null);
                                                return;
                                            }
                                            if (event?.flyer_url) {
                                                openConfirm({
                                                    title: 'Eliminar flyer',
                                                    message: '¿Seguro que quieres eliminar el flyer?',
                                                    confirmLabel: 'Eliminar',
                                                    confirmVariant: 'danger',
                                                    onConfirm: () => router.delete(route('admin.events.flyer.destroy', event.id), { preserveScroll: true, preserveState: true }),
                                                });
                                            }
                                        }}
                                    />
                                    {form.errors.flyer && <div className="text-xs text-red-400 mt-2">{form.errors.flyer}</div>}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Flyer</label>
                                    <input
                                        ref={flyerInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => form.setData('flyer', e.target.files?.[0] ?? null)}
                                    />
                                    <TicketImageBox
                                        previewUrl={flyerPreview}
                                        variant="banner"
                                        onPick={() => flyerInputRef.current?.click()}
                                        onDropFile={(f) => form.setData('flyer', f)}
                                        onRemove={() => {
                                            if (form.data.flyer instanceof File) {
                                                form.setData('flyer', null);
                                                return;
                                            }
                                            if (event?.flyer_url) {
                                                openConfirm({
                                                    title: 'Eliminar flyer',
                                                    message: '¿Seguro que quieres eliminar el flyer?',
                                                    confirmLabel: 'Eliminar',
                                                    confirmVariant: 'danger',
                                                    onConfirm: () => router.delete(route('admin.events.flyer.destroy', event.id), { preserveScroll: true, preserveState: true }),
                                                });
                                            }
                                        }}
                                    />
                                    {form.errors.flyer && <div className="text-xs text-red-400 mt-2">{form.errors.flyer}</div>}
                                </div>
                            </div>
                        )}

                        {!isCreate && !isSubeventEntity && (
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
                                                <input
                                                    ref={sponsorInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => sponsorForm.setData('logo', e.target.files?.[0] ?? null)}
                                                />
                                                <TicketImageBox
                                                    previewUrl={sponsorPreview}
                                                    onPick={() => sponsorInputRef.current?.click()}
                                                    onDropFile={(f) => sponsorForm.setData('logo', f)}
                                                    onRemove={() => sponsorForm.setData('logo', null)}
                                                />
                                                {sponsorForm.errors.logo && <div className="text-xs text-red-400 mt-2">{sponsorForm.errors.logo}</div>}
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

                        {!isSubeventEntity && (
                            <div className="pt-2">
                            <div ref={programRef} id="program" className="glass-card p-6 border border-white/10 bg-white/5">
                                <div className="flex items-center justify-between gap-4 mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold">Programa</h3>
                                        <p className="text-sm text-gray-400">Días del evento con subeventos (colapsable).</p>
                                        {!!event && (
                                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                                                {event?.parent_event_id ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="hover:text-white transition-colors font-bold"
                                                            onClick={() => {
                                                                const day = event?.event_date_ymd;
                                                                const href = day
                                                                    ? `${route('admin.events.edit', event.parent_event_id)}#day=${encodeURIComponent(day)}`
                                                                    : route('admin.events.edit', event.parent_event_id);
                                                                router.visit(href, { preserveScroll: true });
                                                            }}
                                                        >
                                                            {displayName((parents ?? []).find((p) => p.id === event.parent_event_id)?.name) || 'Evento'}
                                                        </button>
                                                        <span className="text-gray-600">{'>'}</span>
                                                        <button
                                                            type="button"
                                                            className="hover:text-white transition-colors font-bold"
                                                            onClick={() => {
                                                                const day = event?.event_date_ymd;
                                                                const href = day
                                                                    ? `${route('admin.events.edit', event.parent_event_id)}#day=${encodeURIComponent(day)}`
                                                                    : route('admin.events.edit', event.parent_event_id);
                                                                router.visit(href, { preserveScroll: true });
                                                            }}
                                                        >
                                                            {formatDMYFromYMD(event?.event_date_ymd)}
                                                        </button>
                                                        <span className="text-gray-600">{'>'}</span>
                                                        <span className="text-white font-black">{eventDisplayName || event?.id}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="hover:text-white transition-colors font-bold"
                                                            onClick={() => {
                                                                setOpenProgramItem(null);
                                                                setOpenProgramDay(null);
                                                                setHashDay(null);
                                                            }}
                                                        >
                                                            {eventDisplayName || event?.id}
                                                        </button>
                                                        {openProgramDay ? (
                                                            <>
                                                                <span className="text-gray-600">{'>'}</span>
                                                                <button
                                                                    type="button"
                                                                    className="hover:text-white transition-colors font-bold"
                                                                    onClick={() => {
                                                                        setOpenProgramItem(null);
                                                                        setOpenProgramDay(openProgramDay);
                                                                        setHashDay(openProgramDay);
                                                                    }}
                                                                >
                                                                    {formatDMYFromYMD(openProgramDay)}
                                                                </button>
                                                            </>
                                                        ) : null}
                                                        {openProgramItem?.startsWith('se:') ? (
                                                            <>
                                                                <span className="text-gray-600">{'>'}</span>
                                                                <span className="text-white font-black">
                                                                    {(event?.subevents ?? []).find((s) => s.id === openProgramItem.slice(3))?.name ?? 'Subevento'}
                                                                </span>
                                                            </>
                                                        ) : null}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {!!event && !event?.parent_event_id && (
                                        <div className="shrink-0">
                                            <button
                                                type="button"
                                                className="btn-secondary px-5 py-3 text-sm"
                                                onClick={() => {
                                                    setDayAddOpen(true);
                                                    setDayAddDate(openProgramDay ?? form.data.start_date ?? '');
                                                }}
                                            >
                                                <span className="inline-flex items-center gap-2">
                                                    <FiPlus size={16} /> Añadir día
                                                </span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {dayAddOpen && !!event && !event?.parent_event_id && (
                                    <div className="mb-4 p-4 rounded-2xl border border-white/10 bg-black/30">
                                        <div className="flex flex-col md:flex-row md:items-end gap-4">
                                            <div className="flex-1">
                                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Día a añadir</label>
                                                <input
                                                    type="date"
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3"
                                                    value={dayAddDate}
                                                    onChange={(e) => setDayAddDate(e.target.value)}
                                                />
                                                <div className="text-xs text-gray-500 mt-2">
                                                    Si eliges un día fuera del rango actual, se actualizará la fecha inicio/fin del evento.
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 justify-end">
                                                <button type="button" className="btn-secondary px-6 py-3 text-sm" onClick={() => setDayAddOpen(false)}>
                                                    Cancelar
                                                </button>
                                                <button type="button" className="btn-primary px-6 py-3 text-sm" onClick={submitAddDay}>
                                                    Añadir
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!event ? (
                                    <div className="text-gray-400">Guarda el evento para poder gestionar el programa.</div>
                                ) : (
                                    <div className="space-y-3">
                                        {eventDays.map((day) => {
                                            const isOpen = openProgramDay === day;
                                            const daySubevents = subeventsByDay.get(day) ?? [];

                                            return (
                                                <div key={day} id={`day-${day}`} className="rounded-3xl border border-white/10 bg-black/30 overflow-hidden">
                                                    <div className="w-full px-6 py-5 flex items-center justify-between gap-4">
                                                        <button
                                                            type="button"
                                                            className="min-w-0 flex-1 text-left"
                                                            onClick={() => {
                                                                if (dayEditOpen === day) return;
                                                                setHashDay(day);
                                                                setDayEditOpen(null);
                                                                setOpenProgramItem(null);
                                                                setOpenProgramDay((cur) => (cur === day ? null : day));
                                                            }}
                                                        >
                                                            <div>
                                                                <div className="text-xs font-black uppercase tracking-widest text-gray-500">Día</div>
                                                                {dayEditOpen === day ? (
                                                                    <div className="flex flex-wrap items-center gap-3">
                                                                        <input
                                                                            type="date"
                                                                            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
                                                                            value={dayEditDate}
                                                                            onChange={(e) => setDayEditDate(e.target.value)}
                                                                        />
                                                                        <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={() => setDayEditOpen(null)}>
                                                                            Cancelar
                                                                        </button>
                                                                        <button type="button" className="btn-primary px-4 py-2 text-sm" onClick={saveDayDate}>
                                                                            Guardar
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-lg font-black">{formatDMYFromYMD(day)}</div>
                                                                )}
                                                            </div>
                                                        </button>
                                                        <div className="flex items-center gap-3">
                                                            {isOpen ? (
                                                                <>
                                                                    <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={() => openCreateSubevent(day)}>
                                                                        <span className="inline-flex items-center gap-2">
                                                                            <FiPlus size={16} /> Añadir subevento
                                                                        </span>
                                                                    </button>
                                                                    {daySubevents.length > 0 ? (
                                                                        <button
                                                                            type="button"
                                                                            className="btn-primary px-4 py-2 text-sm"
                                                                            onClick={() => confirmSaveDay(day, daySubevents)}
                                                                        >
                                                                            Guardar día
                                                                        </button>
                                                                    ) : null}
                                                                </>
                                                            ) : null}
                                                            <button
                                                                type="button"
                                                                className="icon-btn icon-btn-gradient"
                                                                aria-label="Editar día"
                                                                onClick={() => {
                                                                    setHashDay(day);
                                                                    setOpenProgramDay(day);
                                                                    setOpenProgramItem(null);
                                                                    setDayEditOpen(day);
                                                                    setDayEditDate(day);
                                                                }}
                                                            >
                                                                <FiEdit2 size={23} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="icon-btn icon-btn-gradient text-red-500 hover:text-red-400"
                                                                aria-label="Eliminar día"
                                                                onClick={() => deleteDay(day)}
                                                            >
                                                                <FiTrash2 size={26} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="icon-btn icon-btn-gradient"
                                                                aria-label="Abrir/cerrar día"
                                                                onClick={() => {
                                                                    setHashDay(day);
                                                                    setDayEditOpen(null);
                                                                    setOpenProgramItem(null);
                                                                    setOpenProgramDay((cur) => (cur === day ? null : day));
                                                                }}
                                                            >
                                                                <FiChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} size={23} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {isOpen && (
                                                        <div className="px-6 pb-6">
                                                            <div className="space-y-3">
                                                                {openProgramItem === 'new' && openProgramDay === day && (
                                                                    <div className="p-5 rounded-3xl border border-white/10 bg-white/5">
                                                                        <div className="flex items-center justify-between gap-4 mb-4">
                                                                            <div className="font-black">Nuevo subevento</div>
                                                                        </div>
                                                                        {subeventForm.errors.day_date && <div className="text-xs text-red-400 mb-3">{subeventForm.errors.day_date}</div>}

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
                                                                                <input
                                                                                    id={`new-subevent-flyer-${day}`}
                                                                                    type="file"
                                                                                    accept="image/*"
                                                                                    className="hidden"
                                                                                    onChange={(e) => subeventForm.setData('flyer', e.target.files?.[0] ?? null)}
                                                                                />
                                                                                <TicketImageBox
                                                                                    previewUrl={subeventForm.data.flyer instanceof File ? URL.createObjectURL(subeventForm.data.flyer) : null}
                                                                                    variant="rect"
                                                                                    onPick={() => document.getElementById(`new-subevent-flyer-${day}`)?.click()}
                                                                                    onDropFile={(f) => subeventForm.setData('flyer', f)}
                                                                                    onRemove={() => subeventForm.setData('flyer', null)}
                                                                                />
                                                                                {subeventForm.errors.flyer && <div className="text-xs text-red-400 mt-2">{subeventForm.errors.flyer}</div>}
                                                                            </div>

                                                                            <Toggle
                                                                                checked={!!subeventForm.data.tickets_enabled}
                                                                                onChange={(checked) => subeventForm.setData('tickets_enabled', checked)}
                                                                                label="Habilitar tickets para este subevento"
                                                                            />

                                                                            {subeventForm.data.tickets_enabled && (
                                                                                <div className="p-4 rounded-2xl border border-white/10 bg-black/30">
                                                                                    <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Crear ticket</div>
                                                                                    <div className="flex flex-col gap-4">
                                                                                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                                                                                            <div className="shrink-0">
                                                                                                <input
                                                                                                    id={`new-subevent-ticket-image-${day}`}
                                                                                                    type="file"
                                                                                                    accept="image/*"
                                                                                                    className="hidden"
                                                                                                    onChange={(e) => subeventForm.setData('ticket_image', e.target.files?.[0] ?? null)}
                                                                                                />
                                                                                                <TicketImageBox
                                                                                                    previewUrl={subeventForm.data.ticket_image instanceof File ? URL.createObjectURL(subeventForm.data.ticket_image) : null}
                                                                                                    onPick={() => document.getElementById(`new-subevent-ticket-image-${day}`)?.click()}
                                                                                                    onRemove={() => subeventForm.setData('ticket_image', null)}
                                                                                                    onDropFile={(f) => subeventForm.setData('ticket_image', f)}
                                                                                                    size="sm"
                                                                                                />
                                                                                            </div>
                                                                                            <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1 min-w-0">
                                                                                                <div className="w-full md:max-w-[22rem]">
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
                                                                                                </div>
                                                                                                <div className="w-full md:w-56">
                                                                                                    <Field
                                                                                                        label="Precio (€)"
                                                                                                        value={subeventForm.data.ticket_price}
                                                                                                        onChange={(e) => subeventForm.setData('ticket_price', e.target.value)}
                                                                                                        error={subeventForm.errors.ticket_price}
                                                                                                        placeholder="0.00"
                                                                                                    />
                                                                                                </div>
                                                                                                <div className="w-full md:w-44">
                                                                                                    <Field
                                                                                                        label="Stock"
                                                                                                        value={subeventForm.data.ticket_stock}
                                                                                                        onChange={(e) => subeventForm.setData('ticket_stock', e.target.value)}
                                                                                                        error={subeventForm.errors.ticket_stock}
                                                                                                        placeholder="0"
                                                                                                    />
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="w-full md:w-auto md:ml-auto">
                                                                                                <button type="button" className="btn-primary w-full px-6 py-3 text-sm" disabled={subeventForm.processing} onClick={submitSubevent}>
                                                                                                    Crear subevento + ticket
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                        <CollapsibleTextArea
                                                                                            label="Descripción del ticket"
                                                                                            value={subeventForm.data.ticket_description}
                                                                                            onChange={(e) => subeventForm.setData('ticket_description', e.target.value)}
                                                                                            error={subeventForm.errors.ticket_description}
                                                                                            defaultOpen={true}
                                                                                        />
                                                                                        <CollapsibleTextArea
                                                                                            label="Condiciones legales"
                                                                                            value={subeventForm.data.ticket_legal_terms}
                                                                                            onChange={(e) => subeventForm.setData('ticket_legal_terms', e.target.value)}
                                                                                            error={subeventForm.errors.ticket_legal_terms}
                                                                                            defaultOpen={true}
                                                                                        />
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
                                                                    const ticketDraft = ticketDrafts?.[s.id] ?? { code: 'vip', price: '', stock: 0, description: '', legal_terms: '', image: null };
                                                                    const ticketImagePreview = ticketDraft?.image instanceof File ? URL.createObjectURL(ticketDraft.image) : null;

                                                                    return (
                                                                        <div key={s.id} id={`subevent-${s.id}`} className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
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
                                                                                        className="icon-btn icon-btn-gradient"
                                                                                        aria-label="Editar subevento"
                                                                                        onClick={() => {
                                                                                            setOpenProgramDay(day);
                                                                                            setOpenProgramItem(`se:${s.id}`);
                                                                                            setHashDay(day);
                                                                                        }}
                                                                                    >
                                                                                        <FiEdit2 size={23} />
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        className="icon-btn icon-btn-gradient text-red-500 hover:text-red-400"
                                                                                        aria-label="Eliminar subevento"
                                                                                        onClick={() => deleteSubevent(s.id)}
                                                                                    >
                                                                                            <FiTrash2 size={26} />
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        className="icon-btn icon-btn-gradient"
                                                                                        aria-label="Abrir/cerrar subevento"
                                                                                        onClick={() => setOpenProgramItem((cur) => (cur === `se:${s.id}` ? null : `se:${s.id}`))}
                                                                                    >
                                                                                        <FiChevronDown className={`transition-transform ${isItemOpen ? 'rotate-180' : ''}`} size={23} />
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
                                                                                                    {s.ticket_types.map((t) => {
                                                                                                        const ed = ticketTypeEdits?.[t.id] ?? {};
                                                                                                        const draftImage = ticketTypeImages?.[t.id] ?? null;
                                                                                                        const preview = draftImage instanceof File ? URL.createObjectURL(draftImage) : t.image_url;
                                                                                                        const stockValue = Number(ed.stock ?? t.stock ?? 0);
                                                                                                        const isExpired = (() => {
                                                                                                            try {
                                                                                                                if (!s.end_at) return false;
                                                                                                                return new Date(s.end_at).getTime() < Date.now();
                                                                                                            } catch {
                                                                                                                return false;
                                                                                                            }
                                                                                                        })();
                                                                                                        const canBeActive = !isExpired && stockValue > 0;
                                                                                                        const effectiveActive = canBeActive ? !!(ed.is_active ?? t.is_active) : false;

                                                                                                        return (
                                                                                                            <div key={t.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                                                                                                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                                                                                                    <div className="min-w-0 flex items-center gap-4">
                                                                                                                        <p className="font-black text-sm uppercase tracking-widest">{t.code}</p>
                                                                                                                        <div className="flex items-center gap-2">
                                                                                                                            <span className="text-xs text-gray-500">Activo</span>
                                                                                                                            <InlineSwitch
                                                                                                                                checked={effectiveActive}
                                                                                                                                disabled={!canBeActive}
                                                                                                                                onChange={(checked) =>
                                                                                                                                    setTicketTypeEdits((prev) => ({
                                                                                                                                        ...prev,
                                                                                                                                        [t.id]: { ...(prev?.[t.id] ?? {}), is_active: checked },
                                                                                                                                    }))
                                                                                                                                }
                                                                                                                            />
                                                                                                                        </div>
                                                                                                                        {isExpired ? <span className="text-xs font-bold text-red-400">FINALIZADO</span> : null}
                                                                                                                        {!isExpired && stockValue <= 0 ? <span className="text-xs font-bold text-red-400">AGOTADO</span> : null}
                                                                                                                    </div>
                                                                                                                </div>

                                                                                                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                                                                                                                    <div className="flex items-center gap-4">
                                                                                                                        <input
                                                                                                                            type="file"
                                                                                                                            accept="image/*"
                                                                                                                            className="hidden"
                                                                                                                            ref={(el) => {
                                                                                                                                if (!el) return;
                                                                                                                                ticketTypeInputRefs.current[t.id] = el;
                                                                                                                            }}
                                                                                                                            onChange={(e) => setTicketTypeImages((prev) => ({ ...prev, [t.id]: e.target.files?.[0] ?? null }))}
                                                                                                                        />
                                                                                                                        <TicketImageBox
                                                                                                                            previewUrl={preview}
                                                                                                                            onPick={() => ticketTypeInputRefs.current?.[t.id]?.click()}
                                                                                                                            onDropFile={(f) => setTicketTypeImages((prev) => ({ ...prev, [t.id]: f }))}
                                                                                                                            onRemove={() => {
                                                                                                                                if (draftImage instanceof File) {
                                                                                                                                    setTicketTypeImages((prev) => ({ ...prev, [t.id]: null }));
                                                                                                                                    return;
                                                                                                                                }
                                                                                                                                if (t.image_url) {
                                                                                                                                    deleteTicketTypeImageFor(s.id, t.id);
                                                                                                                                }
                                                                                                                            }}
                                                                                                                        />
                                                                                                                    </div>

                                                                                                                    <Field
                                                                                                                        label="Precio (€)"
                                                                                                                        value={ed.price ?? ''}
                                                                                                                        onChange={(e) =>
                                                                                                                            setTicketTypeEdits((prev) => ({
                                                                                                                                ...prev,
                                                                                                                                [t.id]: { ...(prev?.[t.id] ?? {}), price: e.target.value },
                                                                                                                            }))
                                                                                                                        }
                                                                                                                        error={null}
                                                                                                                        placeholder="0.00"
                                                                                                                    />
                                                                                                                    <Field
                                                                                                                        label="Stock"
                                                                                                                        value={ed.stock ?? 0}
                                                                                                                        onChange={(e) =>
                                                                                                                            setTicketTypeEdits((prev) => ({
                                                                                                                                ...prev,
                                                                                                                                [t.id]: { ...(prev?.[t.id] ?? {}), stock: e.target.value },
                                                                                                                            }))
                                                                                                                        }
                                                                                                                        error={null}
                                                                                                                        placeholder="0"
                                                                                                                    />
                                                                                                                    <div className="flex items-start justify-end gap-3 pt-7">
                                                                                                                        <button type="button" className="btn-secondary px-5 py-3 text-sm" onClick={() => saveTicketTypeFor(s.id, t)}>
                                                                                                                            Guardar
                                                                                                                        </button>
                                                                                                                        <button
                                                                                                                            type="button"
                                                                                                                            className="px-5 py-3 text-sm rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white transition-colors"
                                                                                                                            onClick={() => deleteTicketTypeFor(s.id, t.id)}
                                                                                                                        >
                                                                                                                            Eliminar
                                                                                                                        </button>
                                                                                                                    </div>
                                                                                                                    <div className="lg:col-span-4">
                                                                                                                        <CollapsibleTextArea
                                                                                                                            label="Descripción del ticket"
                                                                                                                            value={ed.description ?? ''}
                                                                                                                            onChange={(e) =>
                                                                                                                                setTicketTypeEdits((prev) => ({
                                                                                                                                    ...prev,
                                                                                                                                    [t.id]: { ...(prev?.[t.id] ?? {}), description: e.target.value },
                                                                                                                                }))
                                                                                                                            }
                                                                                                                            error={null}
                                                                                                                            defaultOpen={false}
                                                                                                                        />
                                                                                                                    </div>
                                                                                                                    <div className="lg:col-span-4">
                                                                                                                        <CollapsibleTextArea
                                                                                                                            label="Condiciones legales"
                                                                                                                            value={ed.legal_terms ?? ''}
                                                                                                                            onChange={(e) =>
                                                                                                                                setTicketTypeEdits((prev) => ({
                                                                                                                                    ...prev,
                                                                                                                                    [t.id]: { ...(prev?.[t.id] ?? {}), legal_terms: e.target.value },
                                                                                                                                }))
                                                                                                                            }
                                                                                                                            error={null}
                                                                                                                            defaultOpen={false}
                                                                                                                        />
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        );
                                                                                                    })}
                                                                                                </div>
                                                                                            ) : (
                                                                                                <div className="text-sm text-gray-400 mb-5">Todavía no hay tickets creados.</div>
                                                                                            )}

                                                                                            <div className="flex flex-col gap-4">
                                                                                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                                                                                    <div className="shrink-0">
                                                                                                        <input
                                                                                                            id={`ticket-image-${s.id}`}
                                                                                                            type="file"
                                                                                                            accept="image/*"
                                                                                                            className="hidden"
                                                                                                            onChange={(e) =>
                                                                                                                setTicketDrafts((prev) => ({
                                                                                                                    ...prev,
                                                                                                                    [s.id]: { ...(prev?.[s.id] ?? {}), image: e.target.files?.[0] ?? null },
                                                                                                                }))
                                                                                                            }
                                                                                                        />
                                                                                                        <TicketImageBox
                                                                                                            previewUrl={ticketImagePreview}
                                                                                                            onPick={() => document.getElementById(`ticket-image-${s.id}`)?.click()}
                                                                                                            onDropFile={(f) =>
                                                                                                                setTicketDrafts((prev) => ({
                                                                                                                    ...prev,
                                                                                                                    [s.id]: { ...(prev?.[s.id] ?? {}), image: f },
                                                                                                                }))
                                                                                                            }
                                                                                                            onRemove={() =>
                                                                                                                setTicketDrafts((prev) => ({
                                                                                                                    ...prev,
                                                                                                                    [s.id]: { ...(prev?.[s.id] ?? {}), image: null },
                                                                                                                }))
                                                                                                            }
                                                                                                            size="sm"
                                                                                                        />
                                                                                                    </div>
                                                                                                    <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1 min-w-0">
                                                                                                        <div className="w-full md:max-w-[22rem]">
                                                                                                            <CustomSelect
                                                                                                                label="Tipo"
                                                                                                                value={ticketDraft.code}
                                                                                                                options={[
                                                                                                                    { value: 'vip', label: 'VIP' },
                                                                                                                    { value: 'standard', label: 'Standard' },
                                                                                                                ]}
                                                                                                                onChange={(val) => setTicketDrafts((prev) => ({ ...prev, [s.id]: { ...(prev?.[s.id] ?? {}), code: val } }))}
                                                                                                            />
                                                                                                        </div>
                                                                                                        <div className="w-full md:w-56">
                                                                                                            <Field
                                                                                                                label="Precio (€)"
                                                                                                                value={ticketDraft.price}
                                                                                                                onChange={(e) => setTicketDrafts((prev) => ({ ...prev, [s.id]: { ...(prev?.[s.id] ?? {}), price: e.target.value } }))}
                                                                                                                error={null}
                                                                                                                placeholder="0.00"
                                                                                                            />
                                                                                                        </div>
                                                                                                        <div className="w-full md:w-44">
                                                                                                            <Field
                                                                                                                label="Stock"
                                                                                                                value={ticketDraft.stock}
                                                                                                                onChange={(e) => setTicketDrafts((prev) => ({ ...prev, [s.id]: { ...(prev?.[s.id] ?? {}), stock: e.target.value } }))}
                                                                                                                error={null}
                                                                                                                placeholder="0"
                                                                                                            />
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    <div className="w-full md:w-auto md:ml-auto">
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            className="btn-primary px-6 py-3 text-sm w-full"
                                                                                                            onClick={() => {
                                                                                                                const payload = {
                                                                                                                    code: ticketDraft.code,
                                                                                                                    price: ticketDraft.price,
                                                                                                                    stock: ticketDraft.stock,
                                                                                                                    description: ticketDraft.description ?? null,
                                                                                                                    legal_terms: ticketDraft.legal_terms ?? null,
                                                                                                                    image: ticketDraft.image ?? null,
                                                                                                                    is_active: 1,
                                                                                                                };
                                                                                                                router.post(route('admin.events.ticket-types.upsert', s.id), payload, { preserveScroll: true, forceFormData: true });
                                                                                                            }}
                                                                                                        >
                                                                                                            Crear ticket
                                                                                                        </button>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <CollapsibleTextArea
                                                                                                    label="Descripción del ticket"
                                                                                                    value={ticketDraft.description ?? ''}
                                                                                                    onChange={(e) =>
                                                                                                        setTicketDrafts((prev) => ({
                                                                                                            ...prev,
                                                                                                            [s.id]: { ...(prev?.[s.id] ?? {}), description: e.target.value },
                                                                                                        }))
                                                                                                    }
                                                                                                    error={null}
                                                                                                    defaultOpen={true}
                                                                                                />
                                                                                                <CollapsibleTextArea
                                                                                                    label="Condiciones legales"
                                                                                                    value={ticketDraft.legal_terms ?? ''}
                                                                                                    onChange={(e) =>
                                                                                                        setTicketDrafts((prev) => ({
                                                                                                            ...prev,
                                                                                                            [s.id]: { ...(prev?.[s.id] ?? {}), legal_terms: e.target.value },
                                                                                                        }))
                                                                                                    }
                                                                                                    error={null}
                                                                                                    defaultOpen={true}
                                                                                                />
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
                        )}

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
                                                const stockValue = Number(ed.stock ?? t.stock ?? 0);
                                                const isExpired = (() => {
                                                    try {
                                                        if (!event?.end_at) return false;
                                                        return new Date(event.end_at).getTime() < Date.now();
                                                    } catch {
                                                        return false;
                                                    }
                                                })();
                                                const canBeActive = !isExpired && stockValue > 0;
                                                const effectiveActive = canBeActive ? !!(ed.is_active ?? t.is_active) : false;

                                                return (
                                                    <div key={t.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                                            <div className="min-w-0 flex items-center gap-4">
                                                                <p className="font-black text-sm uppercase tracking-widest">{t.code}</p>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-gray-500">Activo</span>
                                                                    <InlineSwitch
                                                                        checked={effectiveActive}
                                                                        disabled={!canBeActive}
                                                                        onChange={(checked) =>
                                                                            setTicketTypeEdits((prev) => ({
                                                                                ...prev,
                                                                                [t.id]: { ...(prev?.[t.id] ?? {}), is_active: checked },
                                                                            }))
                                                                        }
                                                                    />
                                                                </div>
                                                                {isExpired ? <span className="text-xs font-bold text-red-400">FINALIZADO</span> : null}
                                                                {!isExpired && stockValue <= 0 ? <span className="text-xs font-bold text-red-400">AGOTADO</span> : null}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                                                            <div className="flex items-center gap-4">
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    ref={(el) => {
                                                                        if (!el) return;
                                                                        ticketTypeInputRefs.current[t.id] = el;
                                                                    }}
                                                                    onChange={(e) => setTicketTypeImages((prev) => ({ ...prev, [t.id]: e.target.files?.[0] ?? null }))}
                                                                />
                                                                <TicketImageBox
                                                                    previewUrl={preview}
                                                                    onPick={() => ticketTypeInputRefs.current?.[t.id]?.click()}
                                                                    onDropFile={(f) => setTicketTypeImages((prev) => ({ ...prev, [t.id]: f }))}
                                                                    onRemove={() => {
                                                                        if (draftImage instanceof File) {
                                                                            setTicketTypeImages((prev) => ({ ...prev, [t.id]: null }));
                                                                            return;
                                                                        }
                                                                        if (t.image_url) {
                                                                            deleteTicketTypeImage(t.id);
                                                                        }
                                                                    }}
                                                                />
                                                            </div>

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
                                                                <div className="flex items-start justify-end gap-3 pt-7">
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
                                                            <div className="lg:col-span-4">
                                                                <CollapsibleTextArea
                                                                    label="Descripción del ticket"
                                                                    value={ed.description ?? ''}
                                                                    onChange={(e) =>
                                                                        setTicketTypeEdits((prev) => ({
                                                                            ...prev,
                                                                            [t.id]: { ...(prev?.[t.id] ?? {}), description: e.target.value },
                                                                        }))
                                                                    }
                                                                    error={null}
                                                                    defaultOpen={false}
                                                                />
                                                            </div>
                                                            <div className="lg:col-span-4">
                                                                <CollapsibleTextArea
                                                                    label="Condiciones legales"
                                                                    value={ed.legal_terms ?? ''}
                                                                    onChange={(e) =>
                                                                        setTicketTypeEdits((prev) => ({
                                                                            ...prev,
                                                                            [t.id]: { ...(prev?.[t.id] ?? {}), legal_terms: e.target.value },
                                                                        }))
                                                                    }
                                                                    error={null}
                                                                    defaultOpen={false}
                                                                />
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
                                        <div className="flex flex-col gap-4">
                                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                                <div className="shrink-0">
                                                    <input
                                                        ref={ticketTypeCreateImageRef}
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => ticketTypeForm.setData('image', e.target.files?.[0] ?? null)}
                                                    />
                                                    <TicketImageBox
                                                        previewUrl={ticketTypeForm.data.image instanceof File ? URL.createObjectURL(ticketTypeForm.data.image) : null}
                                                        onPick={() => ticketTypeCreateImageRef.current?.click()}
                                                        onRemove={() => ticketTypeForm.setData('image', null)}
                                                        onDropFile={(f) => ticketTypeForm.setData('image', f)}
                                                        size="sm"
                                                    />
                                                </div>
                                                <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1 min-w-0">
                                                    <div className="w-full md:max-w-[22rem]">
                                                        <CustomSelect
                                                            label="Tipo"
                                                            value={ticketTypeForm.data.code}
                                                            options={[
                                                                { value: 'vip', label: 'VIP' },
                                                                { value: 'standard', label: 'Standard' },
                                                            ]}
                                                            onChange={(val) => ticketTypeForm.setData('code', val)}
                                                            error={ticketTypeForm.errors.code}
                                                        />
                                                    </div>
                                                    <div className="w-full md:w-56">
                                                        <Field
                                                            label="Precio (€)"
                                                            value={ticketTypeForm.data.price}
                                                            onChange={(e) => ticketTypeForm.setData('price', e.target.value)}
                                                            error={ticketTypeForm.errors.price}
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                    <div className="w-full md:w-44">
                                                        <Field
                                                            label="Stock"
                                                            value={ticketTypeForm.data.stock}
                                                            onChange={(e) => ticketTypeForm.setData('stock', e.target.value)}
                                                            error={ticketTypeForm.errors.stock}
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="w-full md:w-auto md:ml-auto">
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
                                            <CollapsibleTextArea
                                                label="Descripción del ticket"
                                                value={ticketTypeForm.data.description}
                                                onChange={(e) => ticketTypeForm.setData('description', e.target.value)}
                                                error={ticketTypeForm.errors.description}
                                                defaultOpen={true}
                                            />
                                            <CollapsibleTextArea
                                                label="Condiciones legales"
                                                value={ticketTypeForm.data.legal_terms}
                                                onChange={(e) => ticketTypeForm.setData('legal_terms', e.target.value)}
                                                error={ticketTypeForm.errors.legal_terms}
                                                defaultOpen={true}
                                            />
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
    const buttonRef = useRef(null);
    const menuRef = useRef(null);
    const [menuStyle, setMenuStyle] = useState(null);

    const selected = useMemo(() => {
        return options?.find((o) => String(o.value) === String(value)) ?? options?.[0] ?? { value: '', label: '' };
    }, [options, value]);

    useEffect(() => {
        const onDoc = (e) => {
            if (!rootRef.current) return;
            if (rootRef.current.contains(e.target)) return;
            if (menuRef.current && menuRef.current.contains(e.target)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, []);

    useEffect(() => {
        if (!open) return;
        const update = () => {
            if (!buttonRef.current) return;
            const rect = buttonRef.current.getBoundingClientRect();
            const width = Math.max(220, rect.width);
            const left = Math.min(rect.left, window.innerWidth - width - 12);
            const top = Math.min(rect.bottom + 8, window.innerHeight - 100);
            setMenuStyle({
                position: 'fixed',
                top,
                left,
                width,
            });
        };
        update();
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [open]);

    return (
        <div ref={rootRef} className="relative">
            {label ? <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{label}</label> : null}
            <button
                type="button"
                disabled={disabled}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pr-10 text-left flex items-center justify-between gap-3 disabled:opacity-60"
                onClick={() => setOpen((o) => !o)}
                ref={buttonRef}
            >
                <span className="truncate text-gray-200">{selected?.label ?? ''}</span>
                <FiChevronDown className={`shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} size={21} />
            </button>
            {open && !disabled && menuStyle && typeof document !== 'undefined'
                ? createPortal(
                      <div
                          ref={menuRef}
                          style={menuStyle}
                          className="z-[9999] rounded-2xl border border-white/10 bg-black/90 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/60"
                      >
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
                      </div>,
                      document.body
                  )
                : null}
            {error && <div className="text-xs text-red-400 mt-1">{error}</div>}
        </div>
    );
}

function InlineSwitch({ checked, onChange, disabled }) {
    return (
        <span className={`relative inline-flex items-center ${disabled ? 'opacity-60' : ''}`}>
            <input type="checkbox" className="sr-only peer" checked={!!checked} disabled={disabled} onChange={(e) => onChange?.(e.target.checked)} />
            <span className="w-10 h-6 bg-white/10 border border-white/10 rounded-full peer peer-checked:bg-accent-primary/60 peer-checked:border-accent-primary/40 transition-colors" />
            <span className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
        </span>
    );
}

function CollapsibleTextArea({ label, value, onChange, error, defaultOpen = false }) {
    const [open, setOpen] = useState(!!defaultOpen);
    return (
        <div>
            <button type="button" className="inline-flex items-center gap-2 text-left mb-2" onClick={() => setOpen((o) => !o)}>
                <span className="block text-xs font-bold uppercase tracking-widest text-gray-500">{label}</span>
                <FiChevronDown className={`shrink-0 text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} size={18} />
            </button>
            {open ? (
                <>
                    <textarea className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 min-h-32" value={value} onChange={onChange} />
                    {error && <div className="text-xs text-red-400 mt-1">{error}</div>}
                </>
            ) : null}
        </div>
    );
}

function TicketImageBox({ previewUrl, onPick, onRemove, onDropFile, size = 'md', variant = 'square', boxClass }) {
    const [dragOver, setDragOver] = useState(false);
    const sizeClass = size === 'sm' ? 'w-20 h-20' : 'w-28 h-28';
    const defaultBoxClass = variant === 'banner' ? 'w-full aspect-[16/7] rounded-3xl' : variant === 'rect' ? 'w-28 h-20 rounded-2xl' : `${sizeClass} rounded-2xl`;
    const effectiveBoxClass = boxClass || defaultBoxClass;
    const imgClass = variant === 'banner' || variant === 'rect' ? 'w-full h-full object-cover' : 'w-full h-full object-contain';
    return (
        <div
            className={`relative ${effectiveBoxClass} border border-white/10 bg-black/30 overflow-hidden flex items-center justify-center cursor-pointer group ${
                dragOver ? 'ring-2 ring-accent-primary/60 border-accent-primary/40' : ''
            }`}
            onClick={onPick}
            onDragEnter={(e) => {
                e.preventDefault();
                setDragOver(true);
            }}
            onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer?.files?.[0] ?? null;
                if (!f) return;
                if (f.type && !String(f.type).startsWith('image/')) return;
                onDropFile?.(f);
            }}
        >
            {previewUrl ? <img src={previewUrl} alt="Ticket" className={imgClass} /> : <FiPlus size={22} className="text-gray-500" />}
            {previewUrl ? (
                <button
                    type="button"
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove?.();
                    }}
                    aria-label="Eliminar imagen"
                >
                    <FiTrash2 size={22} className="text-white" />
                </button>
            ) : null}
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

function addDaysYMD(ymd, days) {
    const [yyyy, mm, dd] = String(ymd ?? '').split('-').map((v) => Number(v));
    if (!yyyy || !mm || !dd) return ymd;
    const d = new Date(Date.UTC(yyyy, mm - 1, dd));
    d.setUTCDate(d.getUTCDate() + Number(days ?? 0));
    return d.toISOString().slice(0, 10);
}
