'use client';

import React, { useState } from 'react';
import { POPULAR_CITIES } from '@/lib/data/destinations';
import { OptimizationPriority, TransportMode } from '@/lib/types';
import {
  Compass,
  Calendar,
  Users,
  DollarSign,
  Leaf,
  Clock,
  Sparkles,
  Train,
  Plane,
  Bus,
  Car,
} from 'lucide-react';

interface TripWizardProps {
  onGenerate: (data: any) => void;
  isLoading: boolean;
}

export default function TripWizard({ onGenerate, isLoading }: TripWizardProps) {
  const [origin, setOrigin] = useState('Paris');
  const [destination, setDestination] = useState('Amsterdam');

  // Next week dates default
  const defaultStart = new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];
  const defaultEnd = new Date(Date.now() + 86400000 * 11).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [travelers, setTravelers] = useState(1);
  const [budget, setBudget] = useState(1200);
  const [priority, setPriority] = useState<OptimizationPriority>('balanced');
  const [modes, setModes] = useState<TransportMode[]>(['train', 'flight', 'bus', 'ev']);

  const toggleMode = (mode: TransportMode) => {
    if (modes.includes(mode)) {
      if (modes.length > 1) {
        setModes(modes.filter((m) => m !== mode));
      }
    } else {
      setModes([...modes, mode]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
      origin,
      destination,
      startDate,
      endDate,
      travelers,
      budget,
      priority,
      preferredModes: modes,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-lg shadow-slate-200/50 space-y-6"
    >
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Configure Trip Parameters</h2>
          <p className="text-xs text-slate-500">Multi-objective algorithmic constraint setup</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
          <Leaf className="w-3 h-3" />
          DEFRA Standard
        </span>
      </div>

      {/* Origin & Destination Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Origin City
          </label>
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          >
            {POPULAR_CITIES.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}, {c.country}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Destination City
          </label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          >
            {POPULAR_CITIES.filter((c) => c.name !== origin).map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}, {c.country}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dates & Travelers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Travelers
          </label>
          <div className="flex items-center">
            <input
              type="number"
              min={1}
              max={10}
              value={travelers}
              onChange={(e) => setTravelers(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Optimization Priority */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Optimization Objective Priority
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { id: 'balanced', label: 'Balanced (Pareto)', icon: <Sparkles className="w-3.5 h-3.5" /> },
            { id: 'eco', label: 'Eco-Champion (Min CO₂)', icon: <Leaf className="w-3.5 h-3.5" /> },
            { id: 'speed', label: 'Fastest (Min Time)', icon: <Clock className="w-3.5 h-3.5" /> },
            { id: 'budget', label: 'Budget (Min Cost)', icon: <DollarSign className="w-3.5 h-3.5" /> },
          ].map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setPriority(item.id as any)}
              className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                priority === item.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Allowed Transit Modes */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Candidate Transport Modes
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'train', label: 'Train / High-Speed Rail', icon: <Train className="w-3.5 h-3.5" /> },
            { id: 'flight', label: 'Commercial Flight', icon: <Plane className="w-3.5 h-3.5" /> },
            { id: 'bus', label: 'Coach / Bus', icon: <Bus className="w-3.5 h-3.5" /> },
            { id: 'ev', label: 'Electric Car (EV)', icon: <Car className="w-3.5 h-3.5" /> },
          ].map((m) => {
            const isSelected = modes.includes(m.id as any);
            return (
              <button
                type="button"
                key={m.id}
                onClick={() => toggleMode(m.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold'
                    : 'border-slate-200 text-slate-400 bg-white hover:border-slate-300'
                }`}
              >
                {m.icon}
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm sm:text-base shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Computing Pareto Optimal Frontier...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>Generate Carbon-Optimized Itineraries</span>
          </>
        )}
      </button>
    </form>
  );
}
