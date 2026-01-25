import React from 'react';
import Layout from '@/Layouts/Layout';
import { Link } from '@inertiajs/react';

export default function Category({ category, pages }) {
  return (
    <Layout>
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-8">
            {category.toUpperCase()}
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pages.map((p) => (
              <div key={p.slug} className="glass-card">
                <h3 className="text-2xl font-bold mb-2">{p.title}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {p.has_text ? 'Contenido disponible' : 'Sin texto'}
                </p>
                <Link
                  href={`/${category}/${p.slug}`}
                  className="btn-primary text-sm px-6 py-3"
                >
                  Ver
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
