'use client';

import React from 'react';
import { DayPlan, TripLeg, Accommodation, Activity } from '@/lib/types';
import {
  Train,
  Plane,
  Bus,
  Car,
  Hotel,
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
  DollarSign,
  Leaf,
} from 'lucide-react';

interface DayTimelineProps {
  days: DayPlan[];
  allLegs: TripLeg[];
  accommodation: Accommodation;
}

export default function DayTimeline({ days, allLegs, accommodation }: DayTimelineProps) {
  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'flight':
        return <Plane className="w-4 h-4 text-rose-600" />;
      case 'train':
        return <Train className="w-4 h-4 text-emerald-600" />;
      case 'bus':
        return <Bus className="w-4 h-4 text-amber-600" />;
      case 'ev':
        return <Car className="w-4 h-4 text-cyan-600" />;
      default:
        return <Car className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {days.map((day) => (
        <div
          key={`day-${day.dayNumber}`}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
        >
          {/* Day Header */}
          <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                D{day.dayNumber}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Day {day.dayNumber} — {day.city}
                </h4>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{day.date}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/50 flex items-center gap-1">
                <Leaf className="w-3 h-3" />
                {day.dailyCarbonKg} kg CO₂e
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
                ${day.dailyCost} est.
              </span>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Long-Distance Transit Legs for this day (if any) */}
            {day.legs.map((leg) => (
              <div
                key={leg.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-white shadow-xs border border-slate-200">
                    {getModeIcon(leg.mode)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        {leg.mode}
                      </span>
                      <span className="font-semibold text-sm text-slate-900">
                        {leg.fromName} → {leg.toName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{leg.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-slate-600 sm:text-right w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                  <div>
                    <div className="text-slate-400 text-[10px]">Distance</div>
                    <div>{leg.distanceKm} km</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Duration</div>
                    <div>~{leg.durationHours} hrs</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Emissions</div>
                    <div className="font-bold text-emerald-600">{leg.carbonKg} kg</div>
                  </div>
                </div>
              </div>
            ))}

            {/* Accommodation for this stay */}
            <div className="p-4 rounded-xl bg-teal-50/40 border border-teal-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-white shadow-xs border border-teal-200 text-teal-700">
                  <Hotel className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{accommodation.name}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                      ★ {accommodation.rating}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {accommodation.ecoCertifications.map((cert) => (
                      <span
                        key={cert}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-teal-800 border border-teal-200/80 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-2.5 h-2.5 text-teal-600" />
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-xs text-right text-slate-600 flex sm:flex-col justify-between w-full sm:w-auto">
                <span className="font-bold text-slate-900">${accommodation.pricePerNight} / night</span>
                <span className="text-emerald-700 font-medium">
                  {accommodation.carbonKgPerNight} kg CO₂e / night
                </span>
              </div>
            </div>

            {/* Daily Scheduled Activities */}
            <div className="space-y-2.5">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Scheduled Carbon-Aware Activities
              </h5>

              {day.activities.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Self-guided local exploration & rest.</p>
              ) : (
                day.activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors bg-white flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800">{act.name}</span>
                          <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {act.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{act.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {act.durationHours}h
                      </span>
                      <span className="font-semibold text-slate-700">
                        {act.cost > 0 ? `$${act.cost}` : 'Free'}
                      </span>
                      <span className="text-emerald-600 font-bold">
                        {act.carbonKg} kg CO₂
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
