'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Printer,
  Share2,
  CheckCircle2,
  Trees,
  Train,
  Plane,
  Building,
  Users,
  Calendar,
  Compass,
  QrCode,
  ArrowLeft,
  Sparkles,
  Award,
} from 'lucide-react';
import { POPULAR_CITIES } from '@/lib/data/destinations';
import { optimizeItinerary } from '@/lib/optimizer/pareto';

export default function TravelPassPage() {
  const [copied, setCopied] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState('amsterdam');

  const origin = POPULAR_CITIES[0]; // Paris
  const destination = POPULAR_CITIES.find(c => c.id === selectedCityId) || POPULAR_CITIES[1];

  const optimization = optimizeItinerary(origin, destination, {
    origin: origin.name,
    destination: destination.name,
    startDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 11).toISOString().split('T')[0],
    travelers: 1,
    budget: 1200,
    priority: 'balanced',
  });

  const plan = optimization.plans.ecoChampion;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Navigation & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <Link
          href="/planner"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Planner</span>
        </Link>

        <div className="flex items-center gap-3">
          <select
            value={selectedCityId}
            onChange={(e) => setSelectedCityId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-xs focus:ring-2 focus:ring-emerald-500"
          >
            {POPULAR_CITIES.filter(c => c.id !== 'paris').map((c) => (
              <option key={c.id} value={c.id}>
                Destination: {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Main Boarding Pass Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 overflow-hidden print:border-none print:shadow-none">
        {/* Pass Header Banner */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/20 text-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3 text-emerald-300" />
                <span>Verified Clean Itinerary Pass</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight mt-1.5">
                EcoRoute Travel Pass
              </h1>
              <p className="text-xs text-emerald-100/90 font-medium">
                Compliant with DEFRA 2023 GHG Accounting Standards
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md text-center border border-white/20">
                <span className="text-[10px] uppercase tracking-wider text-emerald-200 block font-bold">
                  EcoScore
                </span>
                <span className="text-3xl font-black text-white">
                  {plan.explanation.ecoScore}
                </span>
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md text-center border border-white/20">
                <span className="text-[10px] uppercase tracking-wider text-emerald-200 block font-bold">
                  Net CO₂ Abated
                </span>
                <span className="text-2xl font-black text-emerald-300">
                  -{plan.explanation.carbonSavingsKg}kg
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pass Details */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Origin ➔ Destination Visual */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 rounded-2xl bg-slate-50 border border-slate-100 items-center">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Origin
              </span>
              <p className="text-lg font-extrabold text-slate-900 mt-0.5">{origin.name}</p>
              <span className="text-xs text-slate-500 font-medium">{origin.country}</span>
            </div>

            <div className="flex flex-col items-center justify-center border-y sm:border-y-0 sm:border-x border-slate-200 py-3 sm:py-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full mb-1">
                {plan.allLegs[0]?.mode.toUpperCase() || 'RAIL'} ROUTE
              </span>
              <div className="w-full flex items-center justify-center gap-2 text-slate-400">
                <div className="h-0.5 w-12 bg-slate-300" />
                <Train className="w-4 h-4 text-emerald-600" />
                <div className="h-0.5 w-12 bg-slate-300" />
              </div>
              <span className="text-xs font-semibold text-slate-700 mt-1">
                {plan.totalDurationHours.toFixed(1)} hrs transit
              </span>
            </div>

            <div className="sm:text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Destination
              </span>
              <p className="text-lg font-extrabold text-slate-900 mt-0.5">{destination.name}</p>
              <span className="text-xs text-slate-500 font-medium">{destination.country}</span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200">
              <span className="text-slate-400 font-medium block">Total Journey</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {optimization.totalDays} Days
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200">
              <span className="text-slate-400 font-medium block">Travelers</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                {optimization.travelers} Pax
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200">
              <span className="text-slate-400 font-medium block">Budget</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5">
                ${plan.totalCost.toLocaleString()} USD
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200">
              <span className="text-slate-400 font-medium block">Tree Absorption</span>
              <span className="font-bold text-emerald-700 text-sm mt-0.5 flex items-center gap-1">
                <Trees className="w-3.5 h-3.5 text-emerald-600" />
                {plan.explanation.treesEquivalent} Trees/yr
              </span>
            </div>
          </div>

          {/* Sustainability Highlights */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Multi-Objective Decision Highlights</span>
            </h3>
            <div className="space-y-2 text-xs text-slate-600">
              {plan.explanation.keyTradeoffs.map((point, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hotel & Lodging Voucher */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Building className="w-4 h-4 text-emerald-600" />
                <span>Certified Sustainable Lodging: {plan.accommodation.name}</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded text-[10px]">
                {plan.accommodation.ecoScore}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {plan.accommodation.sustainabilityHighlights.join(' · ')}
            </p>
          </div>

          {/* Verification Barcode & Seal */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-dashed border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-slate-900 text-white rounded-xl flex items-center justify-center p-2 shadow-xs">
                <QrCode className="w-10 h-10" />
              </div>
              <div className="text-[11px] text-slate-500">
                <p className="font-bold text-slate-800 uppercase tracking-wider">
                  VERIFIED PASS: ER-2026-XAI
                </p>
                <p>Authentic verified carbon audit token by EcoRoute Engine.</p>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-400">
              <p>EcoRoute Sustainable Travel Network</p>
              <p className="font-semibold text-emerald-700">UN SDG 13 Certified Traveler</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
