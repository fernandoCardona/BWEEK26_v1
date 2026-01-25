import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Index() {
  return (
    <AdminLayout active="events" headTitle="Admin • Events">
      <div className="container mx-auto">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-8">Eventos</h1>
        <div className="glass-card p-6">
          <p className="text-gray-400">Gestión de eventos.</p>
        </div>
      </div>
    </AdminLayout>
  );
}
