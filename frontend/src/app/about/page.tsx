'use client';

import Link from 'next/link';
import { Compass, Gauge, Leaf, MessageCircle, Sparkles, TrendingDown } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';

export default function AboutPage() {
  const { t } = useI18n();

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
          <Leaf className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{t('about.title')}</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">{t('about.intro')}</p>
      </div>

      <div className="mb-14 grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <Compass className="mb-3 h-5 w-5 text-emerald-600" />
          <h3 className="mb-1.5 font-semibold text-slate-900">{t('about.plan.title')}</h3>
          <p className="text-sm leading-relaxed text-slate-600">{t('about.plan.description')}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <TrendingDown className="mb-3 h-5 w-5 text-emerald-600" />
          <h3 className="mb-1.5 font-semibold text-slate-900">{t('about.footprint.title')}</h3>
          <p className="text-sm leading-relaxed text-slate-600">{t('about.footprint.description')}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <MessageCircle className="mb-3 h-5 w-5 text-emerald-600" />
          <h3 className="mb-1.5 font-semibold text-slate-900">{t('about.assistant.title')}</h3>
          <p className="text-sm leading-relaxed text-slate-600">{t('about.assistant.description')}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <Sparkles className="mb-3 h-5 w-5 text-emerald-600" />
          <h3 className="mb-1.5 font-semibold text-slate-900">{t('about.honest.title')}</h3>
          <p className="text-sm leading-relaxed text-slate-600">{t('about.honest.description')}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
        <h2 className="mb-1.5 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Gauge className="h-4.5 w-4.5 text-slate-500" />
          {t('about.methodology.title')}
        </h2>
        <p className="mb-5 text-sm text-slate-600">{t('about.methodology.intro')}</p>
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="font-medium text-slate-800">{t('about.methodology.optimization.term')}</dt>
            <dd className="mt-0.5 text-slate-600">{t('about.methodology.optimization.definition')}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-800">{t('about.methodology.emissions.term')}</dt>
            <dd className="mt-0.5 text-slate-600">{t('about.methodology.emissions.definition')}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-800">{t('about.methodology.explanations.term')}</dt>
            <dd className="mt-0.5 text-slate-600">{t('about.methodology.explanations.definition')}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/plan"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          {t('about.cta')}
        </Link>
      </div>
    </main>
  );
}
