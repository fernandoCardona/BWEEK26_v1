import React, { useEffect, useMemo, useRef, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { router, useForm } from '@inertiajs/react';
import { createPortal } from 'react-dom';
import { FiChevronDown, FiEdit2, FiPlus, FiTrash2, FiX } from 'react-icons/fi';

function Field({ label, value, onChange, placeholder = '', type = 'text', disabled = false }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{label}</label>
      <input
        type={type}
        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none disabled:opacity-60"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder = '', disabled = false, rows = 3 }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{label}</label>
      <textarea
        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none disabled:opacity-60"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
      />
    </div>
  );
}

function CustomSelect({ label, value, onChange, disabled, options }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);

  const selected = useMemo(() => {
    return options?.find((o) => String(o.value) === String(value)) ?? options?.[0] ?? { value: '', label: '' };
  }, [options, value]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current) return;
      if (rootRef.current.contains(e.target)) return;
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const width = Math.max(220, rect.width);
      const left = Math.min(rect.left, window.innerWidth - width - 12);
      const top = Math.min(rect.bottom + 8, window.innerHeight - 100);
      setMenuStyle({
        position: 'fixed',
        top,
        left,
        width,
      });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      {label ? <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{label}</label> : null}
      <button
        type="button"
        disabled={disabled}
        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pr-10 text-left flex items-center justify-between gap-3 disabled:opacity-60"
        onClick={() => setOpen((o) => !o)}
        ref={buttonRef}
      >
        <span className="truncate text-gray-200">{selected?.label ?? ''}</span>
        <FiChevronDown className={`shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} size={21} />
      </button>
      {open && !disabled && menuStyle && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={menuRef}
              style={menuStyle}
              className="z-[9999] rounded-2xl border border-white/10 bg-black/90 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/60"
            >
              <div className="max-h-72 overflow-auto py-2 bweek-scrollbar">
                {(options ?? []).map((o) => {
                  const isActive = String(o.value) === String(value);
                  return (
                    <button
                      key={String(o.value)}
                      type="button"
                      className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                        isActive ? 'bg-white/10 text-white' : 'text-gray-200 hover:bg-white/5'
                      }`}
                      onClick={() => {
                        onChange?.(o.value);
                        setOpen(false);
                      }}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

