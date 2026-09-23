'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ItineraryTimeline } from '@/components/itinerary/ItineraryTimeline';
import { CarbonDashboard } from '@/components/dashboard/CarbonDashboard';
import { loadTripResult } from '@/lib/tripStore';
import type { StoredTripResult } from '@/types';

function nightsBetween(startDate: string, endDate: string): number {
  const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.max(Math.round(ms / (1000 * 60 * 60 * 24)), 1);
}

export default function ItineraryPage() {
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
  const recommended =
    response.itineraries.find((option) => option.label === 'BALANCED') ?? response.itineraries[0];
  const nights = nightsBetween(request.startDate, request.endDate);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {request.origin} → {request.destination.name}
          </h1>
          <p className="text-sm text-slate-500">
            Recommended option: <span className="font-medium text-emerald-700">{recommended.label}</span>
          </p>
        </div>
        <Link
          href={`/compare/${response.tripId}`}
          className="rounded-lg border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
        >
          Compare all options
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4 text-center">
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-xs uppercase text-slate-500">Total carbon</p>
          <p className="text-xl font-semibold text-slate-900">{recommended.carbon.total_co2e.toFixed(1)} kg</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-xs uppercase text-slate-500">Total cost</p>
          <p className="text-xl font-semibold text-slate-900">${recommended.costUsd.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-xs uppercase text-slate-500">Duration</p>
          <p className="text-xl font-semibold text-slate-900">{recommended.durationHrs.toFixed(1)} h</p>
        </div>
      </div>

      <p className="mb-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900">{recommended.explanation}</p>

      <div className="grid gap-6 md:grid-cols-2">
        <ItineraryTimeline
          option={recommended}
          origin={request.origin}
          destinationName={request.destination.name}
          nights={nights}
        />
        <CarbonDashboard carbon={recommended.carbon} />
      </div>
    </main>
  );
}
