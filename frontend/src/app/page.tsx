import Link from 'next/link';
import { Leaf, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-md shadow-emerald-500/20">
        <Leaf className="h-7 w-7" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight text-slate-900">
        Plan trips that weigh carbon as much as cost
      </h1>
      <p className="mt-4 max-w-xl text-slate-600">
        EcoRoute generates candidate itineraries, ranks them across carbon,
        cost, time and your preferences using NSGA-II Pareto optimization,
        and explains each recommendation in plain language.
      </p>
      <Link
        href="/plan"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition-all hover:from-emerald-700 hover:to-teal-700 hover:shadow-md"
      >
        Plan a trip
        <ArrowRight className="h-4 w-4" />
      </Link>
    </main>
  );
}
