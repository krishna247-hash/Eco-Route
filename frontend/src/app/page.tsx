import Link from 'next/link';
import { Leaf, ArrowRight, Gauge, Sparkles, TrendingDown } from 'lucide-react';

const FEATURES = [
  {
    icon: Gauge,
    title: 'Multi-objective optimization',
    description: 'NSGA-II Pareto ranking balances carbon, cost, time, and your preference in one pass.',
  },
  {
    icon: TrendingDown,
    title: 'Real emission factors',
    description: 'DEFRA 2023 and ICAO-sourced figures, not guesses — every number is traceable.',
  },
  {
    icon: Sparkles,
    title: 'Plain-language explanations',
    description: 'An LLM turns the computed numbers into a 2-3 sentence rationale for each option.',
  },
];

export default function LandingPage() {
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
          NSGA-II · DEFRA 2023 · Gemini-explained
        </span>

        <h1 className="animate-fade-up text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl [animation-delay:100ms]">
          Plan trips that weigh{' '}
          <span className="text-gradient">carbon</span> as much as cost
        </h1>

        <p className="mt-5 max-w-xl animate-fade-up text-balance text-slate-600 [animation-delay:200ms]">
          EcoRoute generates candidate itineraries, ranks them across carbon, cost,
          time and your preferences using multi-objective optimization, and explains
          each recommendation in plain language.
        </p>

        <div className="mt-8 animate-fade-up [animation-delay:300ms]">
          <Link
            href="/plan"
            className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-600/30"
          >
            Plan a trip
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <section className="relative mx-auto grid max-w-5xl gap-6 px-4 pb-24 sm:grid-cols-3">
        {FEATURES.map((feature, i) => (
          <div
            key={feature.title}
            className="glass-card card-hover animate-fade-up rounded-2xl p-6"
            style={{ animationDelay: `${400 + i * 120}ms` }}
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <feature.icon className="h-5 w-5" />
            </div>
            <h3 className="mb-1.5 font-semibold text-slate-900">{feature.title}</h3>
            <p className="text-sm leading-relaxed text-slate-600">{feature.description}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
