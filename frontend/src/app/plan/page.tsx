'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PreferenceForm } from '@/components/planner/PreferenceForm';
import { planTrip } from '@/lib/api-client';
import { saveTripResult } from '@/lib/tripStore';
import type { PlanTripRequest } from '@/types';

export default function PlanPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(input: PlanTripRequest) {
    setSubmitting(true);
    setError(null);
    try {
      const response = await planTrip(input);
      saveTripResult(input, response);
      router.push(`/itinerary/${response.tripId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while planning your trip.');
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-semibold text-slate-900">Plan a trip</h1>
      <p className="mb-6 text-sm text-slate-600">
        We&apos;ll generate candidate itineraries and rank them by carbon, cost, time, and your preference.
      </p>
      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <PreferenceForm onSubmit={handleSubmit} submitting={submitting} />
    </main>
  );
}
