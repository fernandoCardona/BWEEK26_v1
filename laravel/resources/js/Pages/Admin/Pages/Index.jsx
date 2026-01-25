import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Link } from '@inertiajs/react';

export default function Index() {
  const pages = [
    { slug: 'home', title: 'Home' },
    { slug: 'about', title: 'About' },
    { slug: 'shop', title: 'Shop' },
  ];

  return (
    <AdminLayout active="cms" headTitle="Admin • CMS">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-8">CMS Pages</h1>
          <div className="glass-card">
            <table className="w-full text-left">
              <thead>
                <tr className="text-sm text-gray-500">
                  <th className="py-3">Slug</th>
                  <th className="py-3">Title</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr key={p.slug} className="border-t border-white/10">
                    <td className="py-3">{p.slug}</td>
                    <td className="py-3">{p.title}</td>
                    <td className="py-3">
                      <Link href={`/admin/pages/${p.slug}`} className="btn-primary px-4 py-2 text-sm">
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
