import React, { useMemo, useState } from 'react';
import Layout from '@/Layouts/Layout';
import axios from 'axios';

export default function Show({ product }) {
  const variants = product?.variants ?? [];
  const images = product?.images ?? [];
  const [variantId, setVariantId] = useState(variants[0]?.id ?? null);
  const [qty, setQty] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);

  const selected = useMemo(() => variants.find(v => v.id === variantId) ?? null, [variants, variantId]);
  const currentImage = images[imageIndex]?.path ? images[imageIndex].path : images[imageIndex]?.url;

  const addToCart = async () => {
    try {
      const payload = selected
        ? { kind: 'product', product_variant_id: selected.id, quantity: qty }
        : { kind: 'product', product_id: product.id, quantity: qty };
      await axios.post(route('cart.items.add'), payload);
      alert('Añadido al carrito');
    } catch (e) {
      alert(e?.response?.data?.message ?? 'No se pudo añadir');
    }
  };

  return (
    <Layout>
      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl font-black tracking-tighter mb-2">{product?.name?.es ?? product?.name ?? 'Producto'}</h1>
          <p className="text-gray-400 mb-6">{product?.description?.es ?? '—'}</p>
          <div className="glass-card p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <div className="aspect-square rounded-2xl border border-white/10 bg-white/5 overflow-hidden flex items-center justify-center">
                  {currentImage ? <img src={currentImage} alt="Producto" className="w-full h-full object-contain" /> : <span className="text-xs text-gray-500">Sin imagen</span>}
                </div>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {images.map((img, idx) => (
                    <button
                      key={img.id}
                      type="button"
                      className={`w-16 h-16 rounded-xl border ${imageIndex === idx ? 'border-accent-primary' : 'border-white/10'} bg-white/5 overflow-hidden`}
                      onClick={() => setImageIndex(idx)}
                    >
                      <img src={img.url ?? img.path} alt="thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 space-y-4">
            {variants.length ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Talla</label>
                <div className="flex flex-wrap gap-2">
                  {variants.map(v => (
                    <button
                      key={v.id}
                      type="button"
                      className={`px-4 py-2 rounded-xl text-sm ${variantId === v.id ? 'bg-accent-primary text-white' : 'bg-white/5 border border-white/10 text-gray-200'}`}
                      disabled={!v.is_active || (v.stock ?? 0) <= 0}
                      onClick={() => setVariantId(v.id)}
                    >
                      {v.size || '—'} • stock {v.stock ?? 0}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-gray-400">Sin variantes</div>
            )}

            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-400">Cantidad</label>
              <button type="button" className="btn-secondary px-3 py-2 text-sm" onClick={() => setQty(Math.max(1, qty - 1))}>-</button>
              <span className="w-10 text-center text-sm font-bold">{qty}</span>
              <button type="button" className="btn-secondary px-3 py-2 text-sm" onClick={() => setQty(qty + 1)}>+</button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-2xl font-black">{(selected?.price ?? product?.price ?? 0)}€</span>
              <button type="button" className="btn-primary px-6 py-3 text-sm" onClick={addToCart}>Añadir al carrito</button>
            </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
