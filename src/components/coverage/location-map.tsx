'use client';

import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMap, Marker } from 'leaflet';
import { useEffect, useRef } from 'react';
import type { GeoPoint } from '@/modules/coverage/domain/coverage';

const DEFAULT_CENTER: GeoPoint = { lat: -6.2, lng: 106.82 }; // Jakarta — neutral starting view

const PIN_HTML =
  '<svg width="30" height="40" viewBox="0 0 30 40" aria-hidden="true"><path d="M15 39C15 39 28 24.4 28 14A13 13 0 0 0 2 14c0 10.4 13 25 13 25Z" fill="#2563EB" stroke="#fff" stroke-width="2"/><circle cx="15" cy="14" r="5" fill="#fff"/></svg>';

/**
 * Map for confirming the installation point. Click/tap or drag the pin to set it.
 * Tiles: OpenStreetMap (attribution required). Loaded on the client only.
 */
export function LocationMap({
  value,
  onChange,
  className,
}: {
  value: GeoPoint | null;
  onChange: (p: GeoPoint) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !containerRef.current || mapRef.current) return;
      const start = value ?? DEFAULT_CENTER;
      const map = L.map(containerRef.current, {
        center: [start.lat, start.lng],
        zoom: value ? 16 : 11,
        scrollWheelZoom: false,
      });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const icon = L.divIcon({
        html: PIN_HTML,
        className: 'gmm-pin',
        iconSize: [30, 40],
        iconAnchor: [15, 39],
      });
      const place = (p: GeoPoint) => {
        if (!markerRef.current) {
          markerRef.current = L.marker([p.lat, p.lng], {
            icon,
            draggable: true,
            keyboard: true,
            title: 'Titik pemasangan',
          })
            .addTo(map)
            .on('dragend', (e) => {
              const ll = (e.target as Marker).getLatLng();
              onChangeRef.current({ lat: ll.lat, lng: ll.lng });
            });
        } else {
          markerRef.current.setLatLng([p.lat, p.lng]);
        }
      };
      if (value) place(value);
      map.on('click', (e) => {
        const p = { lat: e.latlng.lat, lng: e.latlng.lng };
        place(p);
        onChangeRef.current(p);
      });
      mapRef.current = map;
      (containerRef.current as HTMLDivElement & { __place?: (p: GeoPoint) => void }).__place =
        place;
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Map is created once; later value changes are applied by the effect below.
  }, []);

  useEffect(() => {
    const el = containerRef.current as
      (HTMLDivElement & { __place?: (p: GeoPoint) => void }) | null;
    if (!value || !mapRef.current || !el?.__place) return;
    el.__place(value);
    const current = mapRef.current.getCenter();
    if (Math.abs(current.lat - value.lat) > 0.002 || Math.abs(current.lng - value.lng) > 0.002) {
      mapRef.current.setView([value.lat, value.lng], Math.max(mapRef.current.getZoom(), 16));
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Peta titik pemasangan. Klik peta untuk menaruh pin."
      className={className}
    />
  );
}
