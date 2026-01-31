import React, { useMemo, useRef, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { router, useForm, usePage } from '@inertiajs/react';
import SwitchToggle from '@/Components/SwitchToggle';
import CustomSelect from '@/Components/CustomSelect';
import { tFrom } from '@/i18n/t';

const LOCALES = [
  { value: 'es', label: 'Español (ES)' },
  { value: 'ca', label: 'Català (CA)' },
  { value: 'en', label: 'English (EN)' },
  { value: 'fr', label: 'Français (FR)' },
  { value: 'it', label: 'Italiano (IT)' },
  { value: 'de', label: 'Deutsch (DE)' },
];

const FIELD_DEFS = {
  hero: [
    { key: 'badge', labelKey: 'fields.hero.badge', label: 'Badge (fecha / lugar)' },
    { key: 'title', labelKey: 'fields.hero.title', label: 'Título (H1)' },
    { key: 'subtitle', labelKey: 'fields.hero.subtitle', label: 'Subtítulo' },
    { key: 'cta_primary_label', labelKey: 'fields.hero.cta_primary_label', label: 'CTA primario (label)' },
    { key: 'cta_primary_url', labelKey: 'fields.hero.cta_primary_url', label: 'CTA primario (url)' },
    { key: 'cta_secondary_label', labelKey: 'fields.hero.cta_secondary_label', label: 'CTA secundario (label)' },
    { key: 'cta_secondary_url', labelKey: 'fields.hero.cta_secondary_url', label: 'CTA secundario (url)' },
  ],
  next_event: [
    { key: 'kicker', labelKey: 'fields.next_event.kicker', label: 'Kicker' },
    { key: 'heading', labelKey: 'fields.next_event.heading', label: 'Título sección' },
    { key: 'cta_label', labelKey: 'fields.next_event.cta_label', label: 'CTA (label)' },
    { key: 'cta_url', labelKey: 'fields.next_event.cta_url', label: 'CTA (url)' },
    { key: 'big_label', labelKey: 'fields.next_event.big_label', label: 'Card grande (label)' },
    { key: 'big_title', labelKey: 'fields.next_event.big_title', label: 'Card grande (título)' },
    { key: 'big_body', labelKey: 'fields.next_event.big_body', label: 'Card grande (texto)', as: 'textarea', rows: 4 },
    { key: 'card1_title', labelKey: 'fields.next_event.card1_title', label: 'Card 1 (título)' },
    { key: 'card1_subtitle', labelKey: 'fields.next_event.card1_subtitle', label: 'Card 1 (subtítulo)' },
    { key: 'card2_title', labelKey: 'fields.next_event.card2_title', label: 'Card 2 (título)' },
    { key: 'card2_subtitle', labelKey: 'fields.next_event.card2_subtitle', label: 'Card 2 (subtítulo)' },
    { key: 'wide_title', labelKey: 'fields.next_event.wide_title', label: 'Card ancha (título)' },
    { key: 'wide_subtitle', labelKey: 'fields.next_event.wide_subtitle', label: 'Card ancha (subtítulo)' },
  ],
  shop_carousel: [
    { key: 'kicker', labelKey: 'fields.shop_carousel.kicker', label: 'Kicker' },
    { key: 'title', labelKey: 'fields.shop_carousel.title', label: 'Título sección' },
    { key: 'cta_label', labelKey: 'fields.shop_carousel.cta_label', label: 'CTA (label)' },
    { key: 'cta_url', labelKey: 'fields.shop_carousel.cta_url', label: 'CTA (url)' },
  ],
  magazine: [
    { key: 'kicker', labelKey: 'fields.magazine.kicker', label: 'Kicker' },
    { key: 'title', labelKey: 'fields.magazine.title', label: 'Título sección' },
    { key: 'subtitle', labelKey: 'fields.magazine.subtitle', label: 'Subtítulo', as: 'textarea', rows: 3 },
    { key: 'cta_label', labelKey: 'fields.magazine.cta_label', label: 'CTA (label)' },
    { key: 'cta_url', labelKey: 'fields.magazine.cta_url', label: 'CTA (url)' },
  ],
  testimonial: [
    { key: 'kicker', labelKey: 'fields.testimonial.kicker', label: 'Kicker' },
    { key: 'title', labelKey: 'fields.testimonial.title', label: 'Título sección' },
    { key: 'quote', labelKey: 'fields.testimonial.quote', label: 'Testimonio', as: 'textarea', rows: 4 },
    { key: 'author', labelKey: 'fields.testimonial.author', label: 'Autor' },
    { key: 'role', labelKey: 'fields.testimonial.role', label: 'Cargo / detalle' },
  ],
  map: [
    { key: 'kicker', labelKey: 'fields.map.kicker', label: 'Kicker' },
    { key: 'title', labelKey: 'fields.map.title', label: 'Título sección' },
    { key: 'subtitle', labelKey: 'fields.map.subtitle', label: 'Texto', as: 'textarea', rows: 4 },
    { key: 'cta_label', labelKey: 'fields.map.cta_label', label: 'CTA (label)' },
    { key: 'cta_url', labelKey: 'fields.map.cta_url', label: 'CTA (url)' },
  ],
  generic: [
    { key: 'title', labelKey: 'fields.generic.title', label: 'Título' },
    { key: 'subtitle', labelKey: 'fields.generic.subtitle', label: 'Subtítulo' },
    { key: 'body', labelKey: 'fields.generic.body', label: 'Texto', as: 'textarea', rows: 6 },
    { key: 'cta_label', labelKey: 'fields.generic.cta_label', label: 'CTA (label)' },
    { key: 'cta_url', labelKey: 'fields.generic.cta_url', label: 'CTA (url)' },
  ],
};

function fieldsFor(type) {
  return FIELD_DEFS[type] ?? FIELD_DEFS.generic;
}

function buildSectionFormData(section, locale) {
  const cfg = section?.config ?? {};
  const content = cfg?.content?.[locale] ?? {};
  const defs = fieldsFor(section.type);
  const fields = {};
  defs.forEach((d) => {
    fields[d.key] = content?.[d.key] ?? '';
  });
  const poi = cfg?.poi ?? {};
  return {
    id: section.id,
    type: section.type,
    order: section.order ?? 0,
    enabled: cfg?.enabled ?? true,
    key: cfg?.key ?? '',
    fields,
    poi: section.type === 'map' ? {
      include_agenda_locations: poi?.include_agenda_locations !== false,
      agenda_location_ids: Array.isArray(poi?.agenda_location_ids) ? poi.agenda_location_ids : [],
      custom: Array.isArray(poi?.custom) ? poi.custom : [],
    } : undefined,
  };
}

export default function Edit({ page, sections, agenda_locations }) {
  const { props } = usePage();
  const role = props?.auth?.user?.role ?? 'user';
  const canInitHome = role === 'super_admin';
  const t = (key, fallback) => tFrom(props?.translations?.cms, key, fallback);

  const [locale, setLocale] = useState(() => props?.locale || 'es');

  const orderedSections = useMemo(() => {
    return (sections ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [sections]);

  const sectionById = useMemo(() => {
    const m = new Map();
    (sections ?? []).forEach((s) => m.set(s.id, s));
    return m;
  }, [sections]);

  const form = useForm({
    locale,
    title: page?.title?.[locale] ?? '',
    meta_description: page?.meta_description?.[locale] ?? '',
    is_published: !!page?.is_published,
    sections: orderedSections.map((s) => buildSectionFormData(s, locale)),
  });

  const createSectionForm = useForm({
    type: 'hero',
    key: '',
    order: (orderedSections?.length ?? 0) * 10,
  });

  const setSection = (id, patch) => {
    form.setData(
      'sections',
      (form.data.sections ?? []).map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  };

  const setSectionField = (id, key, value) => {
    const current = (form.data.sections ?? []).find((s) => s.id === id);
    setSection(id, { fields: { ...(current?.fields ?? {}), [key]: value } });
  };

  const setSectionPoi = (id, poi) => {
    setSection(id, { poi });
  };

  const saveAll = (e) => {
    e?.preventDefault?.();
    form.patch(route('admin.pages.bulk', page.slug), { preserveScroll: true });
  };

  const onChangeLocale = (v) => {
    setLocale(v);
    form.setData('locale', v);
    form.setData('title', page?.title?.[v] ?? '');
    form.setData('meta_description', page?.meta_description?.[v] ?? '');
    form.setData('sections', orderedSections.map((s) => buildSectionFormData(s, v)));
  };

  return (
    <AdminLayout active="cms" headTitle="Admin • CMS">
      <div className="container mx-auto">
        <form onSubmit={saveAll} className="space-y-6">
          <div className="sticky top-24 z-20">
            <div className="glass-card px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">CMS</div>
                <div className="text-2xl md:text-3xl font-black tracking-tighter truncate">{page?.slug}</div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-full sm:w-64">
                  <CustomSelect label={t('language', 'Idioma')} value={locale} onChange={onChangeLocale} options={LOCALES} />
                </div>
                <SwitchToggle checked={form.data.is_published} onChange={(v) => form.setData('is_published', v)} labelOn={t('published', 'Publicado')} labelOff={t('draft', 'Borrador')} />
                {canInitHome ? (
                  <>
                    <button type="button" className="btn-secondary px-5 py-3 text-sm" onClick={() => router.post(route('admin.pages.init_template', page.slug), {}, { preserveScroll: true })}>
                      {t('init_sections', 'Inicializar secciones')}
                    </button>
                    <button type="button" className="btn-secondary px-5 py-3 text-sm" onClick={() => router.post(route('admin.pages.import_legacy', page.slug), {}, { preserveScroll: true })}>
                      {t('import_legacy', 'Importar legacy')}
                    </button>
                  </>
                ) : null}
                <button type="submit" className="btn-primary px-6 py-3 text-sm" disabled={form.processing}>
                  {t('save_all', 'Guardar todo')}
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <div className="text-lg font-black font-display">{t('page', 'Página')}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={t('title', 'Título')} value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} />
              <Field label={t('meta_description', 'Meta descripción')} value={form.data.meta_description} onChange={(e) => form.setData('meta_description', e.target.value)} />
            </div>
          </div>

          {(form.data.sections ?? []).map((s) => {
            const raw = sectionById.get(s.id);
            return (
              <SectionBlock
                key={s.id}
                section={s}
                rawSection={raw}
                locale={locale}
                agendaLocations={agenda_locations ?? []}
                onToggle={(v) => setSection(s.id, { enabled: v })}
                onChangeOrder={(v) => setSection(s.id, { order: v })}
                onChangeKey={(v) => setSection(s.id, { key: v })}
                onField={(k, v) => setSectionField(s.id, k, v)}
                onPoiChange={(poi) => setSectionPoi(s.id, poi)}
                onDelete={() => router.delete(route('admin.sections.destroy', s.id), { preserveScroll: true })}
              />
            );
          })}

          <div className="glass-card p-6 space-y-4">
            <div className="text-lg font-black font-display">{t('add_section', 'Añadir sección')}</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{t('type', 'Tipo')}</label>
                <CustomSelect
                  value={createSectionForm.data.type}
                  onChange={(v) => createSectionForm.setData('type', v)}
                  options={[
                    { value: 'hero', label: 'Hero' },
                    { value: 'next_event', label: 'Programa / Next Event' },
                    { value: 'shop_carousel', label: 'Shop Carousel' },
                    { value: 'magazine', label: 'Magazine' },
                    { value: 'testimonial', label: 'Testimonial' },
                    { value: 'map', label: 'Mapa' },
                    { value: 'generic', label: 'Generic' },
                  ]}
                />
              </div>
              <Field label={t('key_optional', 'Key (opcional)')} value={createSectionForm.data.key} onChange={(e) => createSectionForm.setData('key', e.target.value)} />
              <Field
                label={t('order', 'Orden')}
                type="number"
                value={createSectionForm.data.order}
                onChange={(e) => createSectionForm.setData('order', Number(e.target.value || 0))}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="btn-secondary px-6 py-3 text-sm"
                disabled={createSectionForm.processing}
                onClick={() => createSectionForm.post(route('admin.pages.sections.store', page.slug), { preserveScroll: true })}
              >
                {t('add_section', 'Añadir')}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn-primary px-6 py-3 text-sm" disabled={form.processing}>
              {t('save_all', 'Guardar todo')}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

function Field({ label, as, rows, type = 'text', value, onChange }) {
  const Tag = as === 'textarea' ? 'textarea' : 'input';
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{label}</label>
      <Tag
        rows={rows}
        type={as === 'textarea' ? undefined : type}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
        value={value ?? ''}
        onChange={onChange}
      />
    </div>
  );
}

function SectionBlock({ section, rawSection, locale, agendaLocations, onToggle, onChangeOrder, onChangeKey, onField, onPoiChange, onDelete }) {
  const defs = fieldsFor(section.type);
  const { props } = usePage();
  const t = (key, fallback) => tFrom(props?.translations?.cms, key, fallback);
  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">{t('section', 'Sección')}</div>
          <div className="text-2xl font-black mt-1">{section.type}</div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <SwitchToggle checked={!!section.enabled} onChange={onToggle} labelOn={t('active', 'Activa')} labelOff={t('inactive', 'Inactiva')} />
          <button type="button" className="btn-secondary px-6 py-3 text-sm" onClick={onDelete}>{t('delete', 'Eliminar')}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={t('order', 'Orden')} type="number" value={section.order} onChange={(e) => onChangeOrder(Number(e.target.value || 0))} />
        <Field label={t('key', 'Key')} value={section.key ?? ''} onChange={(e) => onChangeKey(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {defs.map((d) => (
          <Field
            key={d.key}
            label={d.labelKey ? t(d.labelKey, d.label) : d.label}
            as={d.as}
            rows={d.rows}
            value={section.fields?.[d.key] ?? ''}
            onChange={(e) => onField(d.key, e.target.value)}
          />
        ))}
      </div>

      {section.type === 'map' ? (
        <PoiEditor locale={locale} value={section.poi} agendaLocations={agendaLocations} onChange={onPoiChange} />
      ) : null}

      <SectionImages rawSection={rawSection} locale={locale} />
    </div>
  );
}

function PoiEditor({ locale, value, agendaLocations, onChange }) {
  const { props } = usePage();
  const t = (key, fallback) => tFrom(props?.translations?.cms, key, fallback);
  const v = value ?? { include_agenda_locations: true, agenda_location_ids: [], custom: [] };
  const includeAgenda = v.include_agenda_locations !== false;
  const selected = Array.isArray(v.agenda_location_ids) ? v.agenda_location_ids : [];
  const custom = Array.isArray(v.custom) ? v.custom : [];

  const set = (patch) => {
    onChange?.({ ...v, ...patch });
  };

  const toggleLocation = (id) => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    set({ agenda_location_ids: next });
  };

  const addCustom = () => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    set({
      custom: [
        ...custom,
        { id, name_i18n: { [locale]: '' }, address: '', google_maps_url: '', lat: null, lng: null },
      ],
    });
  };

  const updateCustom = (id, patch) => {
    set({ custom: custom.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  };

  const removeCustom = (id) => {
    set({ custom: custom.filter((p) => p.id !== id) });
  };

  return (
    <div className="pt-2 space-y-4">
      <div className="text-xs font-bold uppercase tracking-widest text-gray-500">{t('poi_title', 'Puntos de interés')}</div>
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-gray-400">{t('poi_include_agenda', 'Incluir ubicaciones de Agenda')}</div>
        <SwitchToggle
          checked={includeAgenda}
          onChange={(x) => set({ include_agenda_locations: x })}
          labelOn={t('yes', 'Sí')}
          labelOff={t('no', 'No')}
        />
      </div>

      {includeAgenda ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-bold mb-3">{t('poi_agenda_locations', 'Agenda locations')}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(agendaLocations ?? []).map((l) => {
              const name = l?.name_i18n?.[locale] ?? l?.name_i18n?.es ?? '';
              return (
                <label key={l.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5">
                  <input type="checkbox" checked={selected.includes(l.id)} onChange={() => toggleLocation(l.id)} />
                  <div className="min-w-0">
                    <div className="font-bold truncate">{name || l.id}</div>
                    <div className="text-xs text-gray-500 truncate">{l.address || ''}</div>
                  </div>
                </label>
              );
            })}
          </div>
          {!agendaLocations?.length ? <div className="text-gray-500 text-sm">{t('poi_no_agenda_with_coords', 'No hay ubicaciones con lat/lng en Agenda.')}</div> : null}
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <div className="text-sm font-bold">{t('poi_custom_title', 'Puntos personalizados')}</div>
        <button type="button" className="btn-secondary px-5 py-2 text-sm" onClick={addCustom}>
          {t('poi_add', 'Añadir punto')}
        </button>
      </div>

      <div className="space-y-4">
        {custom.map((p) => (
          <div key={p.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="text-sm font-bold">{t('poi_label', 'POI')}</div>
              <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={() => removeCustom(p.id)}>{t('delete', 'Eliminar')}</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Field
                label={t('poi_name', 'Nombre')}
                value={p?.name_i18n?.[locale] ?? ''}
                onChange={(e) => updateCustom(p.id, { name_i18n: { ...(p.name_i18n ?? {}), [locale]: e.target.value } })}
              />
              <Field label={t('poi_address', 'Dirección')} value={p.address ?? ''} onChange={(e) => updateCustom(p.id, { address: e.target.value })} />
              <Field label={t('poi_maps_url', 'Google Maps URL')} value={p.google_maps_url ?? ''} onChange={(e) => updateCustom(p.id, { google_maps_url: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label={t('poi_lat', 'Lat')}
                  value={p.lat ?? ''}
                  onChange={(e) => updateCustom(p.id, { lat: e.target.value === '' ? null : Number(e.target.value) })}
                />
                <Field
                  label={t('poi_lng', 'Lng')}
                  value={p.lng ?? ''}
                  onChange={(e) => updateCustom(p.id, { lng: e.target.value === '' ? null : Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
        ))}
        {!custom.length ? <div className="text-gray-500 text-sm">No hay puntos personalizados.</div> : null}
      </div>
    </div>
  );
}

function SectionImages({ rawSection, locale }) {
  const { props } = usePage();
  const t = (key, fallback) => tFrom(props?.translations?.cms, key, fallback);
  const imageRef = useRef(null);
  const bgRef = useRef(null);
  const images = rawSection?.config?.images ?? {};
  const imageEntry = images?.image ?? { shared: true, shared_path: null, paths: {} };
  const bgEntry = images?.background ?? { shared: true, shared_path: null, paths: {} };
  const imageUrl = imageEntry?.shared ? imageEntry?.shared_path : imageEntry?.paths?.[locale];
  const bgUrl = bgEntry?.shared ? bgEntry?.shared_path : bgEntry?.paths?.[locale];

  if (!rawSection?.id) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-500">{t('image', 'Imagen')}</div>
          <SwitchToggle
            checked={!!imageEntry?.shared}
            onChange={(v) => router.patch(route('admin.sections.update', rawSection.id), { image_modes: { image: v }, locale }, { preserveScroll: true })}
            labelOn={t('shared', 'Compartida')}
            labelOff={t('per_locale', 'Por idioma')}
          />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden aspect-[16/9] flex items-center justify-center">
          {imageUrl ? <img src={`/storage/${imageUrl}`} alt="" className="w-full h-full object-contain" /> : <div className="text-gray-600 text-sm">{t('no_image', 'Sin imagen')}</div>}
        </div>
        <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadSectionImage(e, rawSection.id, 'image', locale, !!imageEntry?.shared)} />
        <div className="flex items-center gap-3 mt-3">
          <button type="button" className="btn-secondary px-5 py-2 text-sm" onClick={() => imageRef.current?.click()}>{t('upload', 'Subir')}</button>
          <button
            type="button"
            className="btn-secondary px-5 py-2 text-sm"
            onClick={() =>
              router.delete(route('admin.sections.images.destroy', { section: rawSection.id, key: 'image' }), { data: { locale, shared: !!imageEntry?.shared }, preserveScroll: true })
            }
          >
            {t('remove', 'Quitar')}
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-500">{t('background', 'Background')}</div>
          <SwitchToggle
            checked={!!bgEntry?.shared}
            onChange={(v) => router.patch(route('admin.sections.update', rawSection.id), { image_modes: { background: v }, locale }, { preserveScroll: true })}
            labelOn={t('shared', 'Compartida')}
            labelOff={t('per_locale', 'Por idioma')}
          />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden aspect-[16/9] flex items-center justify-center">
          {bgUrl ? <img src={`/storage/${bgUrl}`} alt="" className="w-full h-full object-cover" /> : <div className="text-gray-600 text-sm">{t('no_image', 'Sin imagen')}</div>}
        </div>
        <input ref={bgRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadSectionImage(e, rawSection.id, 'background', locale, !!bgEntry?.shared)} />
        <div className="flex items-center gap-3 mt-3">
          <button type="button" className="btn-secondary px-5 py-2 text-sm" onClick={() => bgRef.current?.click()}>{t('upload', 'Subir')}</button>
          <button
            type="button"
            className="btn-secondary px-5 py-2 text-sm"
            onClick={() =>
              router.delete(route('admin.sections.images.destroy', { section: rawSection.id, key: 'background' }), { data: { locale, shared: !!bgEntry?.shared }, preserveScroll: true })
            }
          >
            {t('remove', 'Quitar')}
          </button>
        </div>
      </div>
    </div>
  );
}

function uploadSectionImage(e, sectionId, key, locale, shared) {
  const file = e.target.files?.[0] ?? null;
  e.target.value = '';
  if (!file) return;
  router.post(route('admin.sections.images.store', { section: sectionId, key }), { image: file, locale, shared }, { preserveScroll: true, forceFormData: true });
}
