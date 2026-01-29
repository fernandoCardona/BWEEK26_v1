import React, { useState } from 'react';
import Layout from '@/Layouts/Layout';
import axios from 'axios';

export default function Index({ tickets }) {
  const [adding, setAdding] = useState(null);
  const addToCart = async (ticketTypeId) => {
    setAdding(ticketTypeId);
    try {
      await axios.post(route('cart.items.add'), { kind: 'ticket', event_ticket_type_id: ticketTypeId, quantity: 1 });
      alert('Añadido al carrito');
    } catch (e) {
      if (e?.response?.status === 401) {
        window.location.href = route('login');
        return;
      }
      alert(e?.response?.data?.message ?? 'No se pudo añadir');
    } finally {
      setAdding(null);
    }
  };

  return (
    <Layout>
      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl font-black tracking-tighter mb-6">Entradas</h1>
          <p className="text-gray-400 mb-8">Tickets disponibles de eventos y subeventos.</p>
          <div className="space-y-4">
            {tickets.length ? tickets.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="min-w-0">
                  <p className="font-black text-sm truncate">
                    {(t.code || 'TICKET').toUpperCase()} • {typeof t.event?.name === 'object' ? t.event?.name?.es ?? 'Evento' : t.event?.name ?? 'Evento'}
                  </p>
                  <p className="text-xs text-gray-500">{t.price}€ • stock {t.stock ?? '-'}</p>
                </div>
                <button
                  type="button"
                  className="btn-primary px-4 py-2 text-sm"
                  disabled={adding === t.id || !t.is_active || (t.stock ?? 0) <= 0}
                  onClick={() => addToCart(t.id)}
                >
                  Añadir
                </button>
              </div>
            )) : (
              <div className="glass-card p-6 text-gray-400">No hay tickets disponibles.</div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
