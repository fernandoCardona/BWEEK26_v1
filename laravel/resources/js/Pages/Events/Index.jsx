import React from 'react';
import Layout from '@/Layouts/Layout';
import { Link } from '@inertiajs/react';

export default function Index({ events = [] }) {
  return (
    <Layout>
      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-start justify-between gap-4 mb-10">
            <div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-2">Events</h1>
              <p className="text-gray-400">Explora los eventos y sus subeventos, con tickets disponibles.</p>
            </div>
            <Link href={route('tickets.index')} className="btn-secondary px-6 py-3 text-sm">
              Ver tickets
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.length ? (
              events.map((e) => (
                <div key={e.id} className="glass-card p-6 border border-white/10 bg-white/5 overflow-hidden relative">
                  {e.banner_url ? (
                    <div className="absolute inset-0 opacity-25">
                      <img src={e.banner_url} alt="Banner" className="w-full h-full object-cover" />
                    </div>
                  ) : null}
                  <div className="relative">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="text-2xl font-black tracking-tight truncate">{e.name}</h2>
                        {e.address ? <p className="text-xs text-gray-500 mt-1 truncate">{e.address}</p> : null}
                      </div>
                      {e.logo_url ? (
                        <div className="w-14 h-14 rounded-2xl border border-white/10 bg-black/30 overflow-hidden flex items-center justify-center shrink-0">
                          <img src={e.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                        </div>
                      ) : null}
                    </div>
                    {e.description ? <p className="text-gray-400 text-sm mt-4 line-clamp-3">{e.description}</p> : null}
                    <div className="mt-6 flex items-center gap-3">
                      <Link href={route('events.show', e.id)} className="btn-primary px-6 py-3 text-sm">
                        Ver detalle
                      </Link>
                      <Link href={route('tickets.index')} className="btn-secondary px-6 py-3 text-sm">
                        Comprar tickets
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full glass-card p-8 border border-white/10 bg-white/5 text-gray-400">No hay eventos disponibles.</div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

