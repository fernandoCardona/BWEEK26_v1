import React, { useEffect, useMemo, useRef, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Link, router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { createPortal } from 'react-dom';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import SwitchToggle from '@/Components/SwitchToggle';

function getTabFromUrl() {
  try {
    if (typeof window === 'undefined') return 'tickets';
    const params = new URLSearchParams(window.location.search || '');
    const t = params.get('tab');
    if (t === 'products' || t === 'transactions' || t === 'tickets') return t;
    return 'tickets';
  } catch {
    return 'tickets';
  }
}

function TabButton({ active, onClick, children }) {
  const cls = active ? 'btn-primary px-4 py-2 text-sm' : 'btn-secondary px-4 py-2 text-sm';
  return (
    <button type="button" className={cls} onClick={onClick}>
      {children}
    </button>
  );
}

function SummaryCard({ title, value, subtitle }) {
  return (
    <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
      <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">{title}</div>
      <div className="text-2xl font-black mt-2">{value}</div>
      {subtitle ? <div className="text-sm text-gray-400 mt-1">{subtitle}</div> : null}
    </div>
  );
}

function ImageBox({ previewUrl, onPick, onRemove, size = 'sm' }) {
  const sizeClass = size === 'sm' ? 'w-20 h-20' : 'w-28 h-28';
  return (
    <div className={`relative ${sizeClass} rounded-2xl border border-white/10 bg-black/30 overflow-hidden flex items-center justify-center cursor-pointer group`} onClick={onPick}>
      {previewUrl ? <img src={previewUrl} alt="Imagen" className="w-full h-full object-contain block" /> : <FiPlus size={22} className="text-gray-500" />}
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

function TicketCreateModal({ open, onClose, form, canManage, eventOptions }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (!(form?.data?.image instanceof File)) {
      setPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(form.data.image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [form?.data?.image]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => nameInputRef.current?.focus?.(), 0);
    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;
  if (typeof document === 'undefined') return null;
  const inputId = 'ticket-create-image';

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 backdrop-blur-sm px-6"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onMouseDown={onClose}
      onKeyDownCapture={(e) => {
        if (e.key === 'Escape') onClose();
        e.stopPropagation();
      }}
    >
      <div
        className="glass-card max-w-3xl w-full p-6 border border-white/10 bg-white/10 shadow-2xl shadow-black/60"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-2xl font-black tracking-tight">Crear ticket</h3>
            <p className="text-sm text-gray-400">Se crea la plantilla y se asigna al evento/subevento seleccionado.</p>
          </div>
          <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Evento / Subevento</label>
            <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3" value={form.data.event_id} onChange={(e) => form.setData('event_id', e.target.value)}>
              {eventOptions.map((o) => (
                <option key={o.value || 'empty'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {form.errors.event_id ? <div className="text-xs text-red-400 mt-1">{form.errors.event_id}</div> : null}
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Nombre ticket</label>
            <input
              ref={nameInputRef}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3"
              value={form.data.name}
              onChange={(e) => form.setData('name', e.target.value)}
            />
            {form.errors.name ? <div className="text-xs text-red-400 mt-1">{form.errors.name}</div> : null}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Precio (€)</label>
            <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3" value={form.data.price} onChange={(e) => form.setData('price', e.target.value)} placeholder="0.00" />
            {form.errors.price ? <div className="text-xs text-red-400 mt-1">{form.errors.price}</div> : null}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Stock</label>
            <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3" value={form.data.stock} onChange={(e) => form.setData('stock', e.target.value)} />
            {form.errors.stock ? <div className="text-xs text-red-400 mt-1">{form.errors.stock}</div> : null}
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Imagen (opcional)</label>
            <input id={inputId} type="file" accept="image/*" className="hidden" onChange={(e) => form.setData('image', e.target.files?.[0] ?? null)} />
            <div className="flex items-start gap-4">
              <ImageBox previewUrl={previewUrl} onPick={() => document.getElementById(inputId)?.click()} onRemove={() => form.setData('image', null)} size="lg" />
              <div className="flex-1 text-sm text-gray-400 pt-1">
                Haz click para subir. Pasa el ratón sobre la imagen para eliminarla.
                {form.errors.image ? <div className="text-xs text-red-400 mt-1">{form.errors.image}</div> : null}
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Descripción (opcional)</label>
            <textarea className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 min-h-40 bweek-scrollbar" value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} />
            {form.errors.description ? <div className="text-xs text-red-400 mt-1">{form.errors.description}</div> : null}
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Condiciones legales (opcional)</label>
            <textarea className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 min-h-40 bweek-scrollbar" value={form.data.legal_terms} onChange={(e) => form.setData('legal_terms', e.target.value)} />
            {form.errors.legal_terms ? <div className="text-xs text-red-400 mt-1">{form.errors.legal_terms}</div> : null}
          </div>

          <div className="md:col-span-2 flex items-center justify-end gap-4 pt-2">
            <label className="inline-flex items-center gap-3 text-sm text-gray-300 select-none">
              <span className="text-xs text-gray-400">{form.data.is_active ? 'Activo' : 'Desactivado'}</span>
              <span className="relative inline-flex items-center">
                <input type="checkbox" className="sr-only peer" checked={!!form.data.is_active} onChange={(e) => form.setData('is_active', e.target.checked)} />
                <span className="w-11 h-6 bg-white/10 border border-white/10 rounded-full peer peer-checked:bg-accent-primary/60 peer-checked:border-accent-primary/40 transition-colors" />
                <span className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
              </span>
            </label>
            <button
              type="button"
              className="btn-primary px-6 py-3 text-sm"
              disabled={!canManage || form.processing}
              onClick={() =>
                form.post(route('admin.ecommerce.tickets.store'), {
                  preserveScroll: true,
                  preserveState: true,
                  forceFormData: true,
                  onSuccess: () => {
                    form.reset();
                    form.clearErrors();
                    onClose();
                  },
                })
              }
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function TicketEditModal({ ticketId, onClose, ticketTypes, ticketEdits, setTicketEdits, canManage, onSave, eventLabel }) {
  const priceInputRef = useRef(null);

  const ticket = useMemo(() => {
    if (!ticketId) return null;
    return (ticketTypes ?? []).find((x) => x.id === ticketId) ?? null;
  }, [ticketId, ticketTypes]);

  const ed = ticketId ? ticketEdits?.[ticketId] ?? {} : {};
  const stockValue = Number(ed.stock ?? ticket?.stock ?? 0);
  const isExpired = (() => {
    try {
      if (!ticket?.event?.end_at) return false;
      return new Date(ticket.event.end_at).getTime() < Date.now();
    } catch {
      return false;
    }
  })();
  const canBeActive = !!ticket && !isExpired && stockValue > 0 && !!ticket.event?.is_active;
  const effectiveActive = canBeActive ? !!ed.is_active : false;

  useEffect(() => {
    if (!ticketId) return;
    const t = setTimeout(() => priceInputRef.current?.focus?.(), 0);
    return () => clearTimeout(t);
  }, [ticketId]);

  if (!ticketId) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 backdrop-blur-sm px-6"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onMouseDown={onClose}
      onKeyDownCapture={(e) => {
        if (e.key === 'Escape') onClose();
        e.stopPropagation();
      }}
    >
      <div className="glass-card max-w-3xl w-full p-6 border border-white/10 bg-white/10 shadow-2xl shadow-black/60" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0">
            <h3 className="text-2xl font-black tracking-tight">Editar ticket</h3>
            <p className="text-sm text-gray-400 truncate">
              {ticket?.name || ticket?.code} • {eventLabel(ticket?.event)}
            </p>
          </div>
          <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Precio (€)</label>
            <input
              ref={priceInputRef}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3"
              value={ed.price ?? ''}
              onChange={(e) => setTicketEdits((p) => ({ ...p, [ticketId]: { ...(p[ticketId] ?? {}), price: e.target.value } }))}
              disabled={!canManage}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Stock</label>
            <input
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3"
              value={ed.stock ?? 0}
              onChange={(e) => setTicketEdits((p) => ({ ...p, [ticketId]: { ...(p[ticketId] ?? {}), stock: e.target.value } }))}
              disabled={!canManage}
            />
          </div>

          <div className="md:col-span-2 flex items-center justify-end gap-4 pt-2">
            <label className={`inline-flex items-center gap-3 text-sm text-gray-300 select-none ${!canBeActive ? 'opacity-60' : ''}`}>
              <span className="text-xs text-gray-400">{effectiveActive ? 'Activo' : 'Desactivado'}</span>
              <span className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={effectiveActive}
                  disabled={!canManage || !canBeActive}
                  onChange={(e) => setTicketEdits((p) => ({ ...p, [ticketId]: { ...(p[ticketId] ?? {}), is_active: e.target.checked } }))}
                />
                <span className="w-11 h-6 bg-white/10 border border-white/10 rounded-full peer peer-checked:bg-accent-primary/60 peer-checked:border-accent-primary/40 transition-colors" />
                <span className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
              </span>
            </label>
            <button
              type="button"
              className="btn-primary px-6 py-3 text-sm"
              disabled={!canManage}
              onClick={async () => {
                await onSave(ticketId);
                onClose();
              }}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Index({
  ticketTypes = [],
  eventsForTickets = [],
  ticketSummary,
  productSummary,
  products = [],
  categories = [],
  transactions = [],
  transactionQuery = '',
  transactionFrom = '',
  transactionTo = '',
  ticketEventId = '',
  ticketSort = 'date_desc',
  can,
}) {
  const [tab, setTab] = useState(() => getTabFromUrl());
  useEffect(() => setTab(getTabFromUrl()), [transactionQuery, transactionFrom, transactionTo]);

  const [catsOpen, setCatsOpen] = useState(false);
  const [cats, setCats] = useState(categories ?? []);
  const [newCat, setNewCat] = useState('');

  const createCategory = async () => {
    const name = String(newCat || '').trim();
    if (!name) return;
    const res = await axios.post(route('admin.product-categories.store'), { name });
    setCats((prev) => [...prev, res.data]);
    setNewCat('');
  };

  const saveCategory = async (c) => {
    await axios.patch(route('admin.product-categories.update', c.id), { name: c.name, is_active: !!c.is_active });
  };

  const deleteCategory = async (categoryId) => {
    await axios.delete(route('admin.product-categories.destroy', categoryId));
    setCats((prev) => prev.filter((x) => x.id !== categoryId));
  };

  const ticketCreateForm = useForm({
    event_id: '',
    name: '',
    price: '',
    stock: 0,
    description: '',
    legal_terms: '',
    image: null,
    is_active: true,
  });

  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketEditId, setTicketEditId] = useState(null);

  const [ticketEdits, setTicketEdits] = useState(() =>
    Object.fromEntries(
      (ticketTypes ?? []).map((t) => [
        t.id,
        {
          price: t.price,
          stock: t.stock ?? 0,
          is_active: !!t.is_active,
        },
      ]),
    ),
  );

  useEffect(() => {
    setTicketEdits(
      Object.fromEntries(
        (ticketTypes ?? []).map((t) => [
          t.id,
          {
            price: t.price,
            stock: t.stock ?? 0,
            is_active: !!t.is_active,
          },
        ]),
      ),
    );
  }, [ticketTypes]);

  const saveTicketType = async (ticketTypeId) => {
    const payload = ticketEdits[ticketTypeId];
    await axios.patch(route('admin.ecommerce.tickets.update', ticketTypeId), {
      price: Number(payload.price || 0),
      stock: Number(payload.stock || 0),
      is_active: !!payload.is_active,
    });
    router.reload({ preserveScroll: true, preserveState: true });
  };

  const displayName = (value) => (typeof value === 'string' ? value : value?.es ?? value?.en ?? '');
  const eventLabel = (ev) => {
    if (!ev) return 'Evento';
    const parent = displayName(ev.parent_name);
    const name = displayName(ev.name);
    if (parent) return `${parent} • ${name || 'Subevento'}`;
    return name || 'Evento';
  };

  const eventOptions = useMemo(() => {
    return [
      { value: '', label: '— Selecciona evento/subevento —' },
      ...(eventsForTickets ?? []).map((e) => ({
        value: e.id,
        label: `${eventLabel({ name: e.name, parent_name: e.parent_name })}`,
      })),
    ];
  }, [eventsForTickets]);

  const [ticketEventFilter, setTicketEventFilter] = useState(ticketEventId || '');
  const [ticketSortValue, setTicketSortValue] = useState(ticketSort || 'date_desc');
  useEffect(() => setTicketEventFilter(ticketEventId || ''), [ticketEventId]);
  useEffect(() => setTicketSortValue(ticketSort || 'date_desc'), [ticketSort]);

  const [txQ, setTxQ] = useState(transactionQuery ?? '');
  const [txFrom, setTxFrom] = useState(transactionFrom ?? '');
  const [txTo, setTxTo] = useState(transactionTo ?? '');
  useEffect(() => setTxQ(transactionQuery ?? ''), [transactionQuery]);
  useEffect(() => setTxFrom(transactionFrom ?? ''), [transactionFrom]);
  useEffect(() => setTxTo(transactionTo ?? ''), [transactionTo]);

  const switchTab = (nextTab) => {
    setTab(nextTab);
    router.get(
      route('admin.ecommerce.index'),
      {
        tab: nextTab,
        q: nextTab === 'transactions' ? txQ : undefined,
        from: nextTab === 'transactions' ? txFrom : undefined,
        to: nextTab === 'transactions' ? txTo : undefined,
      },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  const applyTicketFilters = (nextEventId, nextSort) => {
    router.get(
      route('admin.ecommerce.index'),
      {
        tab: 'tickets',
        ticket_event_id: nextEventId || undefined,
        ticket_sort: nextSort || undefined,
      },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  return (
    <AdminLayout active="ecommerce" headTitle="Admin • Ecommerce">
      <div className="container mx-auto">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-8">Ecommerce</h1>
        <div className="glass-card p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <TabButton active={tab === 'tickets'} onClick={() => switchTab('tickets')}>
                Tickets
              </TabButton>
              <TabButton active={tab === 'products'} onClick={() => switchTab('products')}>
                Productos
              </TabButton>
              <TabButton active={tab === 'transactions'} onClick={() => switchTab('transactions')}>
                Transacciones
              </TabButton>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {tab === 'products' ? (
                <>
                  <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={() => setCatsOpen(true)}>
                    Categorías
                  </button>
                  <Link href={route('admin.products.create')} className="btn-primary px-4 py-2 text-sm">
                    Crear producto
                  </Link>
                  <Link href={route('admin.ecommerce.warehouse')} className="btn-secondary px-4 py-2 text-sm">
                    Warehouse
                  </Link>
                </>
              ) : null}
              {tab === 'tickets' ? (
                <button type="button" className="btn-primary px-4 py-2 text-sm" disabled={!can?.manage} onClick={() => setTicketModalOpen(true)}>
                  <span className="inline-flex items-center gap-2">
                    <FiPlus size={16} /> Crear ticket
                  </span>
                </button>
              ) : null}
            </div>
          </div>

          {tab === 'tickets' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SummaryCard title="Tickets vendidos" value={ticketSummary?.sold_count ?? 0} subtitle="Cantidad total" />
                <SummaryCard title="Ingresos tickets" value={`${ticketSummary?.sold_amount ?? '0'}€`} subtitle="Suma total" />
              </div>

              <div className="p-4 rounded-2xl border border-white/10 bg-black/30">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Filtrar por evento</label>
                    <select
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3"
                      value={ticketEventFilter}
                      onChange={(e) => {
                        const v = e.target.value;
                        setTicketEventFilter(v);
                        applyTicketFilters(v, ticketSortValue);
                      }}
                    >
                      <option value="">— Todos —</option>
                      {(eventsForTickets ?? []).map((e) => (
                        <option key={e.id} value={e.id}>
                          {eventLabel({ name: e.name, parent_name: e.parent_name })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Ordenar</label>
                    <select
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3"
                      value={ticketSortValue}
                      onChange={(e) => {
                        const v = e.target.value;
                        setTicketSortValue(v);
                        applyTicketFilters(ticketEventFilter, v);
                      }}
                    >
                      <option value="date_desc">Más recientes</option>
                      <option value="sold_desc">Más vendidos</option>
                      <option value="stock_desc">Mayor stock</option>
                      <option value="stock_asc">Menor stock</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {(ticketTypes ?? []).map((t) => {
                  const ed = ticketEdits?.[t.id] ?? {};
                  const stockValue = Number(ed.stock ?? t.stock ?? 0);
                  const soldCount = Number(t.sold_count ?? 0);
                  const remainingStock = Number(t.stock ?? 0);
                  const totalStock = Math.max(0, remainingStock + soldCount);
                  const isExpired = (() => {
                    try {
                      if (!t.event?.end_at) return false;
                      return new Date(t.event.end_at).getTime() < Date.now();
                    } catch {
                      return false;
                    }
                  })();
                  const canBeActive = !isExpired && stockValue > 0 && !!t.event?.is_active;
                  const effectiveActive = canBeActive ? !!ed.is_active : false;

                  return (
                    <div key={t.id} className="p-4 rounded-2xl border border-white/10 bg-white/5">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="min-w-0">
                          <div className="font-black text-sm uppercase tracking-widest truncate">{t.name || t.code}</div>
                          <div className="text-xs text-gray-500 truncate">{eventLabel(t.event)} • {t.code} {isExpired ? '• FINALIZADO' : ''}</div>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span
                              className={`text-sm font-black px-3 py-1 rounded-full border ${
                                remainingStock > 0 ? 'text-emerald-300 border-emerald-400/20 bg-emerald-500/10' : 'text-red-300 border-red-400/20 bg-red-500/10'
                              }`}
                            >
                              Stock {remainingStock}/{totalStock}
                            </span>
                            <span className="text-sm font-black px-3 py-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
                              Vendidos {soldCount}
                            </span>
                            {remainingStock <= 0 ? (
                              <span className="text-sm font-black px-3 py-1 rounded-full border border-red-400/20 bg-red-500/10 text-red-300">Agotado</span>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            className="w-24 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
                            value={ed.price ?? ''}
                            onChange={(e) => setTicketEdits((p) => ({ ...p, [t.id]: { ...(p[t.id] ?? {}), price: e.target.value } }))}
                            disabled={!can?.manage}
                          />
                          <input
                            className="w-20 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
                            value={ed.stock ?? 0}
                            onChange={(e) => setTicketEdits((p) => ({ ...p, [t.id]: { ...(p[t.id] ?? {}), stock: e.target.value } }))}
                            disabled={!can?.manage}
                          />
                          <label className={`inline-flex items-center gap-3 text-sm text-gray-300 select-none ${!canBeActive ? 'opacity-60' : ''}`}>
                            <span className="text-xs text-gray-400">{effectiveActive ? 'Activo' : 'Desactivado'}</span>
                            <span className="relative inline-flex items-center">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={effectiveActive}
                                disabled={!can?.manage || !canBeActive}
                                onChange={(e) => setTicketEdits((p) => ({ ...p, [t.id]: { ...(p[t.id] ?? {}), is_active: e.target.checked } }))}
                              />
                              <span className="w-11 h-6 bg-white/10 border border-white/10 rounded-full peer peer-checked:bg-accent-primary/60 peer-checked:border-accent-primary/40 transition-colors" />
                              <span className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                            </span>
                          </label>
                          <button type="button" className="btn-secondary px-4 py-2 text-sm" disabled={!can?.manage} onClick={() => saveTicketType(t.id)}>
                            Guardar
                          </button>
                          <button type="button" className="btn-secondary px-4 py-2 text-sm" disabled={!can?.manage} onClick={() => setTicketEditId(t.id)}>
                            Editar ticket
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {!ticketTypes?.length ? <div className="text-gray-400">Todavía no hay tickets creados.</div> : null}
              </div>
              <TicketCreateModal open={ticketModalOpen} onClose={() => setTicketModalOpen(false)} form={ticketCreateForm} canManage={!!can?.manage} eventOptions={eventOptions} />
              <TicketEditModal
                ticketId={ticketEditId}
                onClose={() => setTicketEditId(null)}
                ticketTypes={ticketTypes}
                ticketEdits={ticketEdits}
                setTicketEdits={setTicketEdits}
                canManage={!!can?.manage}
                onSave={saveTicketType}
                eventLabel={eventLabel}
              />
            </>
          ) : null}

          {tab === 'products' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SummaryCard title="Productos vendidos" value={productSummary?.sold_count ?? 0} subtitle="Cantidad total" />
                <SummaryCard title="Ingresos productos" value={`${productSummary?.sold_amount ?? '0'}€`} subtitle="Suma total" />
              </div>
              {products.length ? (
                <div className="space-y-3">
                  {products.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{p.name?.es ?? p.name?.en ?? 'Producto'}</p>
                        <p className="text-xs text-gray-500">
                          {p.price}€ • variantes {p.variants_count}
                        </p>
                      </div>
                      <Link href={route('admin.products.edit', p.id)} className="btn-secondary px-4 py-2 text-sm">
                        Editar
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No hay productos todavía.</p>
              )}
            </>
          ) : null}

          {tab === 'transactions' ? (
            <>
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Buscar transacción</label>
                  <input
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3"
                    value={txQ}
                    onChange={(e) => setTxQ(e.target.value)}
                    placeholder="UUID de transacción, nombre o email de usuario"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Desde</label>
                  <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3" type="date" value={txFrom} onChange={(e) => setTxFrom(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Hasta</label>
                  <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3" type="date" value={txTo} onChange={(e) => setTxTo(e.target.value)} />
                </div>
                <button
                  type="button"
                  className="btn-primary px-6 py-3 text-sm"
                  onClick={() =>
                    router.get(route('admin.ecommerce.index'), { tab: 'transactions', q: txQ, from: txFrom || undefined, to: txTo || undefined }, { preserveScroll: true, preserveState: true, replace: true })
                  }
                >
                  Buscar
                </button>
              </div>

              {transactions.length ? (
                <div className="space-y-3">
                  {transactions.map((t) => (
                    <div key={t.id} className="p-4 rounded-2xl border border-white/10 bg-white/5">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-black truncate">{t.id}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {t.user?.name || '—'} • {t.user?.email || '—'} • {t.type} • {t.status} • {t.total_amount}
                            {t.currency}
                          </div>
                        </div>
                        {t.user?.id ? (
                          <Link href={route('admin.users.show', t.user.id)} className="btn-secondary px-4 py-2 text-sm">
                            Ver usuario
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400">No hay resultados.</div>
              )}
            </>
          ) : null}
        </div>
      </div>

      {catsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/70" onClick={() => setCatsOpen(false)} />
          <div className="relative w-full max-w-3xl glass-card p-6 border border-white/10">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Categorías</h3>
                <p className="text-sm text-gray-400">Crea y gestiona categorías asignables a productos.</p>
              </div>
              <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={() => setCatsOpen(false)}>
                Cerrar
              </button>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <input
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="Nombre de categoría (ej. t-shirt)"
              />
              <button type="button" className="btn-primary px-6 py-3 text-sm" onClick={createCategory}>
                Crear
              </button>
            </div>

            <div className="space-y-3">
              {cats.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl border border-white/10 bg-white/5">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <div className="md:col-span-6">
                      <input
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3"
                        value={c.name ?? ''}
                        onChange={(e) => setCats((prev) => prev.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x)))}
                      />
                      <div className="text-xs text-gray-500 mt-2">slug: {c.slug}</div>
                    </div>
                    <div className="md:col-span-3">
                      <SwitchToggle
                        checked={!!c.is_active}
                        onChange={(v) => setCats((prev) => prev.map((x) => (x.id === c.id ? { ...x, is_active: v } : x)))}
                        labelOn="Activa"
                        labelOff="Inactiva"
                      />
                    </div>
                    <div className="md:col-span-3 flex items-center justify-end gap-3">
                      <button type="button" className="btn-secondary px-5 py-3 text-sm" onClick={() => saveCategory(c)}>
                        Guardar
                      </button>
                      <button type="button" className="btn-secondary px-5 py-3 text-sm" onClick={() => deleteCategory(c.id)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!cats.length && <div className="text-gray-400">No hay categorías todavía.</div>}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
