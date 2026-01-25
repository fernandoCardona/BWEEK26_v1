import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Profile() {
  return (
    <AdminLayout active="settings" headTitle="Admin • Settings">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-8">Configuración de Perfil</h1>
          <div className="glass-card p-6">
            <p className="text-gray-400">Vista de configuración de perfil.</p>
          </div>
        </div>
    </AdminLayout>
  );
}
