'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ComparisonTable } from '@/components/itinerary/ComparisonTable';
import { loadTripResult } from '@/lib/tripStore';
import { getStoredTrip } from '@/lib/api-client';
import { useI18n } from '@/i18n/I18nProvider';
import type { StoredTripResult } from '@/types';

export default function ComparePage() {
  const params = useParams<{ id: string }>();
  const { t } = useI18n();
  const [trip, setTrip] = useState<StoredTripResult | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const fromSession = loadTripResult(params.id);
    if (fromSession) {
      setTrip(fromSession);
      return;
    }
    // Same backend fallback as the itinerary page: a trip opened from "My
    // Trips", a different tab, or after a reload won't be in this
    // session's storage even though it genuinely exists.
    getStoredTrip(params.id)
      .then((result) => {
        if (!cancelled) setTrip(result);
      })
      .catch(() => {
        if (!cancelled) setTrip(null);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (trip === undefined) {
    return null;
  }

  if (trip === null) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-slate-600">{t('itinerary.notFoundMessage')}</p>
        <Link href="/plan" className="mt-4 inline-block font-medium text-emerald-700 underline underline-offset-4">
          {t('itinerary.planNewTrip')}
        </Link>
      </main>
    );
  }

  const { request, response } = trip;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{t('compare.label')}</p>
          <h1 className="text-2xl font-semibold text-slate-900">
            {request.origin} <span className="text-slate-400">→</span> {request.destination.name}
          </h1>
        </div>
        <Link
          href={`/itinerary/${response.tripId}`}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t('compare.backToRecommended')}
        </Link>
      </div>

      <ComparisonTable options={response.itineraries} />
    </main>
  );
}
