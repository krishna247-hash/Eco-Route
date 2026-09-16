'use client';

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import {
  TRANSPORT_FACTORS,
  ACCOMMODATION_FACTORS,
  TREE_ANNUAL_SEQUESTRATION_KG,
} from '@/lib/carbon/factors';
import {
  calculateTransportEmissions,
  calculateAccommodationEmissions,
  calculateBaselineEmissions,
  calculateTreesEquivalent,
} from '@/lib/carbon/calculator';
import { TransportMode, HotelTier } from '@/lib/types';
import {
  Leaf,
  BarChart3,
  Trees,
  Info,
  ShieldCheck,
  Plane,
  Train,
  Car,
  Bus,
  Hotel,
} from 'lucide-react';

export default function CarbonDashboardPage() {
  const [distanceKm, setDistanceKm] = useState(600);
  const [passengers, setPassengers] = useState(1);
  const [nights, setNights] = useState(3);
  const [selectedMode, setSelectedMode] = useState<TransportMode>('train');
  const [selectedTier, setSelectedTier] = useState<HotelTier>('eco_hotel');

  // Calculations
  const transportCarbon = calculateTransportEmissions(distanceKm, selectedMode, passengers);
  const hotelCarbon = calculateAccommodationEmissions(selectedTier, nights);
  const totalCarbon = Math.round((transportCarbon + hotelCarbon) * 10) / 10;

  const baseline = calculateBaselineEmissions(distanceKm, nights, passengers);
  const savedCarbon = Math.max(0, Math.round((baseline - totalCarbon) * 10) / 10);
  const savingsPct = Math.round((savedCarbon / baseline) * 100);
  const trees = calculateTreesEquivalent(savedCarbon);

  // Modal Comparison data for the current distance
  const modalComparison = [
    {
      mode: 'Electric Train',
      carbon: calculateTransportEmissions(distanceKm, 'train', passengers),
      fill: '#10b981',
    },
    {
      mode: 'Electric Car (EV)',
      carbon: calculateTransportEmissions(distanceKm, 'ev', passengers),
      fill: '#06b6d4',
    },
    {
      mode: 'Express Coach',
      carbon: calculateTransportEmissions(distanceKm, 'bus', passengers),
      fill: '#f59e0b',
    },
    {
      mode: 'Petrol Car',
      carbon: calculateTransportEmissions(distanceKm, 'car', passengers),
      fill: '#fb923c',
    },
    {
      mode: 'Domestic Flight',
      carbon: calculateTransportEmissions(distanceKm, 'flight', passengers),
      fill: '#ef4444',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100/70 text-teal-800 text-xs font-bold uppercase tracking-wider">
          <BarChart3 className="w-3.5 h-3.5" />
          Environmental Intelligence
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Dynamic Carbon Analytics Dashboard
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl">
          Standardized empirical carbon emission factors (DEFRA 2023 & ICAO Protocol)
          and real-time parametric simulation.
        </p>
      </div>

      {/* Simulator Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Interactive Footprint Simulator</h2>
            <p className="text-xs text-slate-500">Test variable passenger counts, transit modes, and lodging</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
            Real-Time Engine
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Distance (km)
            </label>
            <input
              type="number"
              min={50}
              max={5000}
              value={distanceKm}
              onChange={(e) => setDistanceKm(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Passengers
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={passengers}
              onChange={(e) => setPassengers(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Hotel Nights
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={nights}
              onChange={(e) => setNights(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Transit Mode
            </label>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="train">Electric Train</option>
              <option value="ev">Electric Vehicle</option>
              <option value="bus">Express Bus</option>
              <option value="car">Petrol Car</option>
              <option value="flight">Flight</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Accommodation Tier
            </label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="eco_hotel">Eco-Certified Hotel</option>
              <option value="eco_hostel">Green Hostel</option>
              <option value="standard_hotel">Standard Hotel</option>
              <option value="luxury_resort">Luxury Resort</option>
            </select>
          </div>
        </div>

        {/* Results Metrics Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Total Footprint
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalCarbon} kg</div>
            <div className="text-[11px] text-slate-500">Transit: {transportCarbon} kg | Hotel: {hotelCarbon} kg</div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80">
            <div className="text-xs text-emerald-800 font-semibold uppercase tracking-wider">
              Carbon Abated
            </div>
            <div className="text-2xl font-black text-emerald-800 mt-1">{savedCarbon} kg</div>
            <div className="text-[11px] text-emerald-700 font-semibold">↓ {savingsPct}% reduction vs flight</div>
          </div>

          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200/80">
            <div className="text-xs text-teal-800 font-semibold uppercase tracking-wider">
              Trees Equivalent
            </div>
            <div className="text-2xl font-black text-teal-800 mt-1">{trees} Trees</div>
            <div className="text-[11px] text-teal-700">1 year mature sequestration</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Unoptimized Baseline
            </div>
            <div className="text-2xl font-black text-rose-600 mt-1">{baseline} kg</div>
            <div className="text-[11px] text-slate-500">Aviation + Standard 4-Star</div>
          </div>
        </div>
      </div>

      {/* Chart: Comparative Transit Efficiency */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Modal Efficiency Comparison for {distanceKm} km Journey
          </h2>
          <p className="text-xs text-slate-500">
            Passenger transit carbon intensity based on DEFRA standard factors
          </p>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={modalComparison} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <XAxis dataKey="mode" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(val: any) => [`${val} kg CO₂e`, 'Carbon Emissions']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Bar dataKey="carbon" radius={[6, 6, 0, 0]}>
                {modalComparison.map((entry, idx) => (
                  <Cell key={`bar-${idx}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Standardized Factors Reference Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Standardized Carbon Factors Reference</h2>
          <p className="text-xs text-slate-500">
            Official benchmark constants integrated into the EcoRoute Multi-Objective Optimization Engine
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Transit Mode</th>
                <th className="py-3 px-4">Emission Factor</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4">Avg Speed</th>
                <th className="py-3 px-4">Accounting Standard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Electric High-Speed Rail</td>
                <td className="py-3 px-4 text-emerald-700 font-bold">0.032</td>
                <td className="py-3 px-4">kg CO₂e / passenger-km</td>
                <td className="py-3 px-4">180 km/h</td>
                <td className="py-3 px-4 text-slate-500">DEFRA 2023 Passenger Transport</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Electric Car (EV)</td>
                <td className="py-3 px-4 text-cyan-700 font-bold">0.042</td>
                <td className="py-3 px-4">kg CO₂e / vehicle-km</td>
                <td className="py-3 px-4">95 km/h</td>
                <td className="py-3 px-4 text-slate-500">European Grid Emission Avg</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Express Coach / Bus</td>
                <td className="py-3 px-4 text-amber-700 font-bold">0.055</td>
                <td className="py-3 px-4">kg CO₂e / passenger-km</td>
                <td className="py-3 px-4">80 km/h</td>
                <td className="py-3 px-4 text-slate-500">DEFRA 2023 Bus / Coach</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Average Petrol Car (ICE)</td>
                <td className="py-3 px-4 text-orange-700 font-bold">0.171</td>
                <td className="py-3 px-4">kg CO₂e / vehicle-km</td>
                <td className="py-3 px-4">95 km/h</td>
                <td className="py-3 px-4 text-slate-500">DEFRA 2023 Medium Petrol Car</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Short-Haul Commercial Flight</td>
                <td className="py-3 px-4 text-rose-700 font-bold">0.255</td>
                <td className="py-3 px-4">kg CO₂e / passenger-km</td>
                <td className="py-3 px-4">750 km/h</td>
                <td className="py-3 px-4 text-slate-500">ICAO + Radiative Forcing (1.9x)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
