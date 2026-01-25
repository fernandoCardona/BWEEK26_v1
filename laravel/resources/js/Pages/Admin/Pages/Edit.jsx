import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Edit({ page }) {
  return (
    <AdminLayout active="cms" headTitle="Admin • CMS">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-8">Editar página</h1>
          <div className="glass-card p-6">
            <p className="text-gray-400 mb-4">Slug: {page}</p>
            <form>
              <div className="mb-6">
                <label className="block text-sm font-bold mb-2">Título</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3" />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold mb-2">Contenido</label>
                <textarea rows="8" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3" />
              </div>
              <button type="button" className="btn-primary px-6 py-3">Guardar</button>
            </form>
          </div>
        </div>
    </AdminLayout>
  );
}
