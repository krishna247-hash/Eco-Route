'use client';

import { CalendarDays } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import type { ItineraryOption } from '@/types';

interface ItineraryTimelineProps {
  option: ItineraryOption;
  origin: string;
  destinationName: string;
  nights: number;
}

/**
 * The ai-service pipeline only returns aggregate figures per option (no
 * per-day activity schedule), so this renders a day-by-day outline built
 * from the real fields we do have (transport mode, accommodation tier,
 * trip length) rather than inventing daily activities.
 */
export function ItineraryTimeline({ option, origin, destinationName, nights }: ItineraryTimelineProps) {
  const { t } = useI18n();
  const mode = t(`planForm.transportOptions.${option.transportMode}`);
  const tier = t(`planForm.accommodationOptions.${option.accommodationTier}`);

  const days = [
    { day: 1, description: t('itineraryTimeline.depart', { origin, destination: destinationName, mode }) },
    ...Array.from({ length: Math.max(nights - 1, 0) }, (_, i) => ({
      day: i + 2,
      description: t('itineraryTimeline.stay', { destination: destinationName, tier }),
    })),
    { day: nights + 1, description: t('itineraryTimeline.return', { origin, mode }) },
  ];

  return (
    <div className="card-hover glass-card h-full rounded-xl p-5">
      <h2 className="mb-4 flex items-center gap-1.5 text-lg font-semibold text-slate-900">
        <CalendarDays className="h-4 w-4 text-emerald-600" />
        {t('itineraryTimeline.heading')}
      </h2>
      <ol className="space-y-3">
        {days.map((d, i) => (
          <li
            key={d.day}
            className="flex animate-fade-up gap-3 text-sm"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-xs font-semibold text-white shadow-sm">
              {d.day}
            </span>
            <span className="pt-0.5 text-slate-700">{d.description}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
