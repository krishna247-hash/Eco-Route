'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Leaf,
  Compass,
  BarChart3,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Trees,
  Train,
  Plane,
  Scale,
  Award,
  Globe2,
  CheckCircle2,
} from 'lucide-react';
import { calculateTransportEmissions, calculateTreesEquivalent } from '@/lib/carbon/calculator';

export default function HomePage() {
  // Quick Interactive Comparison Widget State
  const [calcDistance, setCalcDistance] = useState(500); // 500 km
  const flightCO2 = calculateTransportEmissions(calcDistance, 'flight', 1);
  const trainCO2 = calculateTransportEmissions(calcDistance, 'train', 1);
  const co2Saved = Math.max(0, Math.round((flightCO2 - trainCO2) * 10) / 10);
  const treesSaved = calculateTreesEquivalent(co2Saved);

  return (
    <div className="space-y-20 pb-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI-Driven Multi-Objective Carbon Optimization</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            Travel Freely.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">
              Emit Responsibly.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 font-normal leading-relaxed">
            EcoRoute generates personalized travel itineraries by simultaneously optimizing
            carbon footprint, travel cost, travel time, and comfort using Pareto-frontier
            mathematical modeling and Explainable AI.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/planner"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-base shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <Compass className="w-5 h-5" />
              <span>Launch Trip Planner</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-base shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <BarChart3 className="w-5 h-5 text-teal-600" />
              <span>Carbon Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Floating Quick Interactive Calculator */}
        <div className="mt-16 max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl shadow-slate-200/40 relative">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Live Carbon Abatement Calculator
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Compare Flight vs. Electrified High-Speed Rail
              </h3>
            </div>
            <div className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              DEFRA GHG Factors
            </div>
          </div>

          {/* Slider */}
          <div className="py-6 space-y-3">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Journey Distance:</span>
              <span className="text-emerald-700 font-bold text-sm">{calcDistance} km</span>
            </div>
            <input
              type="range"
              min={100}
              max={1500}
              step={25}
              value={calcDistance}
              onChange={(e) => setCalcDistance(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>100 km (Short inter-city)</span>
              <span>800 km (e.g. Paris - Nice)</span>
              <span>1500 km (Cross-continental)</span>
            </div>
          </div>

          {/* Outcome Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
              <div className="flex items-center justify-center gap-1.5 text-rose-600 mb-1">
                <Plane className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Flight</span>
              </div>
              <div className="text-2xl font-black text-rose-900">{flightCO2} kg</div>
              <div className="text-[11px] text-rose-600 font-medium mt-1">High altitude radiative forcing</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
              <div className="flex items-center justify-center gap-1.5 text-emerald-600 mb-1">
                <Train className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Electric Rail</span>
              </div>
              <div className="text-2xl font-black text-emerald-900">{trainCO2} kg</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">Grid-electrified transit</div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-600 text-white shadow-md">
              <div className="flex items-center justify-center gap-1.5 text-teal-100 mb-1">
                <Trees className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Net Abated</span>
              </div>
              <div className="text-2xl font-black">{co2Saved} kg</div>
              <div className="text-[11px] text-emerald-100 font-medium mt-1">
                Equal to ~{treesSaved} trees planted for a full year
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Pillars / Research Contributions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Algorithmic Innovations
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900">
            The EcoRoute Framework
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            How EcoRoute solves the trade-off dilemma between rapid travel and environmental impact.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-4 hover:border-emerald-300 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Multi-Objective Optimization
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Solves the Pareto optimal curve simultaneously across 4 dimensions: Carbon Footprint (kg CO₂), Travel Cost ($), Travel Duration (hrs), and User Comfort.
            </p>
            <ul className="text-xs text-slate-500 space-y-1.5 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pareto Non-Dominated Sorting</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Euclidean Knee-Point Selection</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-4 hover:border-teal-300 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Explainable AI (XAI)
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              No black boxes. Every recommendation is accompanied by natural-language justifications, quantified carbon savings deltas, and actionable eco-behavioral nudges.
            </p>
            <ul className="text-xs text-slate-500 space-y-1.5 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                <span>Quantified Carbon & Time Deltas</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                <span>Behavioral Nudges & Certified Lodging</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-4 hover:border-cyan-300 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Standardized Carbon Accounting
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Implements DEFRA 2023 and ICAO Greenhouse Gas Protocol guidelines for transit emissions, hotel energy ratings, and atmospheric radiative forcing factors.
            </p>
            <ul className="text-xs text-slate-500 space-y-1.5 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
                <span>DEFRA / ICAO GHG Protocol</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
                <span>Tree Sequestration Equivalents</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-bold">Ready to Experience EcoRoute?</h3>
            <p className="text-sm sm:text-base text-emerald-100 max-w-xl">
              Generate an intelligent, carbon-aware travel itinerary in seconds.
            </p>
          </div>
          <Link
            href="/planner"
            className="px-8 py-4 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-950 font-bold text-base shadow-md transition-all flex items-center gap-2 hover:scale-105 shrink-0"
          >
            <span>Start Planning Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
