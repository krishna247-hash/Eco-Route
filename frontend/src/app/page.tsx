'use client';

import Link from 'next/link';
import { Leaf, ArrowRight, Gauge, Sparkles, TrendingDown } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';

const FEATURE_ICONS = [Gauge, TrendingDown, Sparkles];

interface Feature {
  title: string;
  description: string;
}

export default function LandingPage() {
  const { t, tRaw } = useI18n();
  const features = tRaw<Feature[]>('home.features');

  return (
    <main className="relative overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div
        className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 animate-blob rounded-full bg-eco-300/40 blur-3xl"
        style={{ animationDelay: '0s' }}
      />
      <div
        className="pointer-events-none absolute top-10 right-1/4 h-72 w-72 animate-blob rounded-full bg-teal-300/30 blur-3xl"
        style={{ animationDelay: '2s' }}
      />

      <section className="relative mx-auto flex max-w-3xl flex-col items-center px-4 pb-20 pt-24 text-center">
        <div className="mb-6 flex h-16 w-16 animate-float items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-500/25">
          <Leaf className="h-8 w-8" />
        </div>

        <span className="mb-4 inline-flex animate-fade-in items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
          <Sparkles className="h-3 w-3" />
          {t('home.badge')}
        </span>

        <h1 className="animate-fade-up text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl [animation-delay:100ms]">
          {t('home.headingBefore')}
          <span className="text-gradient">{t('home.headingHighlight')}</span>
          {t('home.headingAfter')}
        </h1>

        <p className="mt-5 max-w-xl animate-fade-up text-balance text-slate-600 [animation-delay:200ms]">
          {t('home.subheading')}
        </p>

        <div className="mt-8 animate-fade-up [animation-delay:300ms]">
          <Link
            href="/plan"
            className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-600/30"
          >
            {t('home.cta')}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <section className="relative mx-auto grid max-w-5xl gap-6 px-4 pb-24 sm:grid-cols-3">
        {features.map((feature, i) => {
          const Icon = FEATURE_ICONS[i] ?? Sparkles;
          return (
            <div
              key={feature.title}
              className="glass-card card-hover animate-fade-up rounded-2xl p-6"
              style={{ animationDelay: `${400 + i * 120}ms` }}
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1.5 font-semibold text-slate-900">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{feature.description}</p>
            </div>
          );
        })}
      </section>
    </main>
  );
}
