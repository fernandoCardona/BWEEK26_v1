import React, { useMemo } from 'react';
import Layout from '@/Layouts/Layout';
import { Link, usePage } from '@inertiajs/react';
import LeafletMap from '@/Components/LeafletMap';
import { tFrom } from '@/i18n/t';

function getImageUrl(images, key, locale) {
  const entry = images?.[key];
  if (!entry) return null;
  const shared = !!entry.shared;
  const path = shared ? entry.shared_path : entry?.paths?.[locale];
  return path ? `/storage/${path}` : null;
}

function getContent(config, locale) {
  const c = config?.content?.[locale];
  return c && typeof c === 'object' ? c : {};
}

export default function Page({ slug, page, sections, locale, agenda_locations }) {
  const { props } = usePage();
  const t = (key, fallback) => tFrom(props?.translations?.page, key, fallback);
  const title = page?.title?.[locale] || page?.title?.en || slug;
  const enabledSections = useMemo(() => {
    return (sections ?? []).filter((s) => (s?.config?.enabled ?? true) !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [sections]);

  return (
    <Layout>
      <div className="pt-24 pb-20">
        {enabledSections.map((s) => {
          const cfg = s?.config ?? {};
          const images = cfg?.images ?? {};
          const content = getContent(cfg, locale);
          const bg = getImageUrl(images, 'background', locale);
          const image = getImageUrl(images, 'image', locale);
          const key = cfg?.key || s.id;

          if (s.type === 'hero') {
            return (
              <section key={key} className="relative pt-28 pb-20 px-6 overflow-hidden">
                {bg ? <div className="absolute inset-0 opacity-40" style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} /> : null}
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
                <div className="container mx-auto relative">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                    <div className="lg:col-span-7">
                      <div className="text-accent-primary font-bold tracking-widest uppercase text-xs mb-4">{content.kicker || t('hero_kicker_default', 'Bears Sitges Week')}</div>
                      <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-display">
                        {content.title || title}
                      </h1>
                      {content.subtitle ? <p className="text-gray-300 mt-5 text-lg max-w-2xl">{content.subtitle}</p> : null}
                      {content.cta_label && content.cta_url ? (
                        <div className="mt-8">
                          <Link href={content.cta_url} className="btn-primary px-8 py-4 inline-flex text-sm">
                            {content.cta_label}
                          </Link>
                        </div>
                      ) : null}
                    </div>
                    <div className="lg:col-span-5">
                      <div className="glass-card p-6">
                        {image ? <img src={image} alt="" className="w-full h-72 object-contain" /> : <div className="h-72 bg-white/5 rounded-2xl" />}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          if (s.type === 'shop_carousel') {
            return (
              <section key={key} className="px-6 py-16">
                <div className="container mx-auto">
                  <div className="flex items-end justify-between gap-6 mb-6">
                    <div>
                      <div className="text-accent-primary font-bold tracking-widest uppercase text-xs mb-2">{content.kicker || t('shop_kicker_default', 'Shop')}</div>
                      <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase font-display">
                        {content.title || t('shop_title_default', 'Productos')}
                      </h2>
                    </div>
                    <Link href={route('products.index')} className="btn-secondary px-6 py-3 text-sm">
                      {t('shop_cta_default', 'Ver tienda')}
                    </Link>
                  </div>
                  <div className="glass-card p-6">
                    <div className="text-gray-400 text-sm">{t('shop_placeholder', 'Sección preparada para carrusel de productos (Store).')}</div>
                  </div>
                </div>
              </section>
            );
          }

          if (s.type === 'map') {
            const poi = cfg?.poi ?? {};
            const agenda = agenda_locations ?? [];
            const includeAgenda = poi?.include_agenda_locations !== false;
            const agendaIds = Array.isArray(poi?.agenda_location_ids) ? poi.agenda_location_ids : [];
            const agendaMarkers = includeAgenda
              ? (agendaIds.length ? agenda.filter((a) => agendaIds.includes(a.id)) : agenda).map((a) => ({
                  id: a.id,
                  title: a.name,
                  subtitle: a.address || '',
                  url: a.google_maps_url || '',
                  lat: a.lat,
                  lng: a.lng,
                  color: '#22c55e',
                }))
              : [];

            const customMarkers = Array.isArray(poi?.custom) ? poi.custom : [];
            const custom = customMarkers.map((p) => ({
              id: p.id,
              title: p?.name_i18n?.[locale] ?? p?.name_i18n?.es ?? p?.name ?? '',
              subtitle: p.address || '',
              url: p.google_maps_url || '',
              lat: p.lat,
              lng: p.lng,
              color: '#ff3b81',
            }));

            const allMarkers = [...custom, ...agendaMarkers];
            const first = allMarkers.find((m) => Number.isFinite(Number(m.lat)) && Number.isFinite(Number(m.lng)));
            const center = first ? { lat: Number(first.lat), lng: Number(first.lng) } : { lat: 41.2372, lng: 1.8056 };

            return (
              <section key={key} className="px-6 py-16">
                <div className="container mx-auto">
                  <div className="glass-card p-6">
                    {content.title ? <h2 className="text-2xl md:text-4xl font-black tracking-tighter mb-4 font-display">{content.title}</h2> : null}
                    {content.subtitle ? <div className="text-gray-300 whitespace-pre-line mb-6">{content.subtitle}</div> : null}
                    <LeafletMap center={center} zoom={14} markers={allMarkers} />
                  </div>
                </div>
              </section>
            );
          }

          return (
            <section key={key} className="px-6 py-16">
              <div className="container mx-auto">
                <div className="glass-card p-6">
                  {content.title ? <h2 className="text-2xl md:text-4xl font-black tracking-tighter mb-4 font-display">{content.title}</h2> : null}
                  {content.body ? <div className="text-gray-300 whitespace-pre-line">{content.body}</div> : <div className="text-gray-500 text-sm">{t('section_placeholder_prefix', 'Sección')} {s.type}</div>}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </Layout>
  );
}
