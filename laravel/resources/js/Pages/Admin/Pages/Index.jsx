import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Link, router, usePage } from '@inertiajs/react';

export default function Index({ pages }) {
  const { props } = usePage();
  const role = props?.auth?.user?.role ?? 'user';
  const canSeed = role === 'super_admin';

  return (
    <AdminLayout active="cms" headTitle="Admin • CMS">
        <div className="container mx-auto">
          <div className="flex items-end justify-between gap-6 mb-8">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter">CMS Pages</h1>
            {canSeed ? (
              <button
                type="button"
                className="btn-secondary px-6 py-3 text-sm"
                onClick={() => router.post(route('admin.pages.seed'), {}, { preserveScroll: true })}
              >
                Crear páginas base
              </button>
            ) : null}
          </div>
          <div className="glass-card">
            <table className="w-full text-left">
              <thead>
                <tr className="text-sm text-gray-500">
                  <th className="py-3">Slug</th>
                  <th className="py-3">Title</th>
                  <th className="py-3">Estado</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(pages ?? []).map((p) => (
                  <tr key={p.slug} className="border-t border-white/10">
                    <td className="py-3">{p.slug}</td>
                    <td className="py-3">{p?.title?.es || p?.title?.en || p.slug}</td>
                    <td className="py-3">
                      <span className={`text-xs font-bold uppercase tracking-widest ${p.is_published ? 'text-green-400' : 'text-gray-500'}`}>
                        {p.is_published ? 'Publicado' : 'Borrador'}
                      </span>
                    </td>
                    <td className="py-3">
                      <Link href={route('admin.pages.edit', p.slug)} className="btn-primary px-4 py-2 text-sm">
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    </AdminLayout>
  );
}
