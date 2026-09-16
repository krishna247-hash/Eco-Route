'use client';

import React from 'react';
import { ItineraryPlan } from '@/lib/types';
import { Leaf, Clock, DollarSign, Sparkles, Check } from 'lucide-react';

interface PlanComparisonCardProps {
  plans: {
    ecoChampion: ItineraryPlan;
    balanced: ItineraryPlan;
    fastest: ItineraryPlan;
  };
  selectedKey: 'ecoChampion' | 'balanced' | 'fastest';
  onSelect: (key: 'ecoChampion' | 'balanced' | 'fastest') => void;
}

export default function PlanComparisonCard({
  plans,
  selectedKey,
  onSelect,
}: PlanComparisonCardProps) {
  const cards: {
    key: 'ecoChampion' | 'balanced' | 'fastest';
    plan: ItineraryPlan;
    badge: string;
    icon: React.ReactNode;
    borderColor: string;
    bgColor: string;
  }[] = [
    {
      key: 'ecoChampion',
      plan: plans.ecoChampion,
      badge: 'Lowest Carbon',
      icon: <Leaf className="w-4 h-4 text-emerald-600" />,
      borderColor: 'border-emerald-500 ring-2 ring-emerald-500/20',
      bgColor: 'bg-emerald-50/30',
    },
    {
      key: 'balanced',
      plan: plans.balanced,
      badge: 'Recommended Pareto Knee',
      icon: <Sparkles className="w-4 h-4 text-teal-600" />,
      borderColor: 'border-teal-500 ring-2 ring-teal-500/30 shadow-md',
      bgColor: 'bg-teal-50/30',
    },
    {
      key: 'fastest',
      plan: plans.fastest,
      badge: 'Fastest Transit',
      icon: <Clock className="w-4 h-4 text-sky-600" />,
      borderColor: 'border-sky-500 ring-2 ring-sky-500/20',
      bgColor: 'bg-sky-50/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map(({ key, plan, badge, icon, borderColor, bgColor }) => {
        const isSelected = selectedKey === key;

        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`text-left p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
              isSelected
                ? `${borderColor} ${bgColor} shadow-md scale-[1.02]`
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            {/* Top Tag & Selection indicator */}
            <div className="w-full flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
                {icon}
                {badge}
              </span>

              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Title & Tagline */}
            <div>
              <h3 className="font-bold text-slate-900 text-base">{plan.title}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{plan.tagline}</p>
            </div>

            {/* Key Comparative Metrics */}
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400">Carbon</div>
                <div className="text-sm font-bold text-slate-900">{plan.totalCarbonKg} kg</div>
                <div className="text-[10px] text-emerald-600 font-medium">
                  -{plan.carbonSavedPercentage}%
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400">Est. Cost</div>
                <div className="text-sm font-bold text-slate-900">${plan.totalCost}</div>
                <div className="text-[10px] text-slate-500 font-medium">all incl.</div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400">Duration</div>
                <div className="text-sm font-bold text-slate-900">~{plan.totalDurationHours}h</div>
                <div className="text-[10px] text-slate-500 font-medium">transit</div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
