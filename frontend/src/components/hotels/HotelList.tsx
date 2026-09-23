'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, MapPin, Star } from 'lucide-react';
import { searchHotels, type AccommodationTier, type HotelListing } from '@/lib/hotelApi';

interface HotelListProps {
  destinationName: string;
  destinationCountry: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  tier?: AccommodationTier;
}

export function HotelList({ destinationName, destinationCountry, checkIn, checkOut, guests, tier }: HotelListProps) {
  const [hotels, setHotels] = useState<HotelListing[] | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHotels(null);
    setError(null);

    searchHotels({ destinationName, destinationCountry, checkIn, checkOut, guests, tier })
      .then((result) => {
        if (cancelled) return;
        setHotels(result.hotels);
        setDisclaimer(result.disclaimer);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Hotel listings are temporarily unavailable.');
      });

    return () => {
      cancelled = true;
    };
  }, [destinationName, destinationCountry, checkIn, checkOut, guests, tier]);

  if (error) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
        <AlertTriangle className="h-4 w-4 flex-none" />
        {error}
      </p>
    );
  }

  if (!hotels) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Finding places to stay…
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />
        {disclaimer}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {hotels.map((hotel) => (
          <div key={hotel.id} className="card-hover rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-1 flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">{hotel.name}</h3>
              <span className="flex flex-none items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                <Star className="h-3 w-3 fill-current" />
                {hotel.rating.toFixed(1)}
              </span>
            </div>
            <p className="mb-2 flex items-center gap-1 text-xs capitalize text-slate-500">
              <MapPin className="h-3 w-3" />
              {hotel.distanceFromCenterKm.toFixed(1)} km from center · {hotel.tier} tier
            </p>
            <div className="mb-2 flex flex-wrap gap-1">
              {hotel.amenities.map((amenity) => (
                <span key={amenity} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                  {amenity}
                </span>
              ))}
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-semibold text-slate-900">${hotel.pricePerNightUsd}</span>
              <span className="text-xs text-slate-400">/night · ${hotel.totalPriceUsd} total</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