export default function Index({ locations = [], templates = [], can }) {
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [editingTemplateId, setEditingTemplateId] = useState(null);

  const locationCreate = useForm({
    name: '',
    location: '',
    address: '',
    google_maps_url: '',
    notes: '',
    is_active: true,
  });

  const templateCreate = useForm({
    name: '',
    description: '',
    agenda_location_id: '',
    is_active: true,
  });

  const [locationEdits, setLocationEdits] = useState(() => {
    const out = {};
    for (const l of locations) {
      out[l.id] = {
        name: l.name ?? '',
        location: l.location ?? '',
        address: l.address ?? '',
        google_maps_url: l.google_maps_url ?? '',
        notes: l.notes ?? '',
        is_active: l.is_active ?? true,
      };
    }
    return out;
  });

  const [templateEdits, setTemplateEdits] = useState(() => {
    const out = {};
    for (const t of templates) {
      out[t.id] = {
        name: t.name ?? '',
        description: t.description ?? '',
        agenda_location_id: t.agenda_location_id ?? '',
        is_active: !!t.is_active,
      };
    }
    return out;
  });

  const activeLocations = useMemo(() => (locations ?? []).filter((l) => l.is_active), [locations]);

  const saveLocation = (id) => {
    const payload = locationEdits?.[id];
    if (!payload) return;
    router.patch(route('admin.agenda.locations.update', id), payload, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => setEditingLocationId(null),
    });
  };

  const saveTemplate = (id) => {
    const payload = templateEdits?.[id];
    if (!payload) return;
    router.patch(route('admin.agenda.templates.update', id), payload, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => setEditingTemplateId(null),
    });
  };

  const deleteLocation = (id) => {
    if (!can?.delete) return;
    if (!window.confirm('¿Eliminar esta localización?')) return;
    router.delete(route('admin.agenda.locations.destroy', id), { preserveScroll: true });
  };

  const deleteTemplate = (id) => {
    if (!can?.delete) return;
    if (!window.confirm('¿Eliminar esta plantilla?')) return;
    router.delete(route('admin.agenda.templates.destroy', id), { preserveScroll: true });
  };

  return (
    <AdminLayout active="agenda" title="AGENDA" subtitle="Plantillas y localizaciones frecuentes" headTitle="Admin • Agenda" containerClassName="max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 border border-white/10 bg-white/5">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black">Localizaciones</h2>
              <p className="text-sm text-gray-400">Guárdalas una vez y reutilízalas en subeventos.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-white/10 bg-black/30 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nombre" value={locationCreate.data.name} onChange={(e) => locationCreate.setData('name', e.target.value)} />
              <Field label="Localidad" value={locationCreate.data.location} onChange={(e) => locationCreate.setData('location', e.target.value)} placeholder="Sitges, Barcelona, España" />
              <Field label="Dirección" value={locationCreate.data.address} onChange={(e) => locationCreate.setData('address', e.target.value)} />
              <Field label="Google Maps URL" value={locationCreate.data.google_maps_url} onChange={(e) => locationCreate.setData('google_maps_url', e.target.value)} placeholder="https://..." />
              <div className="md:col-span-2">
                <Textarea label="Notas" value={locationCreate.data.notes} onChange={(e) => locationCreate.setData('notes', e.target.value)} rows={2} />
              </div>
              <div className="md:col-span-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="btn-primary px-5 py-3 text-sm"
                  disabled={!can?.manage || locationCreate.processing || !String(locationCreate.data.name || '').trim()}
                  onClick={() => locationCreate.post(route('admin.agenda.locations.store'), { preserveScroll: true, onSuccess: () => locationCreate.reset() })}
                >
                  <span className="inline-flex items-center gap-2">
                    <FiPlus size={16} /> Añadir
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 bweek-scrollbar">
            {(locations ?? []).map((l) => {
              const isEditing = editingLocationId === l.id;
              const ed = locationEdits?.[l.id] ?? {};
              return (
                <div key={l.id} className="p-4 rounded-2xl border border-white/10 bg-black/30">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-lg font-black truncate">{l.name}</div>
                      <div className="text-sm text-gray-400 truncate">{l.location || l.address || '—'}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button type="button" className="icon-btn icon-btn-gradient" onClick={() => setEditingLocationId(isEditing ? null : l.id)} aria-label="Editar localización">
                        {isEditing ? <FiX size={22} /> : <FiEdit2 size={22} />}
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn-gradient text-red-500 hover:text-red-400"
                        onClick={() => deleteLocation(l.id)}
                        aria-label="Eliminar localización"
                        disabled={!can?.delete}
                      >
                        <FiTrash2 size={22} />
                      </button>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Nombre" value={ed.name ?? ''} onChange={(e) => setLocationEdits((p) => ({ ...p, [l.id]: { ...ed, name: e.target.value } }))} />
                      <Field label="Localidad" value={ed.location ?? ''} onChange={(e) => setLocationEdits((p) => ({ ...p, [l.id]: { ...ed, location: e.target.value } }))} />
                      <Field label="Dirección" value={ed.address ?? ''} onChange={(e) => setLocationEdits((p) => ({ ...p, [l.id]: { ...ed, address: e.target.value } }))} />
                      <Field label="Google Maps URL" value={ed.google_maps_url ?? ''} onChange={(e) => setLocationEdits((p) => ({ ...p, [l.id]: { ...ed, google_maps_url: e.target.value } }))} />
                      <div className="md:col-span-2">
                        <Textarea label="Notas" value={ed.notes ?? ''} onChange={(e) => setLocationEdits((p) => ({ ...p, [l.id]: { ...ed, notes: e.target.value } }))} rows={2} />
                      </div>
                      <div className="md:col-span-2 flex items-center justify-end">
                        <button type="button" className="btn-secondary px-5 py-3 text-sm" disabled={!can?.manage} onClick={() => saveLocation(l.id)}>
                          Guardar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {!locations?.length && <div className="text-gray-400">Todavía no hay localizaciones guardadas.</div>}
          </div>
        </div>

        <div className="glass-card p-6 border border-white/10 bg-white/5">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black">Plantillas de subevento</h2>
              <p className="text-sm text-gray-400">Reutiliza nombre y descripción (lo demás se rellena en el formulario).</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-white/10 bg-black/30 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Field label="Nombre de subevento" value={templateCreate.data.name} onChange={(e) => templateCreate.setData('name', e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Textarea label="Descripción" value={templateCreate.data.description} onChange={(e) => templateCreate.setData('description', e.target.value)} rows={2} />
              </div>
              <div className="md:col-span-2">
                <CustomSelect
                  label="Localización frecuente (opcional)"
                  value={templateCreate.data.agenda_location_id}
                  options={[
                    { value: '', label: '—' },
                    ...activeLocations.map((l) => ({ value: l.id, label: l.name })),
                  ]}
                  onChange={(id) => templateCreate.setData('agenda_location_id', id)}
                />
              </div>
              <div className="md:col-span-2 flex items-center justify-end gap-4">
                <button
                  type="button"
                  className="btn-primary px-5 py-3 text-sm"
                  disabled={!can?.manage || templateCreate.processing || !String(templateCreate.data.name || '').trim()}
                  onClick={() => templateCreate.post(route('admin.agenda.templates.store'), { preserveScroll: true, onSuccess: () => templateCreate.reset() })}
                >
                  <span className="inline-flex items-center gap-2">
                    <FiPlus size={16} /> Añadir
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 bweek-scrollbar">
            {(templates ?? []).map((t) => {
              const isEditing = editingTemplateId === t.id;
              const ed = templateEdits?.[t.id] ?? {};
              return (
                <div key={t.id} className="p-4 rounded-2xl border border-white/10 bg-black/30">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-lg font-black truncate">{t.name}</div>
                      <div className="text-sm text-gray-400 truncate">{t.description || '—'}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button type="button" className="icon-btn icon-btn-gradient" onClick={() => setEditingTemplateId(isEditing ? null : t.id)} aria-label="Editar plantilla">
                        {isEditing ? <FiX size={22} /> : <FiEdit2 size={22} />}
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn-gradient text-red-500 hover:text-red-400"
                        onClick={() => deleteTemplate(t.id)}
                        aria-label="Eliminar plantilla"
                        disabled={!can?.delete}
                      >
                        <FiTrash2 size={22} />
                      </button>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Field
                          label="Nombre de subevento"
                          value={ed.name ?? ''}
                          onChange={(e) => setTemplateEdits((p) => ({ ...p, [t.id]: { ...ed, name: e.target.value } }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Textarea label="Descripción" value={ed.description ?? ''} onChange={(e) => setTemplateEdits((p) => ({ ...p, [t.id]: { ...ed, description: e.target.value } }))} rows={2} />
                      </div>
                      <div className="md:col-span-2">
                        <CustomSelect
                          label="Localización frecuente (opcional)"
                          value={ed.agenda_location_id ?? ''}
                          options={[
                            { value: '', label: '—' },
                            ...activeLocations.map((l) => ({ value: l.id, label: l.name })),
                          ]}
                          onChange={(id) => setTemplateEdits((p) => ({ ...p, [t.id]: { ...ed, agenda_location_id: id } }))}
                        />
                      </div>
                      <div className="md:col-span-2 flex items-center justify-end">
                        <button type="button" className="btn-secondary px-5 py-3 text-sm" disabled={!can?.manage} onClick={() => saveTemplate(t.id)}>
                          Guardar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {!templates?.length && <div className="text-gray-400">Todavía no hay plantillas guardadas.</div>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
