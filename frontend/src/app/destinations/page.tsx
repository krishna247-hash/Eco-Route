'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ImageOff, MapPin } from 'lucide-react';
import { CURATED_DESTINATIONS } from '@/lib/destinations.data';
import { getDestinationSummary, type DestinationSummary } from '@/lib/destinationApi';
import { useI18n } from '@/i18n/I18nProvider';

export default function DestinationsPage() {
  const { t } = useI18n();
  const [summaries, setSummaries] = useState<Record<string, DestinationSummary | null>>({});

  useEffect(() => {
    let cancelled = false;
    CURATED_DESTINATIONS.forEach((dest) => {
      getDestinationSummary(dest.name).then((summary) => {
        if (!cancelled) setSummaries((prev) => ({ ...prev, [dest.slug]: summary }));
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{t('destinations.title')}</h1>
        <p className="mt-2 text-slate-600">{t('destinations.subtitle')}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {CURATED_DESTINATIONS.map((dest) => {
          const summary = summaries[dest.slug];
          return (
            <Link
              key={dest.slug}
              href={`/destinations/${dest.slug}`}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                {summary?.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- external Wikimedia domain, not worth next/image's remote-pattern config
                  <img
                    src={summary.photoUrl}
                    alt={dest.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <ImageOff className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3" />
                  {dest.country}
                </p>
                <h3 className="mt-0.5 font-semibold text-slate-900">{dest.name}</h3>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
