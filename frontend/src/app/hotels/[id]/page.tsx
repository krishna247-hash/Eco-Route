'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ExternalLink, ImageOff, MapPin, Star } from 'lucide-react';
import { loadHotelById } from '@/lib/hotelStore';
import { makeMyTripSearchUrl } from '@/lib/makeMyTripLink';
import { useCurrency } from '@/lib/CurrencyProvider';
import { useI18n } from '@/i18n/I18nProvider';
import type { HotelListing } from '@/lib/hotelApi';

export default function HotelDetailPage() {
  const params = useParams<{ id: string }>();
  const { t } = useI18n();
  const { formatInr } = useCurrency();
  const [found, setFound] = useState<{ destinationName: string; hotel: HotelListing } | null | undefined>(undefined);

  useEffect(() => {
    setFound(loadHotelById(params.id));
  }, [params.id]);

  if (found === undefined) return null;

  if (found === null) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-slate-600">{t('hotelDetail.notFound')}</p>
        <Link href="/hotels" className="mt-4 inline-block font-medium text-emerald-700 underline underline-offset-4">
          {t('hotelDetail.backToSearch')}
        </Link>
      </main>
    );
  }

  const { destinationName, hotel } = found;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-100">
        {hotel.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hotel.photoUrl} alt={hotel.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <ImageOff className="h-10 w-10" />
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{hotel.name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin className="h-3.5 w-3.5" />
            {destinationName} · {t('hotels.kmFromCenter', { distance: hotel.distanceFromCenterKm.toFixed(1) })}
          </p>
        </div>
        <span className="flex flex-none items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-medium text-amber-700">
          <Star className="h-4 w-4 fill-current" />
          {hotel.rating.toFixed(1)}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {hotel.amenities.map((amenity) => (
          <span key={amenity} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
            {amenity}
          </span>
        ))}
      </div>

      <div className="mt-6 flex items-baseline justify-between rounded-xl border border-slate-200 bg-white p-5">
        <div>
          <p className="text-2xl font-semibold text-slate-900">{formatInr(hotel.pricePerNightUsd)}</p>
          <p className="text-xs text-slate-400">{t('hotels.perNight')}</p>
        </div>
        <p className="text-sm text-slate-500">
          {formatInr(hotel.totalPriceUsd)} {t('hotels.total')}
        </p>
      </div>

      <a
        href={makeMyTripSearchUrl(hotel.name, destinationName)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
      >
        <ExternalLink className="h-4 w-4" />
        {t('hotels.viewOnMakeMyTrip')}
      </a>
    </main>
  );
}
