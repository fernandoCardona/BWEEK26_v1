import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Index() {
  return (
    <AdminLayout active="ecommerce" headTitle="Admin • Ecommerce">
      <div className="container mx-auto">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-8">Ecommerce</h1>
        <div className="glass-card p-6">
          <p className="text-gray-400">Panel de ecommerce.</p>
        </div>
      </div>
    </AdminLayout>
  );
}
