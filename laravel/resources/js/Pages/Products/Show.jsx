import React, { useMemo, useState } from 'react';
import Layout from '@/Layouts/Layout';
import axios from 'axios';
import { FiStar } from 'react-icons/fi';

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
      <div className="pt-24 pb-16">
        <div className="bg-white text-gray-900">
          <div className="container mx-auto px-6 py-10 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-2 hidden md:block">
                    <div className="flex flex-col gap-3">
                      {(images.length ? images : currentImage ? [{ id: 'main', url: currentImage }] : []).map((img, idx) => (
                        <button
                          key={img.id}
                          type="button"
                          className={`w-16 h-16 rounded-md border ${imageIndex === idx ? 'border-red-500' : 'border-gray-200'} bg-gray-50 overflow-hidden`}
                          onClick={() => setImageIndex(idx)}
                        >
                          <img src={img.url} alt="thumb" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-12 md:col-span-10">
                    <div className="rounded-md border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center aspect-square">
                      {currentImage ? <img src={currentImage} alt="Producto" className="w-full h-full object-contain" /> : null}
                    </div>
                    <div className="mt-4 flex items-center gap-2 flex-wrap md:hidden">
                      {(images.length ? images : currentImage ? [{ id: 'main', url: currentImage }] : []).map((img, idx) => (
                        <button
                          key={img.id}
                          type="button"
                          className={`w-14 h-14 rounded-md border ${imageIndex === idx ? 'border-red-500' : 'border-gray-200'} bg-gray-50 overflow-hidden`}
                          onClick={() => setImageIndex(idx)}
                        >
                          <img src={img.url} alt="thumb" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="space-y-4">
                  <div className="text-sm text-gray-500">{product?.category || 'Producto'}</div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h1 className="text-2xl md:text-3xl font-black leading-tight">{product?.name?.es ?? product?.name ?? 'Producto'}</h1>
                      <div className="text-sm text-gray-500">por bearssitges</div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="inline-flex items-center gap-1 text-green-600">
                          <FiStar size={14} />
                          <FiStar size={14} />
                          <FiStar size={14} />
                          <FiStar size={14} />
                          <FiStar size={14} />
                        </div>
                        <div className="text-xs text-gray-600">4,6</div>
                        <div className="text-xs text-gray-500">(904 opiniones)</div>
                      </div>
                    </div>
                    <div className="text-3xl font-black whitespace-nowrap">{Number(selected?.price ?? product?.price ?? 0).toFixed(2).replace('.', ',')} €</div>
                  </div>

                  {variants.length ? (
                    <div className="pt-2">
                      <div className="text-sm font-semibold">Modelo de {String(product?.category || 'producto').toLowerCase()}:</div>
                      <div className="mt-2 inline-flex items-center gap-2">
                        <button type="button" className="px-4 py-2 rounded-md border border-red-500 text-sm font-bold bg-white">Clásico</button>
                        <button type="button" className="px-4 py-2 rounded-md border border-gray-200 text-sm font-bold bg-white text-gray-500" disabled>
                          Premium con bolsillo
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {!!colors.length ? (
                    <div className="pt-2">
                      <div className="text-sm font-semibold">Color: <span className="font-normal text-gray-600">{color || '—'}</span></div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {colors.map((c) => (
                          <button
                            key={c}
                            type="button"
                            className={`w-8 h-8 rounded-full border ${color === c ? 'border-red-500' : 'border-gray-300'} bg-white flex items-center justify-center`}
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
                  ) : null}

                  {variants.length ? (
                    <div className="pt-2">
                      <div className="text-sm font-semibold">Elige talla</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {variantsForColor.map((v) => {
                          const out = !v.is_active || (v.stock ?? 0) <= 0;
                          const active = variantId === v.id;
                          return (
                            <button
                              key={v.id}
                              type="button"
                              className={`px-4 py-2 rounded-md border text-sm font-bold ${
                                active ? 'border-red-500' : 'border-gray-200'
                              } ${out ? 'opacity-40 cursor-not-allowed' : 'hover:border-gray-400'}`}
                              disabled={out}
                              onClick={() => setVariantId(v.id)}
                            >
                              {v.size || '—'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    className="w-full h-11 rounded-md bg-[#f3cc7a] hover:bg-[#f0c361] text-gray-900 font-bold inline-flex items-center justify-center gap-2"
                    onClick={() => addToCart({ goToCart: true })}
                    disabled={(selected && (selected.stock ?? 0) <= 0) || (!selected && (product?.stock ?? 0) <= 0)}
                  >
                    Añadir a la cesta
                  </button>
                  <button type="button" className="w-full h-11 rounded-md border border-gray-300 bg-white text-gray-700 font-bold" disabled>
                    Personalizar
                  </button>

                  <div className="pt-3 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>Estándar: 04 Feb - 09 Feb</span>
                      <span className="text-green-600 font-bold">¡Gratis!*</span>
                    </div>
                    <div className="text-gray-500">Cambios o devoluciones gratis hasta 90 días</div>
                  </div>

                  {product?.description?.es ? (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="text-sm font-bold mb-2">Descripción</div>
                      <div className="text-sm text-gray-700 whitespace-pre-line">{product.description.es}</div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
