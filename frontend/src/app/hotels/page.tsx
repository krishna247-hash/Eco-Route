'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, Calendar, ExternalLink, Hotel, ImageOff, Loader2, MapPin, Search, Star, Users } from 'lucide-react';
import { LocationAutocomplete } from '@/components/map/LocationAutocomplete';
import type { LocationResult } from '@/lib/locationApi';
import { searchHotels, type HotelListing } from '@/lib/hotelApi';
import { saveHotelSearchResults } from '@/lib/hotelStore';
import { makeMyTripSearchUrl } from '@/lib/makeMyTripLink';
import { useCurrency } from '@/lib/CurrencyProvider';
import { useI18n } from '@/i18n/I18nProvider';

function defaultDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

function HotelsPageInner() {
  const { t } = useI18n();
  const { formatInr } = useCurrency();
  const searchParams = useSearchParams();

  const [destination, setDestination] = useState<LocationResult | null>(() => {
    const name = searchParams.get('destinationName');
    const country = searchParams.get('destinationCountry');
    const lat = searchParams.get('destinationLat');
    const lon = searchParams.get('destinationLon');
    if (!name) return null;
    return {
      name,
      type: 'city',
      country: country ?? null,
      state: null,
      district: null,
      latitude: lat ? Number(lat) : 0,
      longitude: lon ? Number(lon) : 0,
      displayName: name,
      source: 'photon',
    };
  });
  const [checkIn, setCheckIn] = useState(() => defaultDate(30));
  const [checkOut, setCheckOut] = useState(() => defaultDate(33));
  const [guests, setGuests] = useState(2);
  const [hotels, setHotels] = useState<HotelListing[] | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(dest: LocationResult) {
    setLoading(true);
    setError(null);
    try {
      const result = await searchHotels({
        destinationName: dest.name,
        destinationCountry: dest.country ?? '',
        destinationLat: dest.latitude || undefined,
        destinationLon: dest.longitude || undefined,
        checkIn,
        checkOut,
        guests,
      });
      setHotels(result.hotels);
      setDisclaimer(result.disclaimer);
      saveHotelSearchResults(dest.name, result.hotels);
    } catch {
      setError(t('hotels.listingsUnavailable'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (destination) void runSearch(destination);
    // Only auto-run once, for a destination arriving via query params.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (destination) void runSearch(destination);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">{t('hotelsPage.title')}</h1>
        <p className="mt-1 text-sm text-slate-600">{t('hotelsPage.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="mb-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500">
            <MapPin className="h-3 w-3" />
            {t('hotelsPage.destinationLabel')}
          </label>
          <LocationAutocomplete
            initialValue={destination?.name ?? ''}
            placeholder={t('planForm.destinationPlaceholder')}
            onSelect={setDestination}
          />
        </div>
        <div>
          <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500">
            <Calendar className="h-3 w-3" />
            {t('hotelsPage.checkIn')}
          </label>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500">
            <Calendar className="h-3 w-3" />
            {t('hotelsPage.checkOut')}
          </label>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500">
            <Users className="h-3 w-3" />
            {t('hotelsPage.guests')}
          </label>
          <input
            type="number"
            min={1}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={!destination || loading}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 sm:col-span-4"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {t('hotelsPage.search')}
        </button>
      </form>

      {error && (
        <p className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 flex-none" />
          {error}
        </p>
      )}

      {disclaimer && (
        <p className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />
          {disclaimer}
        </p>
      )}

      {hotels === null && !loading && !error && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Hotel className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-500">{t('hotelsPage.searchPrompt')}</p>
        </div>
      )}

      {hotels && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hotels.map((hotel) => (
            <Link
              key={hotel.id}
              href={`/hotels/${hotel.id}`}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                {hotel.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={hotel.photoUrl} alt={hotel.name} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <ImageOff className="h-7 w-7" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">{hotel.name}</h3>
                  <span className="flex flex-none items-center gap-0.5 text-xs font-medium text-amber-700">
                    <Star className="h-3 w-3 fill-current" />
                    {hotel.rating.toFixed(1)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {t('hotels.kmFromCenter', { distance: hotel.distanceFromCenterKm.toFixed(1) })}
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {formatInr(hotel.pricePerNightUsd)}
                  <span className="text-xs font-normal text-slate-400"> {t('hotels.perNight')}</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {hotels && hotels.length > 0 && (
        <p className="mt-6 text-center text-xs text-slate-400">
          <a
            href={makeMyTripSearchUrl(destination?.name ?? '', destination?.name ?? '')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-slate-600"
          >
            <ExternalLink className="h-3 w-3" />
            {t('hotels.viewOnMakeMyTrip')}
          </a>
        </p>
      )}
    </main>
  );
}

export default function HotelsPage() {
  return (
    <Suspense fallback={null}>
      <HotelsPageInner />
    </Suspense>
  );
}
