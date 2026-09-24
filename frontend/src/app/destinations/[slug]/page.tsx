'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Compass, Hotel, ImageOff, MapPin } from 'lucide-react';
import { findDestinationBySlug } from '@/lib/destinations.data';
import { getDestinationSummary, getFamousPlaces, type Attraction, type DestinationSummary } from '@/lib/destinationApi';
import { WeatherWidget } from '@/components/destinations/WeatherWidget';
import { useI18n } from '@/i18n/I18nProvider';

export default function DestinationDetailPage() {
  const params = useParams<{ slug: string }>();
  const { t } = useI18n();
  const destination = findDestinationBySlug(params.slug);
  const [summary, setSummary] = useState<DestinationSummary | null | undefined>(undefined);
  const [attractions, setAttractions] = useState<Attraction[] | undefined>(undefined);

  useEffect(() => {
    if (!destination) return;
    let cancelled = false;
    getDestinationSummary(destination.name).then((result) => {
      if (!cancelled) setSummary(result);
    });
    getFamousPlaces(destination.name, destination.latitude, destination.longitude).then((result) => {
      if (!cancelled) setAttractions(result);
    });
    return () => {
      cancelled = true;
    };
  }, [destination]);

  if (!destination) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-slate-600">{t('destinationDetail.notFound')}</p>
        <Link href="/destinations" className="mt-4 inline-block font-medium text-emerald-700 underline underline-offset-4">
          {t('destinationDetail.backToDestinations')}
        </Link>
      </main>
    );
  }

  const planHref = `/plan?toName=${encodeURIComponent(destination.name)}&toCountry=${encodeURIComponent(destination.country)}&toLat=${destination.latitude}&toLon=${destination.longitude}`;

  return (
    <main>
      <div className="relative h-[40vh] min-h-[280px] w-full overflow-hidden bg-slate-200">
        {summary?.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={summary.photoUrl} alt={destination.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <ImageOff className="h-10 w-10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute bottom-6 left-0 right-0 mx-auto max-w-5xl px-4">
          <p className="flex items-center gap-1.5 text-sm text-white/90">
            <MapPin className="h-3.5 w-3.5" />
            {destination.country}
          </p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">{destination.name}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            {summary === undefined && <p className="text-sm text-slate-400">{t('destinationDetail.loading')}</p>}
            {summary && <p className="leading-relaxed text-slate-700">{summary.extract}</p>}
            {summary?.wikipediaUrl && (
              <a
                href={summary.wikipediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-slate-400 underline underline-offset-4 hover:text-slate-600"
              >
                {t('destinationDetail.readMore')}
              </a>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={planHref}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                <Compass className="h-4 w-4" />
                {t('destinationDetail.planTrip')}
              </Link>
              <Link
                href={`/hotels?destinationName=${encodeURIComponent(destination.name)}&destinationCountry=${encodeURIComponent(destination.country)}&destinationLat=${destination.latitude}&destinationLon=${destination.longitude}`}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <Hotel className="h-4 w-4" />
                {t('destinationDetail.viewHotels')}
              </Link>
            </div>
          </div>

          <div>
            <WeatherWidget latitude={destination.latitude} longitude={destination.longitude} />
          </div>
        </div>

        <div className="mt-12">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">{t('destinationDetail.famousPlaces')}</h2>
          {attractions === undefined && <p className="text-sm text-slate-400">{t('destinationDetail.loading')}</p>}
          {attractions?.length === 0 && <p className="text-sm text-slate-500">{t('destinationDetail.noAttractions')}</p>}
          {attractions && attractions.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {attractions.map((place) => (
                <div key={place.name} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                    {place.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={place.photoUrl} alt={place.name} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <ImageOff className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-slate-900">{place.name}</p>
                    <p className="text-xs text-slate-500">
                      {t('destinationDetail.kmFromCenter', { distance: place.distanceFromCenterKm.toFixed(1) })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
