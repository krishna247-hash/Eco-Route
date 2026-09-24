'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeftRight, Leaf, DollarSign, Clock3, Sparkles, Car, TrainFront, Bus, Plane, Hotel } from 'lucide-react';
import { ItineraryTimeline } from '@/components/itinerary/ItineraryTimeline';
import { CarbonDashboard } from '@/components/dashboard/CarbonDashboard';
import { HotelList } from '@/components/hotels/HotelList';
import { loadTripResult } from '@/lib/tripStore';
import { useI18n } from '@/i18n/I18nProvider';
import type { AccommodationTier } from '@/lib/hotelApi';
import type { StoredTripResult } from '@/types';

function nightsBetween(startDate: string, endDate: string): number {
  const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.max(Math.round(ms / (1000 * 60 * 60 * 24)), 1);
}

const TRANSPORT_ICON: Record<string, typeof Car> = {
  car: Car,
  train: TrainFront,
  bus: Bus,
  flight: Plane,
};

export default function ItineraryPage() {
  const params = useParams<{ id: string }>();
  const { t } = useI18n();
  const [trip, setTrip] = useState<StoredTripResult | null | undefined>(undefined);

  useEffect(() => {
    setTrip(loadTripResult(params.id));
  }, [params.id]);

  if (trip === undefined) {
    return null;
  }

  if (trip === null) {
    return (
      <main className="mx-auto max-w-2xl animate-fade-in px-4 py-16 text-center">
        <p className="text-slate-600">{t('itinerary.notFoundMessage')}</p>
        <Link href="/plan" className="mt-4 inline-block font-medium text-emerald-700 underline underline-offset-4">
          {t('itinerary.planNewTrip')}
        </Link>
      </main>
    );
  }

  const { request, response } = trip;
  const recommended =
    response.itineraries.find((option) => option.label === 'BALANCED') ?? response.itineraries[0];
  const nights = nightsBetween(request.startDate, request.endDate);
  const TransportIcon = TRANSPORT_ICON[recommended.transportMode] ?? Car;

  const STAT_CARDS = [
    { key: 'carbon' as const, label: t('itinerary.totalCarbon'), icon: Leaf, accent: 'text-emerald-600' },
    { key: 'cost' as const, label: t('itinerary.totalCost'), icon: DollarSign, accent: 'text-teal-600' },
    { key: 'duration' as const, label: t('itinerary.duration'), icon: Clock3, accent: 'text-sky-600' },
  ];

  const statValues: Record<(typeof STAT_CARDS)[number]['key'], string> = {
    carbon: `${recommended.carbon.total_co2e.toFixed(1)} kg`,
    cost: `$${recommended.costUsd.toFixed(2)}`,
    duration: `${recommended.durationHrs.toFixed(1)} h`,
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex animate-fade-up items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {request.origin} <span className="text-slate-400">→</span> {request.destination.name}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            {t('itinerary.recommended')}{' '}
            <span className="font-medium text-emerald-700">{t(`labels.${recommended.label}`)}</span>
          </p>
        </div>
        <Link
          href={`/compare/${response.tripId}`}
          className="flex items-center gap-1.5 rounded-lg border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          {t('itinerary.compareAll')}
        </Link>
      </div>

      <div className="mb-4 flex animate-fade-up flex-wrap gap-2 [animation-delay:60ms]">
        <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm">
          <TransportIcon className="h-3.5 w-3.5 text-emerald-600" />
          {t(`planForm.transportOptions.${recommended.transportMode}`)}
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm">
          <Hotel className="h-3.5 w-3.5 text-emerald-600" />
          {t('itinerary.accommodationSuffix', { tier: t(`planForm.accommodationOptions.${recommended.accommodationTier}`) })}
        </span>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        {STAT_CARDS.map((stat, i) => (
          <div
            key={stat.key}
            className="card-hover glass-card animate-scale-in rounded-xl p-4 text-center"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <stat.icon className={`mx-auto mb-1.5 h-4 w-4 ${stat.accent}`} />
            <p className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</p>
            <p className="text-xl font-semibold text-slate-900">{statValues[stat.key]}</p>
          </div>
        ))}
      </div>

      <p className="mb-6 animate-fade-up rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 text-sm leading-relaxed text-emerald-900 [animation-delay:150ms]">
        {recommended.explanation}
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="animate-fade-up [animation-delay:200ms]">
          <ItineraryTimeline
            option={recommended}
            origin={request.origin}
            destinationName={request.destination.name}
            nights={nights}
          />
        </div>
        <div className="animate-fade-up [animation-delay:280ms]">
          <CarbonDashboard carbon={recommended.carbon} />
        </div>
      </div>

      <div className="mt-8 animate-fade-up [animation-delay:340ms]">
        <h2 className="mb-3 flex items-center gap-1.5 text-lg font-semibold text-slate-900">
          <Hotel className="h-4 w-4 text-emerald-600" />
          {t('itinerary.hotelsNear', { destination: request.destination.name })}
        </h2>
        <HotelList
          tripId={response.tripId}
          destinationName={request.destination.name}
          destinationCountry={request.destination.country}
          checkIn={request.startDate}
          checkOut={request.endDate}
          guests={request.travelers}
          tier={recommended.accommodationTier as AccommodationTier}
        />
      </div>
    </main>
  );
}
