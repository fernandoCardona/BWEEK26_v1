import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Index() {
  return (
    <AdminLayout active="marketing" headTitle="Admin • Marketing">
      <div className="container mx-auto">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-8">Marketing</h1>
        <div className="glass-card p-6">
          <p className="text-gray-400">Campañas y analíticas.</p>
        </div>
      </div>
    </AdminLayout>
  );
}
