import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Link, router, useForm, usePage } from '@inertiajs/react';

export default function Index({ users, filters, selectedUser, selectedTickets, selectedStats, can }) {
    const { props } = usePage();
    const authRole = props?.auth?.user?.role;
    const [q, setQ] = useState(filters?.q ?? '');

    useEffect(() => {
        setQ(filters?.q ?? '');
    }, [filters?.q]);

    const selectedId = selectedUser?.id;
    const usersData = users?.data ?? [];

    const profileForm = useForm({
        name: selectedUser?.name ?? '',
        last_name: selectedUser?.last_name ?? '',
        birth_date: selectedUser?.birth_date ?? '',
        gender: selectedUser?.gender ?? 'prefer_not_say',
        email: selectedUser?.email ?? '',
        phone: selectedUser?.phone ?? '',
        address_line1: selectedUser?.address_line1 ?? '',
        address_line2: selectedUser?.address_line2 ?? '',
        city: selectedUser?.city ?? '',
        postal_code: selectedUser?.postal_code ?? '',
        country: selectedUser?.country ?? '',
        no_newsletter: selectedUser ? !(selectedUser.newsletter_subscribed ?? true) : false,
    });

    const roleForm = useForm({
        role: selectedUser?.role ?? 'user',
    });

    useEffect(() => {
        profileForm.setData({
            name: selectedUser?.name ?? '',
            last_name: selectedUser?.last_name ?? '',
            birth_date: selectedUser?.birth_date ?? '',
            gender: selectedUser?.gender ?? 'prefer_not_say',
            email: selectedUser?.email ?? '',
            phone: selectedUser?.phone ?? '',
            address_line1: selectedUser?.address_line1 ?? '',
            address_line2: selectedUser?.address_line2 ?? '',
            city: selectedUser?.city ?? '',
            postal_code: selectedUser?.postal_code ?? '',
            country: selectedUser?.country ?? '',
            no_newsletter: selectedUser ? !(selectedUser.newsletter_subscribed ?? true) : false,
        });
        roleForm.setData('role', selectedUser?.role ?? 'user');
        profileForm.clearErrors();
        roleForm.clearErrors();
    }, [selectedId]);

    const submitSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.users.index'), q ? { q } : {}, { preserveState: true, replace: true });
    };

    const submitUpdateUser = (e) => {
        e.preventDefault();
        if (!selectedUser) return;
        profileForm.patch(route('admin.users.update', selectedUser.id), { preserveScroll: true });
    };

    const submitUpdateRole = (e) => {
        e.preventDefault();
        if (!selectedUser) return;
        roleForm.patch(route('admin.users.role.update', selectedUser.id), { preserveScroll: true });
    };

    const sendReset = () => {
        if (!selectedUser) return;
        router.post(route('admin.users.password.reset', selectedUser.id), {}, { preserveScroll: true });
    };

    const updateTicketStatus = (ticketId, status) => {
        if (!selectedUser) return;
        router.patch(route('admin.users.tickets.update', [selectedUser.id, ticketId]), { status }, { preserveScroll: true });
    };

    const deleteTicket = (ticketId) => {
        if (!selectedUser) return;
        router.delete(route('admin.users.tickets.destroy', [selectedUser.id, ticketId]), { preserveScroll: true });
    };

    const stats = selectedStats ?? null;
    const tickets = selectedTickets ?? [];

    const selectedTitle = useMemo(() => {
        if (!selectedUser) return null;
        const full = [selectedUser.name, selectedUser.last_name].filter(Boolean).join(' ');
        return full || selectedUser.email;
    }, [selectedId]);

    return (
        <AdminLayout active="users" headTitle="Admin • Users">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4">
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">Usuarios</h2>
                            <span className="text-xs text-gray-500">{usersData.length} en página</span>
                        </div>

                        <form onSubmit={submitSearch} className="flex gap-2 mb-4">
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Buscar por email, móvil, nombre o apellidos"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm"
                            />
                            <button className="btn-primary px-4 py-3 text-sm">Buscar</button>
                        </form>

                        <div className="space-y-2">
                            {usersData.map((u) => {
                                const isActive = u.id === selectedId;
                                return (
                                    <Link
                                        key={u.id}
                                        href={route('admin.users.show', u.id, filters?.q ? { q: filters.q } : {})}
                                        className={`block rounded-2xl border px-4 py-3 transition-all ${
                                            isActive ? 'border-accent-primary/40 bg-white/5' : 'border-white/10 hover:bg-white/5'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm truncate">
                                                    {[u.name, u.last_name].filter(Boolean).join(' ') || u.email}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">{u.email}</p>
                                            </div>
                                            <span className="text-[10px] uppercase tracking-widest text-gray-500">{u.role}</span>
                                        </div>
                                        {u.phone && <p className="text-xs text-gray-500 mt-1">{u.phone}</p>}
                                    </Link>
                                );
                            })}
                            {!usersData.length && <p className="text-sm text-gray-400">No hay resultados con ese filtro.</p>}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8">
                    {!selectedUser ? (
                        <div className="glass-card p-10">
                            <h2 className="text-2xl font-black tracking-tight mb-3">Selecciona un usuario</h2>
                            <p className="text-gray-400">Desde la lista de la izquierda puedes buscar y abrir el detalle.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="glass-card p-6">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight">{selectedTitle}</h2>
                                        <p className="text-sm text-gray-500">ID: {selectedUser.id}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Verificado: {selectedUser.email_verified_at ? 'Sí' : 'No'} • Creado:{' '}
                                            {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : '-'}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={sendReset} className="btn-secondary px-4 py-3 text-sm">
                                            Enviar reset password
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                                    <Stat title="Tickets totales" value={stats?.tickets_total ?? 0} />
                                    <Stat title="Tickets activos" value={stats?.tickets_active ?? 0} />
                                    <Stat title="Tickets validados" value={stats?.tickets_validated ?? 0} />
                                    <Stat title="Compras merch" value={stats?.merch_purchases_total ?? 0} />
                                </div>

                                <div className="mt-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">Rol</h3>
                                    </div>
                                    {can?.update_role && authRole === 'super_admin' ? (
                                        <form onSubmit={submitUpdateRole} className="flex flex-wrap items-center gap-3">
                                            <select
                                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm"
                                                value={roleForm.data.role}
                                                onChange={(e) => roleForm.setData('role', e.target.value)}
                                            >
                                                <option value="user">user</option>
                                                <option value="admin">admin</option>
                                                <option value="super_admin">super_admin</option>
                                            </select>
                                            <button className="btn-primary px-4 py-3 text-sm" disabled={roleForm.processing}>
                                                Cambiar rol
                                            </button>
                                            {roleForm.errors.role && <div className="text-sm text-red-400">{roleForm.errors.role}</div>}
                                        </form>
                                    ) : (
                                        <p className="text-sm text-gray-300">{selectedUser.role}</p>
                                    )}
                                </div>
                            </div>

                            <div className="glass-card p-6">
                                <h3 className="text-xl font-bold mb-6">Datos del usuario</h3>
                                <form onSubmit={submitUpdateUser} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Field label="Nombre" value={profileForm.data.name} onChange={(e) => profileForm.setData('name', e.target.value)} error={profileForm.errors.name} />
                                        <Field label="Apellidos" value={profileForm.data.last_name} onChange={(e) => profileForm.setData('last_name', e.target.value)} error={profileForm.errors.last_name} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Field label="Fecha de nacimiento" type="date" value={profileForm.data.birth_date} onChange={(e) => profileForm.setData('birth_date', e.target.value)} error={profileForm.errors.birth_date} />
                                        <SelectField
                                            label="Sexo"
                                            value={profileForm.data.gender}
                                            onChange={(e) => profileForm.setData('gender', e.target.value)}
                                            error={profileForm.errors.gender}
                                            options={[
                                                { value: 'prefer_not_say', label: 'Prefiero no decirlo' },
                                                { value: 'male', label: 'Hombre' },
                                                { value: 'female', label: 'Mujer' },
                                                { value: 'other', label: 'Otro' },
                                            ]}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Field label="Email" type="email" value={profileForm.data.email} onChange={(e) => profileForm.setData('email', e.target.value)} error={profileForm.errors.email} />
                                        <Field label="Móvil" value={profileForm.data.phone} onChange={(e) => profileForm.setData('phone', e.target.value)} error={profileForm.errors.phone} />
                                    </div>
                                    <Field label="Dirección" value={profileForm.data.address_line1} onChange={(e) => profileForm.setData('address_line1', e.target.value)} error={profileForm.errors.address_line1} />
                                    <Field label="Dirección (2)" value={profileForm.data.address_line2} onChange={(e) => profileForm.setData('address_line2', e.target.value)} error={profileForm.errors.address_line2} />
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Field label="Ciudad" value={profileForm.data.city} onChange={(e) => profileForm.setData('city', e.target.value)} error={profileForm.errors.city} />
                                        <Field label="Código postal" value={profileForm.data.postal_code} onChange={(e) => profileForm.setData('postal_code', e.target.value)} error={profileForm.errors.postal_code} />
                                        <Field label="País (ISO)" value={profileForm.data.country} onChange={(e) => profileForm.setData('country', e.target.value.toUpperCase())} error={profileForm.errors.country} />
                                    </div>
                                    <label className="flex items-center gap-3 text-sm text-gray-300 select-none">
                                        <input
                                            type="checkbox"
                                            className="rounded border-white/20 bg-white/5"
                                            checked={profileForm.data.no_newsletter}
                                            onChange={(e) => profileForm.setData('no_newsletter', e.target.checked)}
                                        />
                                        No recibir newsletter
                                    </label>
                                    <button className="btn-primary px-6 py-3 text-sm" disabled={profileForm.processing}>
                                        Guardar cambios
                                    </button>
                                </form>
                            </div>

                            <div className="glass-card p-6">
                                <h3 className="text-xl font-bold mb-6">Compras • Tickets</h3>
                                {tickets.length ? (
                                    <div className="space-y-3">
                                        {tickets.map((t) => (
                                            <div key={t.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm truncate">{t.event?.name?.es || t.event?.name?.en || 'Evento'}</p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {t.ticket_type} • {t.price}€ • {t.purchased_at ? new Date(t.purchased_at).toLocaleString() : '-'}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 mt-1 truncate">QR: {t.qr_code}</p>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <select
                                                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm"
                                                        value={t.status}
                                                        onChange={(e) => updateTicketStatus(t.id, e.target.value)}
                                                    >
                                                        <option value="active">active</option>
                                                        <option value="cancelled">cancelled</option>
                                                        <option value="refunded">refunded</option>
                                                    </select>
                                                    <button onClick={() => deleteTicket(t.id)} className="btn-secondary px-4 py-2 text-sm">
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400">No hay tickets asociados a este usuario.</p>
                                )}
                            </div>

                            <div className="glass-card p-6">
                                <h3 className="text-xl font-bold mb-2">Compras • Merchandising</h3>
                                <p className="text-gray-400">
                                    Pendiente de implementación: no hay tablas de pedidos/lineas de merch en la base de datos todavía.
                                    Cuando añadamos Orders/OrderItems, esta sección mostrará el historial y permitirá gestionar estado/eliminar.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

function Stat({ title, value }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 block">{title}</span>
            <span className="text-3xl font-black">{value}</span>
        </div>
    );
}

function Field({ label, type = 'text', value, onChange, error }) {
    return (
        <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{label}</label>
            <input type={type} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3" value={value} onChange={onChange} />
            {error && <div className="text-xs text-red-400 mt-1">{error}</div>}
        </div>
    );
}

function SelectField({ label, value, onChange, options, error }) {
    return (
        <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{label}</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3" value={value} onChange={onChange}>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            {error && <div className="text-xs text-red-400 mt-1">{error}</div>}
        </div>
    );
}
