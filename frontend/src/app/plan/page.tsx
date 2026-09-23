'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PreferenceForm } from '@/components/planner/PreferenceForm';
import { planTrip } from '@/lib/api-client';
import { saveTripResult } from '@/lib/tripStore';
import type { PlanTripRequest } from '@/types';
import { Compass, AlertCircle } from 'lucide-react';

function PlanPageInner() {
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
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 animate-fade-up text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-md shadow-emerald-500/20">
          <Compass className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">Plan a trip</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          We&apos;ll generate candidate itineraries and rank them by carbon, cost, time, and your preference.
        </p>
      </div>

      {error && (
        <p className="mb-4 flex animate-fade-in items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
          {error}
        </p>
      )}

      <div className="glass-card animate-scale-in rounded-2xl p-6 shadow-sm sm:p-8 [animation-delay:100ms]">
        <PreferenceForm onSubmit={handleSubmit} submitting={submitting} />
      </div>
    </main>
  );
}

export default function PlanPage() {
  return (
    <Suspense fallback={null}>
      <PlanPageInner />
    </Suspense>
  );
}
