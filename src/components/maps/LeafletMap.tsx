'use client';

import React, { useEffect, useRef } from 'react';
import { Coordinates, TripLeg, Activity } from '@/lib/types';

interface LeafletMapProps {
  originCoords: Coordinates;
  originName: string;
  destCoords: Coordinates;
  destName: string;
  legs: TripLeg[];
  activities?: Activity[];
  mode?: string;
}

export default function LeafletMap({
  originCoords,
  originName,
  destCoords,
  destName,
  legs,
  activities = [],
  mode = 'train',
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    // Dynamically import Leaflet to avoid Next.js SSR window errors
    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous map instance if it exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize Map
      const map = L.map(mapContainerRef.current, {
        center: [
          (originCoords.lat + destCoords.lat) / 2,
          (originCoords.lng + destCoords.lng) / 2,
        ],
        zoom: 6,
        scrollWheelZoom: false,
      });
      mapInstanceRef.current = map;

      // Add OpenStreetMap CartoDB Positron / Eco tiles for clean modern aesthetic
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; OpenStreetMap & CartoDB',
          maxZoom: 19,
        }
      ).addTo(map);

      // Custom Pin HTML generator
      const createCustomIcon = (bgColor: string, text: string) => {
        return L.divIcon({
          className: 'custom-map-marker',
          html: `<div style="
            background: ${bgColor};
            color: white;
            padding: 4px 8px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
            border: 2px solid white;
            display: flex;
            align-items: center;
            gap: 4px;
          ">${text}</div>`,
          iconSize: [80, 30],
          iconAnchor: [40, 15],
        });
      };

      // Add Origin Marker
      const originMarker = L.marker([originCoords.lat, originCoords.lng], {
        icon: createCustomIcon('#059669', `🟢 ${originName}`),
      }).addTo(map);
      originMarker.bindPopup(`<b>Origin: ${originName}</b><br/>Starting point.`);

      // Add Destination Marker
      const destMarker = L.marker([destCoords.lat, destCoords.lng], {
        icon: createCustomIcon('#0d9488', `🏁 ${destName}`),
      }).addTo(map);
      destMarker.bindPopup(`<b>Destination: ${destName}</b><br/>Primary trip destination.`);

      // Add Activity Markers
      activities.forEach((act) => {
        if (act.coords) {
          const actMarker = L.marker([act.coords.lat, act.coords.lng], {
            icon: createCustomIcon('#4f46e5', `📍 ${act.name.slice(0, 15)}...`),
          }).addTo(map);
          actMarker.bindPopup(`<b>${act.name}</b><br/>Category: ${act.category}<br/>Est. Carbon: ${act.carbonKg} kg CO2e`);
        }
      });

      // Draw Route Polyline
      const latlngs: [number, number][] = [
        [originCoords.lat, originCoords.lng],
        [destCoords.lat, destCoords.lng],
      ];

      const routeColor = mode === 'train' ? '#059669' : mode === 'ev' ? '#0284c7' : mode === 'flight' ? '#e11d48' : '#d97706';
      const polyline = L.polyline(latlngs, {
        color: routeColor,
        weight: 4,
        opacity: 0.85,
        dashArray: mode === 'flight' ? '8, 8' : undefined,
      }).addTo(map);

      // Fit bounds to display all markers comfortably
      const group = L.featureGroup([originMarker, destMarker]);
      map.fitBounds(group.getBounds().pad(0.3));
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [originCoords, destCoords, originName, destName, legs, activities, mode]);

  return (
    <div className="relative w-full h-[380px] sm:h-[450px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute bottom-3 left-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 shadow-sm flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        Interactive Route & Attraction Map (OpenStreetMap)
      </div>
    </div>
  );
}
