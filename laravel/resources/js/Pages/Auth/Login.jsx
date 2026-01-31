import React from 'react';
import Layout from '@/Layouts/Layout';
import { Link, useForm } from '@inertiajs/react';
import SwitchToggle from '@/Components/SwitchToggle';

export default function Login() {
  const form = useForm({
    email: '',
    password: '',
    remember: false,
  });

  const submit = (e) => {
    e.preventDefault();
    form.post(route('login'), { preserveScroll: true });
  };

  return (
    <Layout>
      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-8">Acceder</h1>
          <div className="max-w-xl">
            <div className="glass-card p-6">
              <form onSubmit={submit} className="space-y-4">
                <Field label="Email" type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} error={form.errors.email} />
                <Field
                  label="Contraseña"
                  type="password"
                  value={form.data.password}
                  onChange={(e) => form.setData('password', e.target.value)}
                  error={form.errors.password}
                />
                <div className="flex items-center justify-between gap-4">
                  <SwitchToggle checked={form.data.remember} onChange={(v) => form.setData('remember', v)} labelOn="Recordarme" labelOff="No recordarme" />
                  <Link href={route('password.request')} className="text-sm link-hover-gradient">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="flex items-center justify-end pt-2">
                  <button type="submit" className="btn-primary px-6 py-3 text-sm" disabled={form.processing}>
                    Entrar
                  </button>
                </div>
              </form>
              <div className="mt-6 text-sm text-gray-400">
                ¿No tienes cuenta?{' '}
                <Link href={route('register')} className="link-hover-gradient">
                  Crear cuenta
                </Link>
              </div>
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
      <input type={type} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3" value={value} onChange={onChange} />
      {error && <div className="text-xs text-red-400 mt-1">{error}</div>}
    </div>
  );
}
