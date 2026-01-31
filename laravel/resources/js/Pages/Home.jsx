import React, { useMemo } from 'react';
import Layout from '@/Layouts/Layout';
import Button from '@/Components/UI/Button';
import { motion } from 'framer-motion';
import { usePage } from '@inertiajs/react';
import LeafletMap from '@/Components/LeafletMap';
import { tFrom } from '@/i18n/t';

function getSection(sections, keyOrType) {
    return (sections ?? []).find((s) => s?.config?.key === keyOrType) ?? (sections ?? []).find((s) => s?.type === keyOrType) ?? null;
}

function isEnabled(section) {
    return (section?.config?.enabled ?? true) !== false;
}

function getContent(section, locale) {
    const c = section?.config?.content?.[locale];
    return c && typeof c === 'object' ? c : {};
}

function getImageUrl(section, imgKey, locale) {
    const entry = section?.config?.images?.[imgKey];
    if (!entry) return null;
    const shared = !!entry.shared;
    const path = shared ? entry.shared_path : entry?.paths?.[locale];
    return path ? `/storage/${path}` : null;
}

export default function Home({ locale = 'en', sections, products, events, agenda_locations }) {
    const pageProps = usePage().props;
    const t = (key, fallback) => tFrom(pageProps?.translations?.home, key, fallback);

    const heroSection = useMemo(() => getSection(sections, 'hero'), [sections]);
    const programSection = useMemo(() => getSection(sections, 'program') ?? getSection(sections, 'next_event'), [sections]);
    const shopSection = useMemo(() => getSection(sections, 'shop') ?? getSection(sections, 'shop_carousel'), [sections]);
    const magazineSection = useMemo(() => getSection(sections, 'magazine'), [sections]);
    const testimonialSection = useMemo(() => getSection(sections, 'testimonial'), [sections]);
    const mapSection = useMemo(() => getSection(sections, 'map'), [sections]);

    const hero = getContent(heroSection, locale);
    const heroBg = getImageUrl(heroSection, 'background', locale);
    const heroImage = getImageUrl(heroSection, 'image', locale);

    const program = getContent(programSection, locale);
    const shop = getContent(shopSection, locale);
    const magazine = getContent(magazineSection, locale);
    const testimonial = getContent(testimonialSection, locale);
    const map = getContent(mapSection, locale);
    const mapPoi = mapSection?.config?.poi ?? {};
    const agenda = agenda_locations ?? [];
    const agendaIds = Array.isArray(mapPoi?.agenda_location_ids) ? mapPoi.agenda_location_ids : [];
    const includeAgenda = mapPoi?.include_agenda_locations !== false;
    const agendaMarkers = includeAgenda
        ? (agendaIds.length ? agenda.filter((a) => agendaIds.includes(a.id)) : agenda)
            .map((a) => ({
                id: a.id,
                title: a.name,
                subtitle: a.address || '',
                url: a.google_maps_url || '',
                lat: a.lat,
                lng: a.lng,
                color: '#22c55e',
            }))
        : [];

    const customMarkers = Array.isArray(mapPoi?.custom) ? mapPoi.custom : [];
    const custom = customMarkers.map((p) => ({
        id: p.id,
        title: (p.name_i18n?.[locale] ?? p.name_i18n?.es ?? p.name ?? ''),
        subtitle: p.address || '',
        url: p.google_maps_url || '',
        lat: p.lat,
        lng: p.lng,
        color: '#ff3b81',
    }));

    const allMarkers = [...custom, ...agendaMarkers];
    const defaultCenter = allMarkers.find((m) => Number.isFinite(Number(m.lat)) && Number.isFinite(Number(m.lng)));
    const center = defaultCenter ? { lat: Number(defaultCenter.lat), lng: Number(defaultCenter.lng) } : { lat: 41.2372, lng: 1.8056 };

    return (
        <Layout>
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Background Shapes with smoother motion */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    {heroBg ? (
                        <div className="absolute inset-0 opacity-35" style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    ) : null}
                    <motion.div
                        animate={{
                            x: [0, 100, 0],
                            y: [0, -50, 0],
                            scale: [1, 1.1, 1],
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-20 -left-20 w-[800px] h-[800px] bg-accent-primary/10 rounded-full blur-[150px]"
                    />
                    <motion.div
                        animate={{
                            x: [0, -100, 0],
                            y: [0, 50, 0],
                            scale: [1.1, 1, 1.1],
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute -bottom-40 -right-40 w-[900px] h-[900px] bg-accent-tertiary/5 rounded-full blur-[180px]"
                    />
                </div>
                <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/70 via-black/60 to-black" />

                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <span className="inline-block px-6 py-2 rounded-full bg-white/5 border border-white/10 text-accent-primary text-xs font-bold tracking-widest uppercase mb-8">
                                {hero.badge || 'Sitges • 5-14 Septiembre 2026'}
                            </span>
                            <h1 className="text-7xl md:text-[120px] font-black tracking-tighter mb-8 leading-[0.9] text-white">
                                {hero.title ? (
                                    <span className="whitespace-pre-line">{hero.title}</span>
                                ) : (
                                    <>
                                        WE ARE <br />
                                        BEARS <span className="text-gradient">WEEK</span>
                                    </>
                                )}
                            </h1>
                            <p className="max-w-xl mx-auto text-lg md:text-xl text-gray-400 mb-12 font-medium leading-relaxed">
                                {hero.subtitle || (
                                    <>
                                        El epicentro mundial de la cultura bear.
                                        <br />
                                        Un viaje de libertad, música y comunidad frente al mar.
                                    </>
                                )}
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                <Button variant="primary" className="w-full sm:w-auto" href={hero.cta_primary_url || route('products.index')}>
                                    {hero.cta_primary_label || 'Conseguir Tickets'}
                                </Button>
                                <Button variant="secondary" className="w-full sm:w-auto" href={hero.cta_secondary_url || route('magazine.index')}>
                                    {hero.cta_secondary_label || 'Explorar Galería'}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                    {heroImage ? (
                        <div className="max-w-5xl mx-auto mt-16">
                            <div className="glass-card p-6">
                                <img src={heroImage} alt="" className="w-full max-h-[520px] object-contain" />
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Vertical Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-4"
                >
                    <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold">{t('scroll', 'Scroll')}</span>
                    <div className="w-px h-12 bg-gradient-to-b from-accent-primary to-transparent" />
                </motion.div>
            </section>

            {/* Bento Grid - Events Preview */}
            {(!programSection || isEnabled(programSection)) ? (
            <section className="py-32 px-6">
                <div className="container mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                        <div>
                            <span className="text-accent-primary font-bold tracking-widest uppercase text-xs mb-4 block">{program.kicker || t('featured_events', 'Eventos Destacados')}</span>
                            <h2 className="text-5xl md:text-7xl font-black tracking-tighter">{program.heading || t('program_heading', 'EL PROGRAMA')}</h2>
                        </div>
                        <Button variant="ghost" href={program.cta_url || route('program.index')}>{program.cta_label || t('view_full_calendar', 'Ver calendario completo →')}</Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 min-h-[800px]">
                        {/* Big Card */}
                        <div className="md:col-span-2 md:row-span-2 glass-card group overflow-hidden relative" data-aos="fade-up">
                            <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <span className="text-sm font-bold text-accent-primary mb-2 block">{program.big_label || 'MAIN EVENT'}</span>
                                    <h3 className="text-4xl font-bold mb-4">{program.big_title || 'Playa Bear Opening'}</h3>
                                </div>
                                <p className="text-gray-400 max-w-sm">
                                    {program.big_body || 'La inauguración oficial en el chiringuito de la costa. Música, sol y miles de osos.'}
                                </p>
                            </div>
                        </div>

                        {/* Smaller Cards */}
                        <div className="glass-card md:col-span-1 group" data-aos="fade-up" data-aos-delay="100">
                            <h4 className="text-xl font-bold mb-2">{program.card1_title || 'Pool Party'}</h4>
                            <p className="text-sm text-gray-500">{program.card1_subtitle || 'Hotel Terraza'}</p>
                        </div>

                        <div className="glass-card md:col-span-1 border-accent-secondary/20 group" data-aos="fade-up" data-aos-delay="200">
                            <h4 className="text-xl font-bold mb-2 text-accent-secondary">{program.card2_title || 'VIP Gala'}</h4>
                            <p className="text-sm text-gray-500">{program.card2_subtitle || 'Casino Prado'}</p>
                        </div>

                        <div className="glass-card md:col-span-2 group flex items-center justify-between" data-aos="fade-up" data-aos-delay="300">
                            <div>
                                <h4 className="text-2xl font-bold mb-1">{program.wide_title || 'Pop-up Shop'}</h4>
                                <p className="text-sm text-gray-500">{program.wide_subtitle || 'Exclusive Merchandising'}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                                →
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            ) : null}

            {(!shopSection || isEnabled(shopSection)) ? (
            <section className="py-24 px-6">
                <div className="container mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-8">
                        <div>
                            <span className="text-accent-primary font-bold tracking-widest uppercase text-xs mb-4 block">{shop.kicker || 'Shop'}</span>
                            <h2 className="text-5xl md:text-7xl font-black tracking-tighter">{shop.title || t('store_title', 'LA STORE')}</h2>
                        </div>
                        <Button variant="ghost" href={shop.cta_url || route('products.index')}>{shop.cta_label || 'Ver tienda →'}</Button>
                    </div>

                    <div className="overflow-x-auto -mx-6 px-6">
                        <div className="flex gap-6 min-w-full pb-4">
                            {(products ?? []).map((p) => (
                                <a key={p.id} href={route('products.show', p.id)} className="glass-card w-[280px] shrink-0 group">
                                    <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                                        {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : null}
                                    </div>
                                    <div className="mt-4">
                                        <div className="text-lg font-bold leading-snug">{p.name}</div>
                                        <div className="text-gray-500 text-sm mt-1">{p.price}€</div>
                                    </div>
                                </a>
                            ))}
                            {!(products ?? []).length ? (
                                <div className="glass-card w-full p-10 text-gray-500">{t('no_products', 'No hay productos activos todavía.')}</div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </section>
            ) : null}

            {(!magazineSection || isEnabled(magazineSection)) ? (
            <section className="py-24 px-6">
                <div className="container mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-8">
                        <div>
                            <span className="text-accent-primary font-bold tracking-widest uppercase text-xs mb-4 block">{magazine.kicker || 'Magazine'}</span>
                            <h2 className="text-5xl md:text-7xl font-black tracking-tighter">{magazine.title || t('magazine_title', 'BEARS SITGES MAGAZINE')}</h2>
                            {magazine.subtitle ? <p className="text-gray-400 mt-5 max-w-3xl">{magazine.subtitle}</p> : null}
                        </div>
                        <Button variant="ghost" href={magazine.cta_url || route('magazine.index')}>{magazine.cta_label || 'Ver magazine →'}</Button>
                    </div>
                    <div className="glass-card p-6">
                        <div className="text-gray-400 text-sm">Sección lista para carruseles de posts y PDFs (CRUD en siguiente paso).</div>
                    </div>
                </div>
            </section>
            ) : null}

            {(!testimonialSection || isEnabled(testimonialSection)) ? (
            <section className="py-24 px-6">
                <div className="container mx-auto">
                    <div className="glass-card p-10">
                        <span className="text-accent-primary font-bold tracking-widest uppercase text-xs mb-4 block">{testimonial.kicker || t('testimonial_kicker', 'Testimonial')}</span>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-8">{testimonial.title || t('testimonial_title', 'LO QUE DICEN')}</h2>
                        <div className="text-xl md:text-2xl text-gray-200 leading-relaxed whitespace-pre-line">
                            {testimonial.quote || '“Una semana inolvidable. Energía, comunidad y libertad.”'}
                        </div>
                        <div className="mt-8 text-gray-400">
                            <span className="font-bold text-white">{testimonial.author || 'Bears Community'}</span>
                            {testimonial.role ? <span> · {testimonial.role}</span> : null}
                        </div>
                    </div>
                </div>
            </section>
            ) : null}

            {(!mapSection || isEnabled(mapSection)) ? (
            <section className="py-24 px-6">
                <div className="container mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-8">
                        <div>
                            <span className="text-accent-primary font-bold tracking-widest uppercase text-xs mb-4 block">{map.kicker || t('map_kicker', 'Mapa')}</span>
                            <h2 className="text-5xl md:text-7xl font-black tracking-tighter">{map.title || t('map_title', 'PUNTOS DE INTERÉS')}</h2>
                            {map.subtitle ? <p className="text-gray-400 mt-5 max-w-3xl">{map.subtitle}</p> : null}
                        </div>
                        <Button variant="ghost" href={map.cta_url || route('recomendations.index')}>{map.cta_label || 'Ver recomendaciones →'}</Button>
                    </div>
                    <div className="glass-card p-6">
                        <LeafletMap center={center} zoom={14} markers={allMarkers} />
                        {!allMarkers.length ? <div className="text-gray-500 text-sm mt-4">{t('map_empty', 'No hay puntos de interés para mostrar.')}</div> : null}
                    </div>
                </div>
            </section>
            ) : null}
        </Layout>
    );
}
