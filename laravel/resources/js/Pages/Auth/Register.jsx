import React, { useState } from 'react';
import Layout from '@/Layouts/Layout';
import { Link, useForm } from '@inertiajs/react';
import CustomSelect from '@/Components/CustomSelect';

export default function Register() {
  const [codeSent, setCodeSent] = useState(false);

  const requestForm = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    preferred_locale: 'en',
  });

  const verifyForm = useForm({
    email: '',
    verification_code: '',
  });

  const sendCode = (e) => {
    e.preventDefault();
    requestForm.post(route('register.request_code'), {
      preserveScroll: true,
      onSuccess: () => {
        verifyForm.setData('email', requestForm.data.email);
        setCodeSent(true);
      },
    });
  };

  const verify = (e) => {
    e.preventDefault();
    verifyForm.post(route('register'), { preserveScroll: true });
  };

  return (
    <Layout>
      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-8">Registrarse</h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-6">Crear cuenta</h2>
              <form onSubmit={sendCode} className="space-y-4">
                <Field label="Nombre" value={requestForm.data.name} onChange={(e) => requestForm.setData('name', e.target.value)} error={requestForm.errors.name} />
                <Field label="Email" type="email" value={requestForm.data.email} onChange={(e) => requestForm.setData('email', e.target.value)} error={requestForm.errors.email} />
                <CustomSelect
                  label="Idioma predeterminado"
                  value={requestForm.data.preferred_locale}
                  onChange={(v) => requestForm.setData('preferred_locale', v)}
                  disabled={requestForm.processing}
                  options={[
                    { value: 'es', label: 'Español (ES)' },
                    { value: 'ca', label: 'Català (CA)' },
                    { value: 'en', label: 'English (EN)' },
                    { value: 'fr', label: 'Français (FR)' },
                    { value: 'it', label: 'Italiano (IT)' },
                    { value: 'de', label: 'Deutsch (DE)' },
                  ]}
                />
                <Field
                  label="Contraseña"
                  type="password"
                  value={requestForm.data.password}
                  onChange={(e) => requestForm.setData('password', e.target.value)}
                  error={requestForm.errors.password}
                />
                <Field
                  label="Confirmar contraseña"
                  type="password"
                  value={requestForm.data.password_confirmation}
                  onChange={(e) => requestForm.setData('password_confirmation', e.target.value)}
                  error={requestForm.errors.password_confirmation}
                />
                <div className="flex items-center justify-end pt-2">
                  <button type="submit" className="btn-primary px-6 py-3 text-sm" disabled={requestForm.processing}>
                    Enviar código
                  </button>
                </div>
              </form>
            </div>

            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-3">Verificación</h2>
              <p className="text-sm text-gray-400 mb-6">
                Recibirás un código por email para completar el registro.
              </p>
              <form onSubmit={verify} className="space-y-4">
                <Field
                  label="Email"
                  type="email"
                  value={verifyForm.data.email}
                  onChange={(e) => verifyForm.setData('email', e.target.value)}
                  error={verifyForm.errors.email}
                  disabled={codeSent}
                />
                <Field
                  label="Código de verificación"
                  value={verifyForm.data.verification_code}
                  onChange={(e) => verifyForm.setData('verification_code', e.target.value)}
                  error={verifyForm.errors.verification_code}
                  disabled={!codeSent}
                />
                <div className="flex items-center justify-end pt-2">
                  <button type="submit" className="btn-primary px-6 py-3 text-sm" disabled={verifyForm.processing || !codeSent}>
                    Crear cuenta
                  </button>
                </div>
              </form>
              <div className="mt-6 text-sm text-gray-400">
                ¿Ya tienes cuenta?{' '}
                <Link href={route('login')} className="link-hover-gradient">
                  Acceder
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Field({ label, type = 'text', value, onChange, error, disabled }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{label}</label>
      <input
        type={type}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
      {error && <div className="text-xs text-red-400 mt-1">{error}</div>}
    </div>
  );
}
