'use client';

import React from 'react';
import { PlanExplanation } from '@/lib/types';
import { Sparkles, HelpCircle, CheckCircle, ArrowRight, Lightbulb, Scale } from 'lucide-react';

interface ExplainabilityCardProps {
  explanation: PlanExplanation;
  planTitle: string;
}

export default function ExplainabilityCard({
  explanation,
  planTitle,
}: ExplainabilityCardProps) {
  const { baselineComparison } = explanation;

  return (
    <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-500/20 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">Explainable AI (XAI) Recommendation Rationale</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                Transparent AI
              </span>
            </div>
            <p className="text-xs text-slate-300">Why this itinerary was optimized for {planTitle}</p>
          </div>
        </div>

        {/* Quantified Delta pill */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-300">
          <Scale className="w-3.5 h-3.5" />
          <span>-{baselineComparison.savingsPercentage}% Carbon Abatement</span>
        </div>
      </div>

      {/* AI Summary Statement */}
      <div className="relative z-10 mt-6 bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
        <p className="text-sm sm:text-base leading-relaxed text-emerald-50 font-medium">
          "{explanation.summary}"
        </p>
      </div>

      {/* 2-Column Trade-offs & Highlights */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Objective Trade-offs */}
        <div className="bg-slate-900/50 rounded-2xl p-5 border border-white/5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-300">
            <Scale className="w-4 h-4" />
            <span>Multi-Objective Trade-Off Analysis</span>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-300">
            {explanation.keyTradeoffs.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Eco Highlights */}
        <div className="bg-slate-900/50 rounded-2xl p-5 border border-white/5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
            <CheckCircle className="w-4 h-4" />
            <span>Sustainability Factors & Verification</span>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-300">
            {explanation.ecoHighlights.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <CheckCircle className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actionable Eco-Tips */}
      {explanation.actionableTips.length > 0 && (
        <div className="relative z-10 mt-6 pt-5 border-t border-white/10 flex items-start gap-3 text-xs text-slate-300">
          <Lightbulb className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-white">Traveler Nudge: </span>
            <span>{explanation.actionableTips.join(' ')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
