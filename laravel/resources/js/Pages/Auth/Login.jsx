import React from 'react';
import Layout from '@/Layouts/Layout';
import { Link } from '@inertiajs/react';

export default function Login() {
  return (
    <Layout>
      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-8">Acceder</h1>
          <div className="glass-card p-6">
            <p className="text-gray-400 mb-6">Formulario de login pendiente.</p>
            <Link href="/register" className="btn-primary px-6 py-3">Crear cuenta</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
