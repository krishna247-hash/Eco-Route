'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { ItineraryPlan } from '@/lib/types';
import { Leaf, Trees, Award, DollarSign, Clock, ShieldCheck } from 'lucide-react';

interface CarbonChartsProps {
  currentPlan: ItineraryPlan;
  ecoPlan?: ItineraryPlan;
  fastestPlan?: ItineraryPlan;
}

const PIE_COLORS = ['#10b981', '#06b6d4', '#8b5cf6'];

export default function CarbonCharts({
  currentPlan,
  ecoPlan,
  fastestPlan,
}: CarbonChartsProps) {
  // Compute breakdown
  const transportCarbon = currentPlan.allLegs.reduce((s, l) => s + l.carbonKg, 0);
  const totalDays = currentPlan.days.length;
  const hotelCarbon = currentPlan.accommodation.carbonKgPerNight * totalDays;
  const activitiesCarbon = Math.max(
    0.5,
    Math.round((currentPlan.totalCarbonKg - transportCarbon - hotelCarbon) * 10) / 10
  );

  const breakdownData = [
    { name: 'Transport', value: Math.max(0.1, transportCarbon) },
    { name: 'Accommodation', value: Math.max(0.1, hotelCarbon) },
    { name: 'Activities', value: Math.max(0.1, activitiesCarbon) },
  ];

  const baselineCarbon = currentPlan.explanation.baselineComparison.baselineCarbonKg;

  const comparisonData = [
    {
      name: 'Baseline (Air+Std)',
      carbon: baselineCarbon,
      fill: '#ef4444',
    },
    {
      name: fastestPlan?.title || 'Speed-Priority',
      carbon: fastestPlan?.totalCarbonKg || baselineCarbon * 0.9,
      fill: '#f59e0b',
    },
    {
      name: currentPlan.title,
      carbon: currentPlan.totalCarbonKg,
      fill: '#06b6d4',
    },
    {
      name: ecoPlan?.title || 'Eco-Champion',
      carbon: ecoPlan?.totalCarbonKg || currentPlan.totalCarbonKg * 0.7,
      fill: '#10b981',
    },
  ];

  const getScoreBadgeColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-500 text-white';
    if (score >= 70) return 'bg-teal-500 text-white';
    if (score >= 50) return 'bg-amber-500 text-white';
    return 'bg-rose-500 text-white';
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Footprint
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {currentPlan.totalCarbonKg}
            </span>
            <span className="text-xs font-medium text-slate-500">kg CO₂e</span>
          </div>
          <div className="mt-1 text-xs text-emerald-600 font-medium">
            ↓ {currentPlan.carbonSavedPercentage}% vs conventional baseline
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Carbon Abated
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold text-teal-700">
              {currentPlan.carbonSavedKg}
            </span>
            <span className="text-xs font-medium text-slate-500">kg saved</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Equivalent to avoiding ~{Math.round(currentPlan.carbonSavedKg * 4.2)} km in a petrol car
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tree Sequestration
            </span>
            <div className="w-8 h-8 rounded-lg bg-lime-50 text-lime-700 flex items-center justify-center">
              <Trees className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold text-lime-800">
              {currentPlan.treesEquivalent}
            </span>
            <span className="text-xs font-medium text-slate-500">Trees / Year</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Mature trees required to absorb this savings
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Eco Score
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {currentPlan.sustainabilityScore}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ 100</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${getScoreBadgeColor(currentPlan.sustainabilityScore)}`}>
              {currentPlan.sustainabilityScore >= 80 ? 'Grade A+' : currentPlan.sustainabilityScore >= 65 ? 'Grade A' : 'Grade B'}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Multi-objective sustainability index
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bar Chart: Carbon Comparison */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Carbon Footprint Comparison</h3>
                <p className="text-xs text-slate-500">Benchmarked against unoptimized travel</p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                kg CO₂e
              </span>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: any) => [`${value} kg CO₂e`, 'Emissions']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="carbon" radius={[6, 6, 0, 0]}>
                    {comparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 text-center mt-2">
            Calculated via DEFRA 2023 & ICAO standardized flight altitude factor.
          </p>
        </div>

        {/* Pie Chart: Emissions Breakdown */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 text-base">Footprint Breakdown</h3>
              <span className="text-xs font-medium px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                Categorical
              </span>
            </div>
            <div className="h-[230px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {breakdownData.map((entry, index) => (
                      <Cell key={`slice-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${value} kg CO₂e`, 'Footprint']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Transport: {transportCarbon} kg</span>
            <span>Lodging: {hotelCarbon} kg</span>
            <span>Acts: {activitiesCarbon} kg</span>
          </div>
        </div>
      </div>
    </div>
  );
}
