import React, { useMemo, useRef, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Link, router, useForm } from '@inertiajs/react';
import useLockBodyScroll from '@/hooks/useLockBodyScroll';
import axios from 'axios';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

export default function Edit({ product, can }) {
    const isCreate = !product;
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    useLockBodyScroll(confirmDeleteOpen);

    const imageInputRef = useRef(null);
    const galleryInputRef = useRef(null);
    const [gallery, setGallery] = useState(product?.images ?? []);
    const [primaryUrl, setPrimaryUrl] = useState(product?.image_url ?? null);

    const form = useForm({
        name: product?.name ?? '',
        description: product?.description ?? '',
        category: product?.category ?? '',
        price: product?.price ?? '',
        stock: product?.stock ?? 0,
        is_active: product?.is_active ?? true,
        image: null,
    });

    const imagePreview = useMemo(() => {
        if (form.data.image instanceof File) return URL.createObjectURL(form.data.image);
        return primaryUrl;
    }, [form.data.image, primaryUrl]);

    const submit = (e) => {
        e.preventDefault();
        if (isCreate) {
            form.post(route('admin.products.store'), { forceFormData: true, preserveScroll: true });
        } else {
            form.patch(route('admin.products.update', product.id), { forceFormData: true, preserveScroll: true });
        }
    };

    const destroy = () => {
        if (!product) return;
        router.delete(route('admin.products.destroy', product.id));
    };

    const uploadGalleryImage = async (file) => {
        const fd = new FormData();
        fd.append('image', file);
        const res = await axios.post(route('admin.products.images.store', product.id), fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setGallery((prev) => [...prev, res.data]);
    };

    const deleteGalleryImage = async (imageId) => {
        await axios.delete(route('admin.products.images.destroy', [product.id, imageId]));
        setGallery((prev) => prev.filter((g) => g.id !== imageId));
    };

    return (
        <AdminLayout active="ecommerce" headTitle={`Admin • ${isCreate ? 'Crear producto' : 'Editar producto'}`}>
            <div className="max-w-4xl">
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="min-w-0">
                        <h2 className="text-3xl font-black tracking-tight">{isCreate ? 'Crear producto' : 'Editar producto'}</h2>
                        <p className="text-gray-400">{isCreate ? 'Configura el producto y su stock.' : 'Actualiza el producto.'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {!isCreate && can?.delete && (
                            <button
                                type="button"
                                className="px-6 py-3 text-sm rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white transition-colors"
                                onClick={() => setConfirmDeleteOpen(true)}
                            >
                                Eliminar
                            </button>
                        )}
                    </div>
                </div>

                <div className="glass-card p-6">
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Imagen</label>
                            <input ref={imageInputRef} type="file" className="hidden" onChange={(e) => form.setData('image', e.target.files?.[0] ?? null)} />
                            <ImageBox
                                previewUrl={imagePreview}
                                onPick={() => imageInputRef.current?.click()}
                                onDropFile={(f) => form.setData('image', f)}
                                onRemove={async () => {
                                    if (form.data.image instanceof File) {
                                        form.setData('image', null);
                                    } else if (primaryUrl && product?.id) {
                                        await axios.delete(route('admin.products.image.destroy', product.id));
                                        setPrimaryUrl(null);
                                    }
                                }}
                                variant="rect"
                                boxClass="w-32 h-32"
                            />
                            {form.errors.image && <div className="text-xs text-red-400 mt-2">{form.errors.image}</div>}
                        </div>

                        <Field label="Nombre" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} error={form.errors.name} />
                        <TextArea
                            label="Descripción"
                            value={form.data.description}
                            onChange={(e) => form.setData('description', e.target.value)}
                            error={form.errors.description}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Categoría</label>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                                    value={form.data.category}
                                    onChange={(e) => form.setData('category', e.target.value)}
                                >
                                    <option value="">{'—'}</option>
                                    {(window?.__inertia?.page?.props?.categories ?? []).map((c) => (
                                        <option key={c.id} value={c.slug}>{c.name}</option>
                                    ))}
                                </select>
                                {form.errors.category && <div className="text-xs text-red-400 mt-1">{form.errors.category}</div>}
                            </div>
                            <Field label="Precio (€)" value={form.data.price} onChange={(e) => form.setData('price', e.target.value)} error={form.errors.price} />
                            <Field
                                label="Stock"
                                value={form.data.stock}
                                onChange={(e) => form.setData('stock', e.target.value)}
                                error={form.errors.stock}
                                disabled={!can?.manage_stock}
                            />
                        </div>

                        {!isCreate && (
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Galería</label>
                                <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadGalleryImage(e.target.files?.[0])} />
                                <div className="flex items-center gap-4 flex-wrap">
                                    <ImageBox
                                        previewUrl={null}
                                        onPick={() => galleryInputRef.current?.click()}
                                        onDropFile={(f) => uploadGalleryImage(f)}
                                        variant="rect"
                                    />
                                    {gallery.map((img) => (
                                        <ImageBox
                                            key={img.id}
                                            previewUrl={img.url}
                                            onPick={() => {}}
                                            onDropFile={() => {}}
                                            onRemove={() => deleteGalleryImage(img.id)}
                                            variant="rect"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <label className="inline-flex items-center gap-3 text-sm text-gray-300 select-none">
                            <span className="text-xs text-gray-400">{form.data.is_active ? 'Activo' : 'Inactivo'}</span>
                            <span className="relative inline-flex items-center">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={!!form.data.is_active}
                                    disabled={!can?.toggle_active}
                                    onChange={(e) => form.setData('is_active', e.target.checked)}
                                />
                                <span className="w-11 h-6 bg-white/10 border border-white/10 rounded-full peer peer-checked:bg-accent-primary/60 peer-checked:border-accent-primary/40 transition-colors" />
                                <span className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                            </span>
                        </label>
                        {form.errors.is_active && <div className="text-xs text-red-400">{form.errors.is_active}</div>}

                        <div className="flex items-center gap-3 pt-2">
                            <button type="submit" className="btn-primary px-6 py-3 text-sm" disabled={form.processing}>
                                Guardar
                            </button>
                            <Link href={route('admin.products.index')} className="btn-secondary px-6 py-3 text-sm">
                                Volver
                            </Link>
                        </div>
                    </form>
                </div>
            </div>

            {confirmDeleteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6" onClick={() => setConfirmDeleteOpen(false)}>
                    <div
                        className="glass-card max-w-lg w-full p-6 border border-white/10 bg-white/10 shadow-2xl shadow-black/60"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-2xl font-black tracking-tight mb-2">Eliminar producto</h3>
                        <p className="text-gray-400 mb-6">Esta acción es permanente. ¿Seguro que quieres eliminar este producto?</p>
                        <div className="flex items-center justify-end gap-3">
                            <button type="button" className="btn-secondary px-6 py-3 text-sm" onClick={() => setConfirmDeleteOpen(false)}>
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="px-6 py-3 text-sm rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white transition-colors"
                                onClick={destroy}
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

function Field({ label, value, onChange, error, placeholder, disabled }) {
    return (
        <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{label}</label>
            <input
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
            />
            {error && <div className="text-xs text-red-400 mt-1">{error}</div>}
        </div>
    );
}

function TextArea({ label, value, onChange, error }) {
    return (
        <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{label}</label>
            <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-32" value={value} onChange={onChange} />
            {error && <div className="text-xs text-red-400 mt-1">{error}</div>}
        </div>
    );
}

function ImageBox({ previewUrl, onPick, onRemove, onDropFile, variant = 'square', boxClass }) {
    const [dragOver, setDragOver] = useState(false);
    const defaultBoxClass = variant === 'rect' ? 'w-28 h-20 rounded-2xl' : 'w-28 h-28 rounded-2xl';
    const effectiveBoxClass = boxClass || defaultBoxClass;
    const imgClass = variant === 'rect' ? 'w-full h-full object-cover' : 'w-full h-full object-contain';
    return (
        <div
            className={`relative ${effectiveBoxClass} border border-white/10 bg-black/30 overflow-hidden flex items-center justify-center cursor-pointer group ${
                dragOver ? 'ring-2 ring-accent-primary/60 border-accent-primary/40' : ''
            }`}
            onClick={onPick}
            onDragEnter={(e) => {
                e.preventDefault();
                setDragOver(true);
            }}
            onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer?.files?.[0] ?? null;
                if (!f) return;
                if (f.type && !String(f.type).startsWith('image/')) return;
                onDropFile?.(f);
            }}
        >
            {previewUrl ? <img src={previewUrl} alt="Imagen" className={imgClass} /> : <FiPlus size={22} className="text-gray-500" />}
            {previewUrl ? (
                <button
                    type="button"
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove?.();
                    }}
                    aria-label="Eliminar imagen"
                >
                    <FiTrash2 size={22} className="text-white" />
                </button>
            ) : null}
        </div>
    );
}
