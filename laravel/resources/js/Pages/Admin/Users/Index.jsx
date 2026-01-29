import React, { useEffect, useMemo, useRef, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import useLockBodyScroll from '@/hooks/useLockBodyScroll';
import { formatDMY, formatTimeHM } from '@/utils/date';
import ImagePickerBox from '@/Components/ImagePickerBox';
import SwitchToggle from '@/Components/SwitchToggle';

export default function Index({ users, filters, selectedUser, selectedTickets, selectedTransactions, selectedCart, selectedStats, can }) {
    const { props } = usePage();
    const authRole = props?.auth?.user?.role;
    const authUserId = props?.auth?.user?.id;
    const [q, setQ] = useState(filters?.q ?? '');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [openTxId, setOpenTxId] = useState(null);
    useLockBodyScroll(createOpen || !!deleteTarget || !!openTxId);
    const avatarInputRef = useRef(null);

    useEffect(() => {
        setQ(filters?.q ?? '');
    }, [filters?.q]);

    useEffect(() => {
        const t = setTimeout(() => {
            const current = filters?.q ?? '';
            if (q === current) return;
            const target = selectedUser ? route('admin.users.show', selectedUser.id) : route('admin.users.index');
            router.get(target, q ? { q } : {}, { preserveState: true, replace: true });
        }, 300);
        return () => clearTimeout(t);
    }, [q]);

    const selectedId = selectedUser?.id;
    const usersData = users?.data ?? [];
    const statusMeta = (status) => {
        const key = String(status || '').toLowerCase();
        if (key === 'failed') return { label: 'FAILED', cls: 'text-red-400' };
        if (key === 'pending') return { label: 'PENDING', cls: 'text-amber-400' };
        if (key === 'completed' || key === 'success') return { label: 'SUCCESS', cls: 'text-emerald-400' };
        return { label: String(status || '').toUpperCase() || '—', cls: 'text-gray-500' };
    };

    const isSuccessStatus = (status) => {
        const key = String(status || '').toLowerCase();
        return key === 'completed' || key === 'success';
    };

    const txSummary = (tx) => {
        const items = tx?.items ?? [];
        const first = items[0];
        const firstTitle =
            first?.title ||
            first?.product?.name?.es ||
            first?.product?.name?.en ||
            first?.ticket?.event?.name?.es ||
            first?.ticket?.event?.name?.en ||
            'Item';
        const extra = items.length > 1 ? ` +${items.length - 1}` : '';
        const hasTicket = items.some((it) => it?.kind === 'ticket' || !!it?.ticket);
        const ticketHint = hasTicket ? ' + ticket' : '';
        return `${firstTitle}${extra}${ticketHint}`;
    };

    const profileForm = useForm({
        name: selectedUser?.name ?? '',
        last_name: selectedUser?.last_name ?? '',
        nickname: selectedUser?.nickname ?? '',
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
        avatar: null,
        remove_avatar: false,
    });

    const roleForm = useForm({
        role: selectedUser?.role ?? 'user',
    });

    useEffect(() => {
        profileForm.setData({
            name: selectedUser?.name ?? '',
            last_name: selectedUser?.last_name ?? '',
            nickname: selectedUser?.nickname ?? '',
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
            avatar: null,
            remove_avatar: false,
        });
        roleForm.setData('role', selectedUser?.role ?? 'user');
        profileForm.clearErrors();
        roleForm.clearErrors();
    }, [selectedId]);

    const submitSearch = (e) => {
        e.preventDefault();
        const target = selectedUser ? route('admin.users.show', selectedUser.id) : route('admin.users.index');
        router.get(target, q ? { q } : {}, { preserveState: true, replace: true });
    };

    const submitUpdateUser = (e) => {
        e.preventDefault();
        if (!selectedUser) return;
        profileForm.patch(route('admin.users.update', selectedUser.id), { preserveScroll: true, forceFormData: true });
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

    const toggleUserActive = (userId) => {
        router.patch(route('admin.users.active', userId), {}, { preserveScroll: true });
    };

    const deleteUser = (userId) => {
        router.delete(route('admin.users.destroy', userId), { preserveScroll: true, onFinish: () => setDeleteTarget(null) });
    };

    const createForm = useForm({
        name: '',
        last_name: '',
        nickname: '',
        email: '',
        phone: '',
        role: 'user',
    });

    const submitCreate = (e) => {
        e.preventDefault();
        createForm.post(route('admin.users.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const stats = selectedStats ?? null;
    const transactions = selectedTransactions ?? [];
    const cart = selectedCart ?? null;

    const selectedTitle = useMemo(() => {
        if (!selectedUser) return null;
        const full = [selectedUser.name, selectedUser.last_name].filter(Boolean).join(' ');
        return full || selectedUser.email;
    }, [selectedId]);

    const [avatarObjectUrl, setAvatarObjectUrl] = useState(null);
    useEffect(() => {
        if (!(profileForm.data.avatar instanceof File)) {
            setAvatarObjectUrl(null);
            return undefined;
        }
        const url = URL.createObjectURL(profileForm.data.avatar);
        setAvatarObjectUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [profileForm.data.avatar]);

    const avatarPreview = useMemo(() => {
        if (profileForm.data.remove_avatar) return null;
        if (avatarObjectUrl) return avatarObjectUrl;
        return selectedUser?.avatar_url ?? null;
    }, [avatarObjectUrl, profileForm.data.remove_avatar, selectedId, selectedUser?.avatar_url]);

    const canManageSelected =
        !!selectedUser &&
        selectedUser.id !== authUserId &&
        ((authRole === 'super_admin' && selectedUser.role !== 'super_admin') || (authRole === 'admin' && selectedUser.role === 'user'));

    const openTx = useMemo(() => transactions.find((t) => t.id === openTxId) ?? null, [openTxId, transactions]);

    return (
        <AdminLayout active="users" headTitle="Admin • Users">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4">
                    {authRole === 'super_admin' && (
                        <button className="btn-primary w-full py-3 text-sm mb-4" type="button" onClick={() => setCreateOpen(true)}>
                            Crear usuario
                        </button>
                    )}
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
                                const displayName = [u.name, u.last_name].filter(Boolean).join(' ') || u.email;
                                return (
                                    <Link
                                        key={u.id}
                                        href={route('admin.users.show', u.id, filters?.q ? { q: filters.q } : {})}
                                        className={`block rounded-2xl border px-4 py-3 transition-all ${
                                            isActive ? 'border-accent-primary/40 bg-white/5' : 'border-white/10 hover:bg-white/5'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm truncate">{displayName}</p>
                                                <p className="text-xs text-gray-500 truncate">{u.email}</p>
                                            </div>
                                            <span className="shrink-0 text-[10px] uppercase tracking-widest text-accent-primary bg-accent-primary/10 border border-accent-primary/20 rounded-lg px-2 py-1">
                                                {u.role}
                                            </span>
                                        </div>
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
                                            {selectedUser.created_at ? `${formatDMY(selectedUser.created_at)} ${formatTimeHM(selectedUser.created_at)}` : '-'}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4">
                                        {canManageSelected && (
                                            <label className="inline-flex items-center gap-3 text-sm text-gray-300 select-none">
                                                <span className="text-xs text-gray-400">{selectedUser.is_active ? 'Activo' : 'Desactivado'}</span>
                                                <span className="relative inline-flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={!!selectedUser.is_active}
                                                        onChange={() => toggleUserActive(selectedUser.id)}
                                                    />
                                                    <span className="w-11 h-6 bg-white/10 border border-white/10 rounded-full peer peer-checked:bg-accent-primary/60 peer-checked:border-accent-primary/40 transition-colors" />
                                                    <span className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                                                </span>
                                            </label>
                                        )}
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
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Imagen (opcional)</label>
                                        <input
                                            ref={avatarInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                profileForm.setData('remove_avatar', false);
                                                profileForm.setData('avatar', e.target.files?.[0] ?? null);
                                            }}
                                        />
                                        <div className="flex items-start gap-6">
                                            <ImagePickerBox
                                                previewUrl={avatarPreview}
                                                onPick={() => avatarInputRef.current?.click()}
                                                onRemove={() => {
                                                    profileForm.setData('avatar', null);
                                                    profileForm.setData('remove_avatar', true);
                                                }}
                                                size="md"
                                                fit="cover"
                                            />
                                            <div className="flex-1 text-sm text-gray-400 pt-1">
                                                Haz click para subir. Pasa el ratón sobre la imagen para eliminarla.
                                            </div>
                                        </div>
                                        {profileForm.errors.avatar && <div className="text-xs text-red-400 mt-1">{profileForm.errors.avatar}</div>}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Field label="Nombre" value={profileForm.data.name} onChange={(e) => profileForm.setData('name', e.target.value)} error={profileForm.errors.name} />
                                        <Field label="Apellidos" value={profileForm.data.last_name} onChange={(e) => profileForm.setData('last_name', e.target.value)} error={profileForm.errors.last_name} />
                                    </div>
                                    <Field label="Nickname (opcional)" value={profileForm.data.nickname} onChange={(e) => profileForm.setData('nickname', e.target.value)} error={profileForm.errors.nickname} />
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
                                        <Field label="País" value={profileForm.data.country} onChange={(e) => profileForm.setData('country', e.target.value)} error={profileForm.errors.country} />
                                    </div>
                                    <SwitchToggle checked={profileForm.data.no_newsletter} onChange={(v) => profileForm.setData('no_newsletter', v)} labelOn="No quiero recibir newsletter" labelOff="Sí quiero recibir newsletter" />
                                    <div className="flex items-center justify-end pt-2">
                                        <button className="btn-primary px-6 py-3 text-sm" disabled={profileForm.processing}>
                                            Guardar cambios
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="glass-card p-6">
                                <h3 className="text-xl font-bold mb-6">Carrito</h3>
                                {(cart?.items ?? []).length ? (
                                    <div className="space-y-3">
                                        {cart.items.map((i) => (
                                            <div key={i.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm truncate">{i.product?.name?.es || i.product?.name?.en || 'Producto'}</p>
                                                    <p className="text-xs text-gray-500">x{i.quantity}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-sm font-bold">{i.unit_price}€</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400">El carrito está vacío.</p>
                                )}
                            </div>

                            <div className="glass-card p-6">
                                <h3 className="text-xl font-bold mb-6">Transacciones</h3>
                                {transactions.length ? (
                                    <div className="space-y-3">
                                        {transactions.map((t) => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setOpenTxId(t.id)}
                                                className="w-full text-left p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-sm truncate">
                                                            {t.type === 'ticket' ? 'Tickets' : t.type === 'merch' ? 'Merchandising' : 'Transacción'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {t.created_at ? `${formatDMY(t.created_at)} ${formatTimeHM(t.created_at)}` : '-'} • {t.items?.length ?? 0} items
                                                        </p>
                                                        <p className="text-xs text-gray-400 truncate mt-1">{txSummary(t)}</p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-sm font-black">{t.total_amount}€</p>
                                                        <p className={`text-[10px] uppercase tracking-widest font-black ${statusMeta(t.status).cls}`}>{statusMeta(t.status).label}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400">No hay transacciones asociadas a este usuario.</p>
                                )}
                            </div>

                            <div className="glass-card p-6">
                                <h3 className="text-xl font-bold mb-2">Reset password</h3>
                                <p className="text-gray-400 mb-6">
                                    Esta acción enviará un email al usuario con un enlace seguro para cambiar su contraseña. El usuario podrá acceder al enlace y definir una nueva contraseña.
                                </p>
                                <button onClick={sendReset} className="btn-secondary px-6 py-3 text-sm">
                                    Enviar reset password
                                </button>
                            </div>

                            {canManageSelected && (
                                <div className="glass-card p-6">
                                    <h3 className="text-xl font-bold mb-2">Eliminar usuario</h3>
                                    <p className="text-gray-400 mb-6">
                                        Esta acción es permanente. Al eliminar el usuario se perderá su acceso y sus datos asociados (incluyendo tickets y compras si aplican).
                                    </p>
                                    <button
                                        type="button"
                                        className="w-full px-6 py-3 text-sm rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white transition-colors"
                                        onClick={() => setDeleteTarget(selectedUser)}
                                    >
                                        Eliminar usuario
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {openTx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6" onClick={() => setOpenTxId(null)}>
                    <div
                        className="glass-card max-w-3xl w-full p-6 border border-white/10 bg-white/10 shadow-2xl shadow-black/60"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {(() => {
                            const items = openTx.items ?? [];
                            const subtotal = items.reduce((sum, it) => sum + Number(it.total_price || 0), 0);
                            const total = Number(openTx.total_amount || 0);
                            const taxes = Math.max(0, Number((total - subtotal).toFixed(2)));
                            const success = isSuccessStatus(openTx.status);
                            const docTitle = success ? 'INVOICE' : 'PRO FORMA INVOICE';
                            const note =
                                String(openTx.status || '').toLowerCase() === 'failed'
                                    ? 'Pago fallido. Documento provisional (pro forma) sin validez de factura.'
                                    : String(openTx.status || '').toLowerCase() === 'pending'
                                      ? 'Pago pendiente. Documento provisional (pro forma) hasta confirmación.'
                                      : success
                                        ? 'Factura emitida para esta compra.'
                                        : 'Documento provisional.';
                            return (
                                <>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="text-[11px] text-gray-500 uppercase tracking-widest font-bold">{docTitle}</div>
                                            <h3 className="text-2xl font-black tracking-tight truncate mt-1">
                                                {openTx.type === 'ticket' ? 'Tickets' : openTx.type === 'merch' ? 'Merchandising' : 'Transacción'}
                                            </h3>
                                            <div className="text-sm text-gray-400 flex items-center gap-3 mt-1">
                                                <span>{openTx.created_at ? `${formatDMY(openTx.created_at)} ${formatTimeHM(openTx.created_at)}` : '-'}</span>
                                                <span className={`uppercase tracking-widest font-black ${statusMeta(openTx.status).cls}`}>{statusMeta(openTx.status).label}</span>
                                            </div>
                                        </div>
                                        <button className="btn-secondary px-4 py-2 text-sm" onClick={() => setOpenTxId(null)}>
                                            Cerrar
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Bill To</div>
                                            <div className="text-sm font-black">{selectedUser?.name || '—'} {selectedUser?.last_name || ''}</div>
                                            <div className="text-xs text-gray-400 mt-1">{selectedUser?.email || '—'}</div>
                                            {selectedUser?.address_line1 ? <div className="text-xs text-gray-400 mt-2">{selectedUser.address_line1}</div> : null}
                                            {selectedUser?.address_line2 ? <div className="text-xs text-gray-400">{selectedUser.address_line2}</div> : null}
                                            {(selectedUser?.postal_code || selectedUser?.city || selectedUser?.country) ? (
                                                <div className="text-xs text-gray-400">
                                                    {[selectedUser?.postal_code, selectedUser?.city, selectedUser?.country].filter(Boolean).join(' • ')}
                                                </div>
                                            ) : null}
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Details</div>
                                            <div className="text-xs text-gray-400">Invoice #: <span className="font-black text-gray-200">{openTx.id}</span></div>
                                            <div className="text-xs text-gray-400 mt-1">Currency: <span className="font-black text-gray-200">{(openTx.currency || 'EUR').toUpperCase()}</span></div>
                                            <div className="text-xs text-gray-400 mt-1">Items: <span className="font-black text-gray-200">{items.length}</span></div>
                                        </div>
                                    </div>

                                    <div className="mt-6 border border-white/10 rounded-2xl overflow-hidden">
                                        <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-white/5 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                                            <div className="col-span-6">Descripción</div>
                                            <div className="col-span-2 text-right">Cant.</div>
                                            <div className="col-span-2 text-right">Unit</div>
                                            <div className="col-span-2 text-right">Importe</div>
                                        </div>
                                        <div className="divide-y divide-white/10">
                                            {items.map((it) => (
                                                <div key={it.id} className="grid grid-cols-12 gap-3 px-4 py-3">
                                                    <div className="col-span-6 min-w-0">
                                                        <div className="text-sm font-black truncate">{it.title || 'Item'}</div>
                                                        {it.ticket?.event ? (
                                                            <div className="text-xs text-gray-400 truncate">{it.ticket.event.name?.es || it.ticket.event.name?.en || 'Evento'}</div>
                                                        ) : null}
                                                    </div>
                                                    <div className="col-span-2 text-right text-sm font-bold text-gray-200">{Number(it.quantity || 0)}</div>
                                                    <div className="col-span-2 text-right text-sm font-bold text-gray-200">{Number(it.unit_price || 0).toFixed(2)}€</div>
                                                    <div className="col-span-2 text-right text-sm font-black">{Number(it.total_price || 0).toFixed(2)}€</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                        <div className="text-xs text-gray-400">{note}</div>
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                            <div className="flex items-center justify-between text-sm text-gray-400">
                                                <span>Subtotal</span>
                                                <span className="font-black text-gray-200">{subtotal.toFixed(2)}€</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm text-gray-400 mt-2">
                                                <span>Impuestos</span>
                                                <span className="font-black text-gray-200">{taxes.toFixed(2)}€</span>
                                            </div>
                                            <div className="h-px bg-white/10 my-3" />
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-gray-300">Total</span>
                                                <span className="text-2xl font-black">{total.toFixed(2)}€</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
            {createOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
                    <div className="glass-card max-w-lg w-full p-6 border border-white/10 bg-white/10 shadow-2xl shadow-black/60">
                        <h3 className="text-2xl font-black tracking-tight mb-2">Crear usuario</h3>
                        <p className="text-gray-400 mb-6">Se creará la cuenta y se enviará un email para definir la contraseña.</p>
                        <form onSubmit={submitCreate} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Nombre" value={createForm.data.name} onChange={(e) => createForm.setData('name', e.target.value)} error={createForm.errors.name} />
                                <Field label="Apellidos" value={createForm.data.last_name} onChange={(e) => createForm.setData('last_name', e.target.value)} error={createForm.errors.last_name} />
                            </div>
                            <Field label="Nickname (opcional)" value={createForm.data.nickname} onChange={(e) => createForm.setData('nickname', e.target.value)} error={createForm.errors.nickname} />
                            <Field label="Email" type="email" value={createForm.data.email} onChange={(e) => createForm.setData('email', e.target.value)} error={createForm.errors.email} />
                            <Field label="Móvil" value={createForm.data.phone} onChange={(e) => createForm.setData('phone', e.target.value)} error={createForm.errors.phone} />
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Rol</label>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                                    value={createForm.data.role}
                                    onChange={(e) => createForm.setData('role', e.target.value)}
                                >
                                    <option value="user">user</option>
                                    <option value="admin">admin</option>
                                    <option value="super_admin">super_admin</option>
                                </select>
                                {createForm.errors.role && <div className="text-xs text-red-400 mt-1">{createForm.errors.role}</div>}
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button type="button" className="btn-secondary px-6 py-3 text-sm" onClick={() => setCreateOpen(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary px-6 py-3 text-sm" disabled={createForm.processing}>
                                    Crear
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
                    <div className="glass-card max-w-lg w-full p-6 border border-white/10 bg-white/10 shadow-2xl shadow-black/60">
                        <h3 className="text-2xl font-black tracking-tight mb-2">Eliminar usuario</h3>
                        <p className="text-gray-400 mb-6">
                            ¿Seguro que quieres eliminar a{' '}
                            <span className="text-white font-bold">{[deleteTarget.name, deleteTarget.last_name].filter(Boolean).join(' ') || deleteTarget.email}</span>?
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button type="button" className="btn-secondary px-6 py-3 text-sm" onClick={() => setDeleteTarget(null)}>
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="px-6 py-3 text-sm rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white transition-colors"
                                onClick={() => deleteUser(deleteTarget.id)}
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
