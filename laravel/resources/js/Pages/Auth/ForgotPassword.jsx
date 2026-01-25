import React from 'react';
import Layout from '@/Layouts/Layout';

export default function ForgotPassword() {
  return (
    <Layout>
      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-8">Recuperar contraseña</h1>
          <div className="glass-card p-6">
            <p className="text-gray-400">Formulario de recuperación pendiente.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
