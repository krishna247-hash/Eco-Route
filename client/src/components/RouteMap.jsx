import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MODE_META } from '../utils.js';

const dot = (color, size = 14) =>
  L.divIcon({
    className: '',
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

/** Great-circle-ish arc for flights so they read differently from ground routes. */
function arc([lat1, lng1], [lat2, lng2], steps = 48) {
  const pts = [];
  const bulge = Math.min(12, Math.hypot(lat2 - lat1, lng2 - lng1) * 0.15);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lift = Math.sin(Math.PI * t) * bulge;
    pts.push([lat1 + (lat2 - lat1) * t + lift, lng1 + (lng2 - lng1) * t]);
  }
  return pts;
}

export default function RouteMap({ origin, destination, mode, activities = [], lodging }) {
  const el = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);

  useEffect(() => {
    map.current = L.map(el.current, { scrollWheelZoom: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 18,
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => map.current.remove();
  }, []);

  useEffect(() => {
    const g = layer.current;
    g.clearLayers();
    const color = MODE_META[mode]?.color ?? '#10b981';
    const line = mode === 'flight' ? arc(origin.coords, destination.coords) : [origin.coords, destination.coords];
    L.polyline(line, {
      color,
      weight: 4,
      opacity: 0.85,
      dashArray: mode === 'flight' ? '8 8' : null,
    }).addTo(g);

    L.marker(origin.coords, { icon: dot('#0f172a', 16) })
      .bindPopup(`<strong>Origin</strong><br/>${origin.name}, ${origin.country}`)
      .addTo(g);
    L.marker(destination.coords, { icon: dot(color, 18) })
      .bindPopup(`<strong>Destination</strong><br/>${destination.name}, ${destination.country}`)
      .addTo(g);
    if (lodging?.coords) {
      L.marker(lodging.coords, { icon: dot('#f59e0b', 12) })
        .bindPopup(`<strong>${lodging.name}</strong><br/>${lodging.carbonKgPerNight} kg CO₂e / night`)
        .addTo(g);
    }
    const seen = new Set();
    for (const a of activities) {
      if (seen.has(a.name)) continue;
      seen.add(a.name);
      L.marker(a.coords, { icon: dot('#8b5cf6', 11) })
        .bindPopup(`<strong>${a.name}</strong><br/>${a.category} · ${a.durationHours} h`)
        .addTo(g);
    }
    map.current.fitBounds(L.latLngBounds(line), { padding: [30, 30] });
  }, [origin, destination, mode, activities, lodging]);

  return (
    <div className="map-wrap">
      <div ref={el} className="map" />
      <div className="map-legend">
        <span><i style={{ background: '#0f172a' }} /> Origin</span>
        <span><i style={{ background: MODE_META[mode]?.color }} /> Destination</span>
        <span><i style={{ background: '#f59e0b' }} /> Lodging</span>
        <span><i style={{ background: '#8b5cf6' }} /> Activities</span>
      </div>
    </div>
  );
}
