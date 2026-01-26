import React, { useMemo, useRef, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { router, useForm } from '@inertiajs/react';
import useLockBodyScroll from '@/hooks/useLockBodyScroll';

export default function Edit({ event, parents, defaults, can }) {
    const isCreate = !event;
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    useLockBodyScroll(confirmDeleteOpen);
    const ticketTypes = event?.ticket_types ?? [];

    const initialStart = event?.start_at ? new Date(event.start_at) : null;
    const initialEnd = event?.end_at ? new Date(event.end_at) : null;

    const bannerInputRef = useRef(null);
    const logoInputRef = useRef(null);
    const flyerInputRef = useRef(null);

    const form = useForm({
        parent_event_id: defaults?.parent_event_id ?? event?.parent_event_id ?? '',
        name: event?.name ?? '',
        description: event?.description ?? '',
        address: event?.address ?? '',
        start_date: initialStart ? formatDateDMY(initialStart) : '',
        end_date: initialEnd ? formatDateDMY(initialEnd) : '',
        start_time: initialStart ? formatTimeHMS(initialStart) : '',
        end_time: initialEnd ? formatTimeHMS(initialEnd) : '',
        is_active: event?.is_active ?? true,
        banner: null,
        logo: null,
        flyer: null,
    });

    const ticketTypeForm = useForm({
        code: 'vip',
        price: '',
        stock: 0,
        is_active: true,
    });

    const bannerPreview = useMemo(() => {
        if (form.data.banner instanceof File) return URL.createObjectURL(form.data.banner);
        return event?.banner_url ?? null;
    }, [form.data.banner, event?.banner_url]);

    const logoPreview = useMemo(() => {
        if (form.data.logo instanceof File) return URL.createObjectURL(form.data.logo);
        return event?.logo_url ?? null;
    }, [form.data.logo, event?.logo_url]);

    const flyerName = useMemo(() => {
        if (form.data.flyer instanceof File) return form.data.flyer.name;
        return event?.flyer_url ? 'Flyer cargado' : 'Ningún archivo seleccionado';
    }, [form.data.flyer, event?.flyer_url]);

    const submit = (e) => {
        e.preventDefault();
        if (isCreate) {
            form.post(route('admin.events.store'), { forceFormData: true, preserveScroll: true });
        } else {
            form.patch(route('admin.events.update', event.id), { forceFormData: true, preserveScroll: true });
        }
    };

    const submitTicketType = (e) => {
        e.preventDefault();
        if (!event) return;
        ticketTypeForm.post(route('admin.events.ticket-types.upsert', event.id), { preserveScroll: true });
    };

    const deleteTicketType = (ticketTypeId) => {
        if (!event) return;
        router.delete(route('admin.events.ticket-types.destroy', [event.id, ticketTypeId]), { preserveScroll: true });
    };

    const destroy = () => {
        if (!event) return;
        router.delete(route('admin.events.destroy', event.id));
    };

    return (
        <AdminLayout active="events" headTitle={`Admin • ${isCreate ? 'Crear evento' : 'Editar evento'}`}>
            <div className="max-w-4xl">
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="min-w-0">
                        <h2 className="text-3xl font-black tracking-tight">{isCreate ? 'Crear evento' : 'Editar evento'}</h2>
                        <p className="text-gray-400">{isCreate ? 'Configura la información del evento.' : 'Actualiza la información del evento.'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {!isCreate && can?.delete && (
                            <button
                                type="button"
                                className="px-6 py-3 text-sm rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white transition-colors"
                                onClick={() => setConfirmDeleteOpen(true)}
                            >
                                Eliminar
                            </button>
                        )}
                    </div>
                </div>

                <div className="glass-card p-6">
                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Tipo</label>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                                    value={form.data.parent_event_id}
                                    disabled={!can?.toggle_active}
                                    onChange={(e) => form.setData('parent_event_id', e.target.value)}
                                >
                                    <option value="">Evento principal</option>
                                    {parents?.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            Subevento de: {p.name?.es || p.name?.en || p.id}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.parent_event_id && <div className="text-xs text-red-400 mt-1">{form.errors.parent_event_id}</div>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Activo</label>
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
                                label="Fecha inicio (dd-mm-yyyy)"
                                placeholder="31-12-2026"
                                value={form.data.start_date}
                                onChange={(e) => form.setData('start_date', e.target.value)}
                                error={form.errors.start_date}
                            />
                            <Field
                                label="Fecha fin (dd-mm-yyyy)"
                                placeholder="31-12-2026"
                                value={form.data.end_date}
                                onChange={(e) => form.setData('end_date', e.target.value)}
                                error={form.errors.end_date}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field
                                label="Hora inicio (hh:mm:ss)"
                                placeholder="18:00:00"
                                value={form.data.start_time}
                                onChange={(e) => form.setData('start_time', e.target.value)}
                                error={form.errors.start_time}
                            />
                            <Field
                                label="Hora fin (hh:mm:ss)"
                                placeholder="23:59:59"
                                value={form.data.end_time}
                                onChange={(e) => form.setData('end_time', e.target.value)}
                                error={form.errors.end_time}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FilePicker
                                label="Banner"
                                previewUrl={bannerPreview}
                                buttonText="Seleccionar banner"
                                fileName={form.data.banner?.name || (event?.banner_url ? 'Banner cargado' : 'Ningún archivo seleccionado')}
                                inputRef={bannerInputRef}
                                onPick={() => bannerInputRef.current?.click()}
                                onFile={(f) => form.setData('banner', f)}
                                error={form.errors.banner}
                            />
                            <FilePicker
                                label="Logo"
                                previewUrl={logoPreview}
                                buttonText="Seleccionar logo"
                                fileName={form.data.logo?.name || (event?.logo_url ? 'Logo cargado' : 'Ningún archivo seleccionado')}
                                inputRef={logoInputRef}
                                onPick={() => logoInputRef.current?.click()}
                                onFile={(f) => form.setData('logo', f)}
                                error={form.errors.logo}
                            />
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Flyer</label>
                                <input ref={flyerInputRef} type="file" className="hidden" onChange={(e) => form.setData('flyer', e.target.files?.[0] ?? null)} />
                                <div className="flex flex-col gap-3">
                                    <button type="button" className="btn-secondary px-6 py-3 text-sm" onClick={() => flyerInputRef.current?.click()}>
                                        Seleccionar flyer
                                    </button>
                                    <span className="text-sm text-gray-300 truncate">{flyerName}</span>
                                    {form.errors.flyer && <div className="text-xs text-red-400">{form.errors.flyer}</div>}
                                </div>
                            </div>
                        </div>

                        {!isCreate && (
                            <div className="pt-2">
                                <div className="glass-card p-6 border border-white/10 bg-white/5">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                                        <div>
                                            <h3 className="text-xl font-bold">Tickets</h3>
                                            <p className="text-sm text-gray-400">VIP y Standard para este evento o subevento.</p>
                                        </div>
                                    </div>

                                    {ticketTypes.length ? (
                                        <div className="space-y-3 mb-6">
                                            {ticketTypes.map((t) => (
                                                <div key={t.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                                                    <div className="min-w-0">
                                                        <p className="font-black text-sm uppercase tracking-widest">{t.code}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {t.price}€ • stock {t.stock} • {t.is_active ? 'activo' : 'inactivo'}
                                                        </p>
                                                    </div>
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
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 mb-6">Todavía no hay tipos de ticket configurados.</p>
                                    )}

                                    {can?.manage_ticket_types && (
                                        <form onSubmit={submitTicketType} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Tipo</label>
                                                <select
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                                                    value={ticketTypeForm.data.code}
                                                    onChange={(e) => ticketTypeForm.setData('code', e.target.value)}
                                                >
                                                    <option value="vip">VIP</option>
                                                    <option value="standard">Standard</option>
                                                </select>
                                                {ticketTypeForm.errors.code && <div className="text-xs text-red-400 mt-1">{ticketTypeForm.errors.code}</div>}
                                            </div>
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
                                                <button type="submit" className="btn-primary w-full px-6 py-3 text-sm" disabled={ticketTypeForm.processing}>
                                                    Guardar ticket
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <button type="submit" className="btn-primary px-6 py-3 text-sm" disabled={form.processing}>
                                Guardar
                            </button>
                            <LinkBack />
                        </div>
                    </form>
                </div>
            </div>

            {confirmDeleteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6" onClick={() => setConfirmDeleteOpen(false)}>
                    <div
                        className="glass-card max-w-lg w-full p-6 border border-white/10 bg-white/10 shadow-2xl shadow-black/60"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-2xl font-black tracking-tight mb-2">Eliminar evento</h3>
                        <p className="text-gray-400 mb-6">Esta acción es permanente. ¿Seguro que quieres eliminar este evento?</p>
                        <div className="flex items-center justify-end gap-3">
                            <button type="button" className="btn-secondary px-6 py-3 text-sm" onClick={() => setConfirmDeleteOpen(false)}>
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="px-6 py-3 text-sm rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white transition-colors"
                                onClick={destroy}
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

function Field({ label, value, onChange, error, placeholder }) {
    return (
        <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{label}</label>
            <input
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
            />
            {error && <div className="text-xs text-red-400 mt-1">{error}</div>}
        </div>
    );
}

function TextArea({ label, value, onChange, error }) {
    return (
        <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{label}</label>
            <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-32" value={value} onChange={onChange} />
            {error && <div className="text-xs text-red-400 mt-1">{error}</div>}
        </div>
    );
}

function FilePicker({ label, previewUrl, buttonText, fileName, inputRef, onPick, onFile, error }) {
    return (
        <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{label}</label>
            <input ref={inputRef} type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
            <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl border border-white/10 bg-white/5 overflow-hidden flex items-center justify-center">
                    {previewUrl ? <img src={previewUrl} alt={label} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-500">Sin</span>}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2">
                        <button type="button" className="btn-secondary px-6 py-3 text-sm" onClick={onPick}>
                            {buttonText}
                        </button>
                        <span className="text-sm text-gray-300 truncate">{fileName}</span>
                        {error && <div className="text-xs text-red-400">{error}</div>}
                    </div>
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

function formatTimeHMS(d) {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}
