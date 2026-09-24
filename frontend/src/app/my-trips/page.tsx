'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Leaf, MapPin, Plane, Users } from 'lucide-react';
import { listMyTrips, type TripSummary } from '@/lib/api-client';
import { useCurrency } from '@/lib/CurrencyProvider';
import { useI18n } from '@/i18n/I18nProvider';

function formatDateRange(startDate: string, endDate: string, locale: string): string {
  const fmt = new Intl.DateTimeFormat(locale === 'hi' ? 'hi-IN' : 'en-US', { month: 'short', day: 'numeric' });
  return `${fmt.format(new Date(startDate))} – ${fmt.format(new Date(endDate))}`;
}

export default function MyTripsPage() {
  const { t, locale } = useI18n();
  const { formatInr } = useCurrency();
  const [trips, setTrips] = useState<TripSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listMyTrips()
      .then((result) => {
        if (!cancelled) setTrips(result);
      })
      .catch(() => {
        if (!cancelled) setError(t('myTrips.loadError'));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">{t('myTrips.title')}</h1>
        <p className="mt-1 text-sm text-slate-600">{t('myTrips.subtitle')}</p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>
      )}

      {trips === null && !error && <p className="text-sm text-slate-400">{t('myTrips.loading')}</p>}

      {trips !== null && trips.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Plane className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-500">{t('myTrips.empty')}</p>
          <Link
            href="/plan"
            className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {t('myTrips.planFirst')}
          </Link>
        </div>
      )}

      {trips !== null && trips.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {trips.map((trip) => (
            <Link
              key={trip.tripId}
              href={`/itinerary/${trip.tripId}`}
              className="card-hover rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-emerald-300"
            >
              <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                {trip.origin} <span className="text-slate-400">→</span> {trip.destinationName}
              </p>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="h-3 w-3" />
                {formatDateRange(trip.startDate, trip.endDate, locale)}
                <span className="mx-1">·</span>
                <Users className="h-3 w-3" />
                {trip.travelers}
              </p>
              {trip.recommended && (
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <Leaf className="h-3 w-3 text-emerald-600" />
                    {trip.recommended.totalCarbonKgCo2e.toFixed(0)} kg CO2e
                  </span>
                  <span>{formatInr(trip.recommended.totalCostUsd)}</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
