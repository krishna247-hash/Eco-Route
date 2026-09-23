'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ComparisonTable } from '@/components/itinerary/ComparisonTable';
import { loadTripResult } from '@/lib/tripStore';
import type { StoredTripResult } from '@/types';

export default function ComparePage() {
  const params = useParams<{ id: string }>();
  const [trip, setTrip] = useState<StoredTripResult | null | undefined>(undefined);

  useEffect(() => {
    setTrip(loadTripResult(params.id));
  }, [params.id]);

  if (trip === undefined) {
    return null;
  }

  if (trip === null) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-slate-600">
          We couldn&apos;t find this trip. Trip results are only kept for the current browser session.
        </p>
        <Link href="/plan" className="mt-4 inline-block text-emerald-700 underline">
          Plan a new trip
        </Link>
      </main>
    );
  }

  const { request, response } = trip;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">
          Compare options — {request.origin} → {request.destination.name}
        </h1>
        <Link
          href={`/itinerary/${response.tripId}`}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to recommended
        </Link>
      </div>
      <ComparisonTable options={response.itineraries} />
    </main>
  );
}
