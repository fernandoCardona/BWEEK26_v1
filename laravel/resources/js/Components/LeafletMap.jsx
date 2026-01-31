import React, { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function LeafletMap({ center, zoom = 14, markers = [], className = '' }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  const safeCenter = useMemo(() => {
    const lat = Number(center?.lat);
    const lng = Number(center?.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : { lat: 41.2372, lng: 1.8056 };
  }, [center]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: false }).setView([safeCenter.lat, safeCenter.lng], zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    return () => {
      layerRef.current?.clearLayers();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, [safeCenter.lat, safeCenter.lng, zoom]);

  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return;
    layerRef.current.clearLayers();

    const bounds = [];
    (markers ?? []).forEach((m) => {
      const lat = Number(m.lat);
      const lng = Number(m.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const color = m.color || '#ff3b81';
      const marker = L.circleMarker([lat, lng], {
        radius: 7,
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.8,
      });

      const title = String(m.title || '').trim();
      const subtitle = String(m.subtitle || '').trim();
      const url = String(m.url || '').trim();
      const html = `
        <div style="min-width:220px">
          ${title ? `<div style="font-weight:800;margin-bottom:6px">${escapeHtml(title)}</div>` : ''}
          ${subtitle ? `<div style="opacity:0.8;margin-bottom:8px;white-space:pre-line">${escapeHtml(subtitle)}</div>` : ''}
          ${url ? `<a href="${escapeAttr(url)}" target="_blank" rel="noreferrer" style="color:#ff3b81;font-weight:700">Google Maps</a>` : ''}
        </div>
      `;
      marker.bindPopup(html, { closeButton: true, autoPan: true, maxWidth: 360 });
      marker.on('mouseover', () => marker.openPopup());
      marker.on('mouseout', () => marker.closePopup());
      marker.addTo(layerRef.current);
      bounds.push([lat, lng]);
    });

    if (bounds.length >= 2) {
      mapRef.current.fitBounds(bounds, { padding: [40, 40] });
    } else if (bounds.length === 1) {
      mapRef.current.setView(bounds[0], zoom);
    } else {
      mapRef.current.setView([safeCenter.lat, safeCenter.lng], zoom);
    }
  }, [markers, safeCenter.lat, safeCenter.lng, zoom]);

  return <div ref={containerRef} className={`w-full h-[420px] rounded-2xl overflow-hidden border border-white/10 ${className}`} />;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttr(s) {
  return escapeHtml(String(s)).replaceAll('`', '&#x60;');
}

