import React, { useMemo, useState } from 'react';
import Layout from '@/Layouts/Layout';
import axios from 'axios';

export default function Show({ product }) {
  const variants = product?.variants ?? [];
  const images = product?.images ?? [];
  const [variantId, setVariantId] = useState(variants[0]?.id ?? null);
  const [qty, setQty] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [color, setColor] = useState(variants[0]?.color ?? null);

  const colors = useMemo(() => Array.from(new Set(variants.map(v => v.color).filter(Boolean))), [variants]);
  const variantsForColor = useMemo(() => variants.filter((v) => (color ? v.color === color : true)), [variants, color]);
  const sizesForColor = useMemo(() => variantsForColor.map((v) => v.size).filter(Boolean), [variantsForColor]);
  const selected = useMemo(() => {
    if (variantId) return variants.find(v => v.id === variantId) ?? null;
    if (color) {
      const first = variants.find(v => v.color === color) ?? null;
      return first;
    }
    return null;
  }, [variants, variantId, color]);
  const currentImage = images[imageIndex]?.url ?? product?.image_url ?? null;
  const colorHex = (c) => {
    const key = String(c || '').toLowerCase();
    const map = {
      negro: '#0b0b0b',
      blanco: '#f5f5f5',
      gris: '#9ca3af',
      azul: '#2563eb',
      rojo: '#dc2626',
      verde: '#16a34a',
      amarillo: '#f59e0b',
      naranja: '#f97316',
      morado: '#7c3aed',
      rosa: '#ec4899',
      beige: '#d6c1a5',
      marrón: '#7c4a2d',
      marron: '#7c4a2d',
    };
    return map[key] ?? '#111827';
  };

  const addToCart = async ({ goToCart } = {}) => {
    try {
      const payload = selected
        ? { kind: 'product', product_variant_id: selected.id, quantity: qty }
        : { kind: 'product', product_id: product.id, quantity: qty };
      await axios.post(route('cart.items.add'), payload);
      if (goToCart) {
        window.location.href = route('cart.index');
        return;
      }
      alert('Añadido al carrito');
    } catch (e) {
      if (e?.response?.status === 401) {
        window.location.href = route('login');
        return;
      }
      alert(e?.response?.data?.message ?? 'No se pudo añadir');
    }
  };

  return (
    <Layout>
      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <div className="glass-card p-6 border border-white/10 bg-white/5">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-2 hidden md:block">
                    <div className="flex flex-col gap-3">
                      {images.map((img, idx) => (
                        <button
                          key={img.id}
                          type="button"
                          className={`w-16 h-16 rounded-xl border ${imageIndex === idx ? 'border-accent-primary' : 'border-white/10'} bg-white/5 overflow-hidden`}
                          onClick={() => setImageIndex(idx)}
                        >
                          <img src={img.url} alt="thumb" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-12 md:col-span-10">
                    <div className="aspect-square rounded-2xl border border-white/10 bg-white/5 overflow-hidden flex items-center justify-center">
                      {currentImage ? (
                        <img src={currentImage} alt="Producto" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-xs text-gray-500">Sin imagen</span>
                      )}
                    </div>
                    <div className="mt-4 flex items-center gap-2 flex-wrap md:hidden">
                      {images.map((img, idx) => (
                        <button
                          key={img.id}
                          type="button"
                          className={`w-14 h-14 rounded-xl border ${imageIndex === idx ? 'border-accent-primary' : 'border-white/10'} bg-white/5 overflow-hidden`}
                          onClick={() => setImageIndex(idx)}
                        >
                          <img src={img.url} alt="thumb" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="glass-card p-6 border border-white/10 bg-white/5 space-y-6">
                <div>
                  <h1 className="text-3xl md:text-4xl font-black tracking-tighter">{product?.name?.es ?? product?.name ?? 'Producto'}</h1>
                  <div className="mt-3 flex items-baseline justify-between gap-4">
                    <div className="text-3xl font-black">{(selected?.price ?? product?.price ?? 0)}€</div>
                    <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                      {variants.length ? 'Con variantes' : (product?.stock ?? 0) > 0 ? 'En stock' : 'Agotado'}
                    </div>
                  </div>
                  {product?.description?.es ? <p className="text-gray-400 mt-4 whitespace-pre-line">{product.description.es}</p> : null}
                </div>

                {!!colors.length && (
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">Color</label>
                      <div className="text-xs text-gray-400">{color ?? ''}</div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {colors.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`w-9 h-9 rounded-full border ${color === c ? 'border-accent-primary' : 'border-white/15'} bg-black/30 flex items-center justify-center`}
                          onClick={() => {
                            setColor(c);
                            const first = variants.find((v) => v.color === c && v.is_active && (v.stock ?? 0) > 0) ?? variants.find((v) => v.color === c) ?? null;
                            setVariantId(first?.id ?? null);
                          }}
                          title={c}
                        >
                          <span className="w-6 h-6 rounded-full" style={{ backgroundColor: colorHex(c) }} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {variants.length ? (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Elige talla</label>
                    <div className="flex flex-wrap gap-3">
                      {variantsForColor.map((v) => {
                        const out = !v.is_active || (v.stock ?? 0) <= 0;
                        const active = variantId === v.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            className={`min-w-[44px] px-4 py-3 rounded-full border text-sm font-bold ${
                              active ? 'border-accent-primary text-white' : 'border-white/15 text-gray-200'
                            } ${out ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/5'}`}
                            disabled={out}
                            onClick={() => setVariantId(v.id)}
                          >
                            {v.size || '—'}
                          </button>
                        );
                      })}
                    </div>
                    {selected ? (
                      <div className="mt-3 text-xs text-gray-500">stock {selected.stock ?? 0}</div>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Cantidad</label>
                  <button type="button" className="btn-secondary px-3 py-2 text-sm" onClick={() => setQty(Math.max(1, qty - 1))}>-</button>
                  <span className="w-10 text-center text-sm font-bold">{qty}</span>
                  <button type="button" className="btn-secondary px-3 py-2 text-sm" onClick={() => setQty(qty + 1)}>+</button>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    className="btn-primary w-full py-3 text-sm"
                    onClick={() => addToCart({ goToCart: false })}
                    disabled={(selected && (selected.stock ?? 0) <= 0) || (!selected && (product?.stock ?? 0) <= 0)}
                  >
                    {(selected && (selected.stock ?? 0) <= 0) || (!selected && (product?.stock ?? 0) <= 0) ? 'Agotado' : 'Añadir a la cesta'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary w-full py-3 text-sm"
                    onClick={() => addToCart({ goToCart: true })}
                    disabled={(selected && (selected.stock ?? 0) <= 0) || (!selected && (product?.stock ?? 0) <= 0)}
                  >
                    Comprar ahora
                  </button>
                  <div className="text-xs text-gray-500">En el checkout podrás elegir Stripe o PayPal.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
