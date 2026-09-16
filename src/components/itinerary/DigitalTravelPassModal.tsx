'use client';

import React, { useState } from 'react';
import { ItineraryPlan, OptimizationResult } from '@/lib/types';
import {
  X,
  Printer,
  Download,
  Share2,
  CheckCircle2,
  Award,
  Trees,
  Leaf,
  Calendar,
  Users,
  MapPin,
  Clock,
  Sparkles,
  QrCode,
  ShieldCheck,
  Train,
  Plane,
  Building,
} from 'lucide-react';

interface DigitalTravelPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: ItineraryPlan;
  result: OptimizationResult;
}

export default function DigitalTravelPassModal({
  isOpen,
  onClose,
  plan,
  result,
}: DigitalTravelPassModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const primaryTransit = plan.allLegs[0]?.mode || 'train';
  const ecoRating = plan.explanation.ecoScore || 'A+';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 print:p-0 print:bg-white">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:max-w-full">
        {/* Action Header (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900">Verified EcoRoute Digital Pass</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-600" />}
              <span>{copied ? 'Link Copied!' : 'Share'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Boarding Pass Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Top Banner with Eco Certification */}
          <div className="rounded-2xl p-5 bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 text-white relative overflow-hidden shadow-lg">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/20 text-emerald-100 text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3 text-emerald-300" />
                  <span>ISO 14064 & DEFRA Verified</span>
                </div>
                <h2 className="text-2xl font-black tracking-tight mt-1">EcoRoute Travel Pass</h2>
                <p className="text-xs text-emerald-100/90 font-medium">
                  {plan.title} · Certified Low-Carbon Itinerary
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3.5 py-2 rounded-xl bg-white/15 backdrop-blur-md text-center border border-white/20">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-200 block font-semibold">
                    EcoScore
                  </span>
                  <span className="text-2xl font-black text-white">{ecoRating}</span>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-white/15 backdrop-blur-md text-center border border-white/20">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-200 block font-semibold">
                    CO₂ Abated
                  </span>
                  <span className="text-2xl font-black text-emerald-300">
                    -{plan.explanation.carbonSavingsKg}kg
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Route Overview Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Origin
              </span>
              <p className="text-base font-bold text-slate-900 mt-0.5">{result.origin.name}</p>
              <span className="text-xs text-slate-500 font-medium">{result.origin.country}</span>
            </div>

            <div className="flex flex-col items-center justify-center border-y sm:border-y-0 sm:border-x border-slate-200 py-3 sm:py-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mb-1">
                {primaryTransit.toUpperCase()} TRANSIT
              </span>
              <div className="w-full flex items-center justify-center gap-2 text-slate-400">
                <div className="h-0.5 w-12 bg-slate-300" />
                {primaryTransit === 'train' ? (
                  <Train className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Plane className="w-4 h-4 text-teal-600" />
                )}
                <div className="h-0.5 w-12 bg-slate-300" />
              </div>
              <span className="text-xs font-semibold text-slate-700 mt-1">
                {plan.totalDurationHours.toFixed(1)} hrs total transit
              </span>
            </div>

            <div className="sm:text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Destination
              </span>
              <p className="text-base font-bold text-slate-900 mt-0.5">{result.destination.name}</p>
              <span className="text-xs text-slate-500 font-medium">{result.destination.country}</span>
            </div>
          </div>

          {/* Passenger & Journey Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-white border border-slate-200">
              <span className="text-slate-400 font-medium block">Travelers</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                {result.travelers} Person(s)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200">
              <span className="text-slate-400 font-medium block">Duration</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {result.totalDays} Days Journey
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200">
              <span className="text-slate-400 font-medium block">Est. Cost</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5">
                ${plan.totalCost.toLocaleString()} USD
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200">
              <span className="text-slate-400 font-medium block">Tree Offset Value</span>
              <span className="font-bold text-emerald-700 text-sm mt-0.5 flex items-center gap-1">
                <Trees className="w-3.5 h-3.5 text-emerald-600" />
                {plan.explanation.treesEquivalent} Trees / yr
              </span>
            </div>
          </div>

          {/* Certified Hotel & Transit Voucher */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Eco-Certified Lodging
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                {plan.accommodation.ecoScore || 'Green Key Certified'}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
              <div>
                <p className="font-bold text-slate-900 text-sm">{plan.accommodation.name}</p>
                <p className="text-slate-500">{plan.accommodation.sustainabilityHighlights[0]}</p>
              </div>
              <div className="sm:text-right font-medium text-slate-700">
                ${plan.accommodation.pricePerNight}/night · {plan.accommodation.carbonKgPerNight} kg CO₂e/night
              </div>
            </div>
          </div>

          {/* Verification Footprint & QR Code Footer */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-dashed border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-slate-900 text-white rounded-xl flex items-center justify-center p-2 shadow-sm">
                <QrCode className="w-10 h-10" />
              </div>
              <div className="text-[11px] text-slate-500">
                <p className="font-bold text-slate-800 uppercase tracking-wider">
                  DIGITAL PASS ID: ER-{Math.random().toString(36).substring(2, 8).toUpperCase()}
                </p>
                <p>Scan to verify emissions balance & itinerary verification on EcoRoute chain.</p>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-400">
              <p>Generated by EcoRoute AI Platform</p>
              <p className="font-semibold text-slate-600">UN SDG 13: Climate Action Compliant</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
