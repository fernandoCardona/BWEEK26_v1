import React from 'react';
import Layout from '@/Layouts/Layout';
import { Link } from '@inertiajs/react';

export default function Register() {
  return (
    <Layout>
      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-8">Registrarse</h1>
          <div className="glass-card p-6">
            <p className="text-gray-400 mb-6">Formulario de registro pendiente.</p>
            <Link href="/login" className="btn-primary px-6 py-3">Acceder</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
