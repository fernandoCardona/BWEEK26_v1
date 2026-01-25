import React from 'react';
import Layout from '@/Layouts/Layout';
import { useForm, usePage } from '@inertiajs/react';

export default function Edit() {
    const { props } = usePage();
    const user = props?.auth?.user;

    const profileForm = useForm({
        name: user?.name ?? '',
        last_name: user?.last_name ?? '',
        birth_date: user?.birth_date ?? '',
        gender: user?.gender ?? 'prefer_not_say',
        email: user?.email ?? '',
        phone: user?.phone ?? '',
        address_line1: user?.address_line1 ?? '',
        address_line2: user?.address_line2 ?? '',
        city: user?.city ?? '',
        postal_code: user?.postal_code ?? '',
        country: user?.country ?? '',
        no_newsletter: !(user?.newsletter_subscribed ?? true),
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submitProfile = (e) => {
        e.preventDefault();
        profileForm.patch(route('profile.update'));
    };

    const submitPassword = (e) => {
        e.preventDefault();
        passwordForm.put(route('password.update'), {
            onSuccess: () => passwordForm.reset(),
        });
    };

    return (
        <Layout>
            <div className="pt-32 pb-20 px-6">
                <div className="container mx-auto">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-8">Settings</h1>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="glass-card p-6">
                            <h2 className="text-xl font-bold mb-6">Perfil</h2>
                            <form onSubmit={submitProfile} className="space-y-4">
                                <Field
                                    label="Nombre"
                                    value={profileForm.data.name}
                                    onChange={(e) => profileForm.setData('name', e.target.value)}
                                    error={profileForm.errors.name}
                                />
                                <Field
                                    label="Apellidos"
                                    value={profileForm.data.last_name}
                                    onChange={(e) => profileForm.setData('last_name', e.target.value)}
                                    error={profileForm.errors.last_name}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field
                                        label="Fecha de nacimiento"
                                        type="date"
                                        value={profileForm.data.birth_date}
                                        onChange={(e) => profileForm.setData('birth_date', e.target.value)}
                                        error={profileForm.errors.birth_date}
                                    />
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
                                <Field
                                    label="Email"
                                    type="email"
                                    value={profileForm.data.email}
                                    onChange={(e) => profileForm.setData('email', e.target.value)}
                                    error={profileForm.errors.email}
                                />
                                <Field
                                    label="Teléfono"
                                    value={profileForm.data.phone}
                                    onChange={(e) => profileForm.setData('phone', e.target.value)}
                                    error={profileForm.errors.phone}
                                />
                                <Field
                                    label="Dirección"
                                    value={profileForm.data.address_line1}
                                    onChange={(e) => profileForm.setData('address_line1', e.target.value)}
                                    error={profileForm.errors.address_line1}
                                />
                                <Field
                                    label="Dirección (2)"
                                    value={profileForm.data.address_line2}
                                    onChange={(e) => profileForm.setData('address_line2', e.target.value)}
                                    error={profileForm.errors.address_line2}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Field
                                        label="Ciudad"
                                        value={profileForm.data.city}
                                        onChange={(e) => profileForm.setData('city', e.target.value)}
                                        error={profileForm.errors.city}
                                    />
                                    <Field
                                        label="Código postal"
                                        value={profileForm.data.postal_code}
                                        onChange={(e) => profileForm.setData('postal_code', e.target.value)}
                                        error={profileForm.errors.postal_code}
                                    />
                                    <Field
                                        label="País (ISO)"
                                        value={profileForm.data.country}
                                        onChange={(e) => profileForm.setData('country', e.target.value.toUpperCase())}
                                        error={profileForm.errors.country}
                                    />
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

                                <button type="submit" className="btn-primary px-6 py-3 text-sm" disabled={profileForm.processing}>
                                    Guardar cambios
                                </button>
                            </form>
                        </div>

                        <div className="glass-card p-6">
                            <h2 className="text-xl font-bold mb-6">Cambiar contraseña</h2>
                            <form onSubmit={submitPassword} className="space-y-4">
                                <Field
                                    label="Contraseña actual"
                                    type="password"
                                    value={passwordForm.data.current_password}
                                    onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                    error={passwordForm.errors.current_password}
                                />
                                <Field
                                    label="Nueva contraseña"
                                    type="password"
                                    value={passwordForm.data.password}
                                    onChange={(e) => passwordForm.setData('password', e.target.value)}
                                    error={passwordForm.errors.password}
                                />
                                <Field
                                    label="Confirmar contraseña"
                                    type="password"
                                    value={passwordForm.data.password_confirmation}
                                    onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                    error={passwordForm.errors.password_confirmation}
                                />

                                <button type="submit" className="btn-primary px-6 py-3 text-sm" disabled={passwordForm.processing}>
                                    Actualizar contraseña
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

function Field({ label, type = 'text', value, onChange, error }) {
    return (
        <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{label}</label>
            <input
                type={type}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                value={value}
                onChange={onChange}
            />
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
