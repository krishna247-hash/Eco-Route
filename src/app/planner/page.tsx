'use client';

import React, { useState, useEffect } from 'react';
import TripWizard from '@/components/planner/TripWizard';
import PlanComparisonCard from '@/components/itinerary/PlanComparisonCard';
import CarbonCharts from '@/components/dashboard/CarbonCharts';
import DayTimeline from '@/components/itinerary/DayTimeline';
import LeafletMap from '@/components/maps/LeafletMap';
import ExplainabilityCard from '@/components/xai/ExplainabilityCard';
import DigitalTravelPassModal from '@/components/itinerary/DigitalTravelPassModal';
import { OptimizationResult } from '@/lib/types';
import { Sparkles, Compass, MapPin, Share2, Printer, Download, Award, Ticket } from 'lucide-react';

export default function PlannerPage() {
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [selectedPlanKey, setSelectedPlanKey] = useState<'ecoChampion' | 'balanced' | 'fastest'>('balanced');
  const [loading, setLoading] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);

  // Generate initial demo itinerary on first mount
  useEffect(() => {
    handleGenerateTrip({
      origin: 'Paris',
      destination: 'Amsterdam',
      startDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 11).toISOString().split('T')[0],
      travelers: 1,
      budget: 1200,
      priority: 'balanced',
    });
  }, []);

  const handleGenerateTrip = async (params: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setResult(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = result ? result.plans[selectedPlanKey] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Multi-Objective Optimization Planner
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Plan Your Sustainable Journey
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Balance carbon emissions, financial budget, and travel time across the Pareto optimal frontier.
        </p>
      </div>

      {/* Input Parameters Wizard */}
      <div className="max-w-4xl mx-auto">
        <TripWizard onGenerate={handleGenerateTrip} isLoading={loading} />
      </div>

      {/* Results Section */}
      {result && currentPlan && (
        <div className="space-y-10 pt-6 border-t border-slate-200">
          {/* Section 1: Pareto Plan Selection */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Pareto-Optimal Candidate Plans
                </h2>
                <p className="text-xs text-slate-500">
                  Select a multi-objective trade-off curve solution for {result.origin.name} → {result.destination.name}
                </p>
              </div>
              <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 self-start sm:self-auto">
                {result.totalDays} Days Journey · {result.travelers} Traveler(s)
              </div>
            </div>

            <PlanComparisonCard
              plans={result.plans}
              selectedKey={selectedPlanKey}
              onSelect={(key) => setSelectedPlanKey(key)}
            />

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Selected: <strong className="text-slate-900">{currentPlan.title}</strong></span>
                <span className="text-slate-400">·</span>
                <span className="text-emerald-700 font-bold">EcoScore {currentPlan.explanation.ecoScore}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPassModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.02]"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Digital Travel Pass</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print Itinerary</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Dynamic Carbon Dashboard */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Dynamic Carbon Impact & Metrics
                </h2>
                <p className="text-xs text-slate-500">
                  Granular emissions analysis for "{currentPlan.title}"
                </p>
              </div>
            </div>

            <CarbonCharts
              currentPlan={currentPlan}
              ecoPlan={result.plans.ecoChampion}
              fastestPlan={result.plans.fastest}
            />
          </div>

          {/* Section 3: Explainable AI Rationale */}
          <ExplainabilityCard
            explanation={currentPlan.explanation}
            planTitle={currentPlan.title}
          />

          {/* Section 4: Interactive Route Map & Itinerary Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Map Column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Geospatial Route Map</h3>
                  <p className="text-xs text-slate-500">Origin, destination & scheduled attractions</p>
                </div>
              </div>

              <LeafletMap
                originCoords={result.origin.coords}
                originName={result.origin.name}
                destCoords={result.destination.coords}
                destName={result.destination.name}
                legs={currentPlan.allLegs}
                activities={currentPlan.days.flatMap((d) => d.activities)}
                mode={currentPlan.allLegs[0]?.mode || 'train'}
              />

              {/* Transit Summary Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Transit Legs Summary
                </h4>
                {currentPlan.allLegs.map((leg) => (
                  <div key={leg.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-b-0">
                    <span className="text-slate-600 font-medium">
                      {leg.fromName} ➔ {leg.toName} ({leg.mode.toUpperCase()})
                    </span>
                    <span className="font-bold text-emerald-600">{leg.carbonKg} kg CO₂</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Itinerary Timeline Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Day-by-Day Schedule</h3>
                  <p className="text-xs text-slate-500">Activities, lodging, and micro-transit</p>
                </div>
              </div>

              <DayTimeline
                days={currentPlan.days}
                allLegs={currentPlan.allLegs}
                accommodation={currentPlan.accommodation}
              />
            </div>
          </div>

          {/* Digital Travel Pass Modal */}
          <DigitalTravelPassModal
            isOpen={isPassModalOpen}
            onClose={() => setIsPassModalOpen(false)}
            plan={currentPlan}
            result={result}
          />
        </div>
      )}
    </div>
  );
}
