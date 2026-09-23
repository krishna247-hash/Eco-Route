'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Compass, Navigation, RotateCcw, AlertCircle } from 'lucide-react';
import { LocationAutocomplete } from '@/components/map/LocationAutocomplete';
import { getRoute, reverseGeocode, type GetRouteResponse, type LocationResult } from '@/lib/locationApi';
import type L from 'leaflet';

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  return `${h}h ${m}m`;
}

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const fromMarkerRef = useRef<L.Marker | null>(null);
  const toMarkerRef = useRef<L.Marker | null>(null);
  const routeLayersRef = useRef<L.Layer[]>([]);
  const leafletRef = useRef<typeof L | null>(null);

  const [from, setFrom] = useState<LocationResult | null>(null);
  const [to, setTo] = useState<LocationResult | null>(null);
  const [route, setRoute] = useState<GetRouteResponse | null>(null);
  const [routing, setRouting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [clickError, setClickError] = useState<string | null>(null);

  // Init map once on mount (Leaflet needs `window`, hence the dynamic import inside useEffect).
  useEffect(() => {
    let cancelled = false;
    import('leaflet').then((leaflet) => {
      if (cancelled || !mapContainerRef.current || mapRef.current) return;
      const L = leaflet.default;
      leafletRef.current = L;

      const map = L.map(mapContainerRef.current, { worldCopyJump: true }).setView([20.5937, 78.9629], 4);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      map.on('click', async (e: L.LeafletMouseEvent) => {
        setClickError(null);
        const tempMarker = L.marker(e.latlng).addTo(map).bindPopup('Locating…').openPopup();
        try {
          const location = await reverseGeocode(e.latlng.lat, e.latlng.lng);
          tempMarker.setPopupContent(`<strong>${location.name}</strong><br/>${location.displayName}`);
          map.removeLayer(tempMarker);
          setPendingClickLocation(location);
        } catch {
          map.removeLayer(tempMarker);
          setClickError(
            'Could not identify that location right now (the map provider may be unreachable). Try searching by name instead.',
          );
        }
      });

      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [pendingClickLocation, setPendingClickLocation] = useState<LocationResult | null>(null);

  function markerIcon(L: typeof import('leaflet'), color: string) {
    return L.divIcon({
      className: '',
      html: `<div style="width:16px;height:16px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 16],
    });
  }

  const placeMarker = useCallback((which: 'from' | 'to', location: LocationResult) => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    const color = which === 'from' ? '#0f766e' : '#B8863B';
    const existingRef = which === 'from' ? fromMarkerRef : toMarkerRef;
    if (existingRef.current) map.removeLayer(existingRef.current);

    const marker = L.marker([location.latitude, location.longitude], { icon: markerIcon(L, color) })
      .addTo(map)
      .bindPopup(`<strong>${location.name}</strong><br/>${location.displayName}`);
    existingRef.current = marker;
    map.setView([location.latitude, location.longitude], Math.max(map.getZoom(), 8));
  }, []);

  function clearRoute() {
    const map = mapRef.current;
    if (map) {
      routeLayersRef.current.forEach((layer) => map.removeLayer(layer));
    }
    routeLayersRef.current = [];
    setRoute(null);
    setNotice(null);
  }

  function selectFrom(location: LocationResult) {
    setFrom(location);
    clearRoute();
    placeMarker('from', location);
  }

  function selectTo(location: LocationResult) {
    setTo(location);
    clearRoute();
    placeMarker('to', location);
  }

  async function handleShowRoute() {
    if (!from || !to) return;
    setRouting(true);
    clearRoute();

    const result = await getRoute(
      { latitude: from.latitude, longitude: from.longitude },
      { latitude: to.latitude, longitude: to.longitude },
    );
    setRoute(result);
    if (!result.ok) setNotice(result.note ?? null);

    const L = leafletRef.current;
    const map = mapRef.current;
    if (L && map) {
      result.routes.forEach((r, i) => {
        const latlngs = r.geometry.coordinates.map(([lon, lat]) => [lat, lon] as [number, number]);
        const line = L.polyline(latlngs, {
          color: i === 0 ? '#0f766e' : '#B9AF8E',
          weight: i === 0 ? 5 : 3,
          opacity: i === 0 ? 0.9 : 0.6,
          dashArray: result.ok ? undefined : '8 8',
        }).addTo(map);
        routeLayersRef.current.push(line);
      });
      const bounds = L.latLngBounds([
        [from.latitude, from.longitude],
        [to.latitude, to.longitude],
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    setRouting(false);
  }

  function handleReset() {
    const map = mapRef.current;
    if (map) {
      if (fromMarkerRef.current) map.removeLayer(fromMarkerRef.current);
      if (toMarkerRef.current) map.removeLayer(toMarkerRef.current);
    }
    fromMarkerRef.current = null;
    toMarkerRef.current = null;
    setFrom(null);
    setTo(null);
    setPendingClickLocation(null);
    clearRoute();
    mapRef.current?.setView([20.5937, 78.9629], 4);
  }

  const primaryRoute = route?.routes[0];
  const planParams = new URLSearchParams();
  if (from) planParams.set('fromName', from.name);
  if (to) {
    planParams.set('toName', to.name);
    planParams.set('toCountry', to.country ?? '');
    planParams.set('toLat', String(to.latitude));
    planParams.set('toLon', String(to.longitude));
  }
  if (primaryRoute) planParams.set('distanceKm', String(Math.round(primaryRoute.distanceKm)));

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex animate-fade-up items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <Compass className="h-5 w-5 text-emerald-600" />
            Explore the map
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Search or click to set a starting point and destination, then see a real routed distance.
          </p>
        </div>
      </div>

      <div className="mb-4 grid animate-fade-up gap-3 sm:grid-cols-2 [animation-delay:60ms]">
        <div>
          <label className="text-sm font-medium text-slate-700">From</label>
          <LocationAutocomplete placeholder="Search a starting point…" onSelect={selectFrom} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">To</label>
          <LocationAutocomplete placeholder="Search a destination…" onSelect={selectTo} />
        </div>
      </div>

      {pendingClickLocation && (
        <div className="mb-4 flex animate-fade-in flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <span>
            Set <strong>{pendingClickLocation.displayName}</strong> as:
          </span>
          <button
            type="button"
            onClick={() => selectFrom(pendingClickLocation)}
            className="rounded-md border border-emerald-600 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
          >
            From
          </button>
          <button
            type="button"
            onClick={() => selectTo(pendingClickLocation)}
            className="rounded-md border border-emerald-600 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
          >
            To
          </button>
        </div>
      )}

      {clickError && (
        <p className="mb-4 flex animate-fade-in items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
          {clickError}
        </p>
      )}

      <div className="mb-4 h-[420px] animate-scale-in overflow-hidden rounded-xl border border-slate-200 shadow-sm [animation-delay:120ms]">
        <div ref={mapContainerRef} className="h-full w-full" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleShowRoute}
          disabled={!from || !to || routing}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Navigation className="h-3.5 w-3.5" />
          {routing ? 'Routing…' : 'Show route'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
        {from && to && (
          <Link
            href={`/plan?${planParams.toString()}`}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
          >
            Plan this trip
          </Link>
        )}
      </div>

      {route && primaryRoute && (
        <div className="mt-4 animate-fade-up rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Distance</span>
            <strong className="text-slate-900">{primaryRoute.distanceKm.toFixed(1)} km</strong>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-sm">
            <span className="text-slate-500">Estimated travel time</span>
            <strong className="text-slate-900">
              {primaryRoute.durationMin != null ? formatDuration(primaryRoute.durationMin) : 'Unavailable'}
            </strong>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-sm">
            <span className="text-slate-500">Source</span>
            <strong className="text-slate-900">{route.ok ? 'Live routing (OSRM)' : 'Straight-line estimate'}</strong>
          </div>
          {notice && <p className="mt-2 text-xs text-amber-700">{notice}</p>}
        </div>
      )}
    </main>
  );
}
