'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { MapPin, Route, Globe2, Calendar, Users, Wallet, Loader2 } from 'lucide-react';
import type { PlanTripRequest, TravelPreference } from '@/types';

interface PreferenceFormProps {
  onSubmit: (input: PlanTripRequest) => void;
  submitting: boolean;
}

const PREFERENCES: { value: TravelPreference; label: string; emoji: string }[] = [
  { value: 'eco', label: 'Eco', emoji: '🌿' },
  { value: 'balanced', label: 'Balanced', emoji: '⚖️' },
  { value: 'budget', label: 'Budget', emoji: '💰' },
  { value: 'speed', label: 'Speed', emoji: '⚡' },
];

const inputClass =
  'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20';

function Field({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      <span className="flex items-center gap-1.5">
        <span className="text-slate-400">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}

export function PreferenceForm({ onSubmit, submitting }: PreferenceFormProps) {
  const [origin, setOrigin] = useState('London');
  const [destinationName, setDestinationName] = useState('Paris');
  const [destinationCountry, setDestinationCountry] = useState('France');
  const [latitude, setLatitude] = useState(48.8566);
  const [longitude, setLongitude] = useState(2.3522);
  const [distanceKm, setDistanceKm] = useState(350);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelers, setTravelers] = useState(1);
  const [budgetUsd, setBudgetUsd] = useState<number | ''>('');
  const [preference, setPreference] = useState<TravelPreference>('balanced');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit({
      origin,
      destination: { name: destinationName, country: destinationCountry, latitude, longitude },
      distanceKm,
      startDate,
      endDate,
      travelers,
      budgetUsd: budgetUsd === '' ? undefined : budgetUsd,
      preference,
      activityHours: 4,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Origin" icon={<MapPin className="h-3.5 w-3.5" />}>
          <input required value={origin} onChange={(e) => setOrigin(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Distance (km)" icon={<Route className="h-3.5 w-3.5" />}>
          <input
            required
            type="number"
            min={1}
            value={distanceKm}
            onChange={(e) => setDistanceKm(Number(e.target.value))}
            className={inputClass}
          />
        </Field>
      </div>

      <fieldset className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <legend className="flex items-center gap-1.5 px-1 text-sm font-medium text-slate-700">
          <Globe2 className="h-3.5 w-3.5 text-slate-400" />
          Destination
        </legend>
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm text-slate-600">
            City
            <input
              required
              value={destinationName}
              onChange={(e) => setDestinationName(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm text-slate-600">
            Country
            <input
              required
              value={destinationCountry}
              onChange={(e) => setDestinationCountry(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm text-slate-600">
            Latitude
            <input
              required
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(Number(e.target.value))}
              className={inputClass}
            />
          </label>
          <label className="block text-sm text-slate-600">
            Longitude
            <input
              required
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(Number(e.target.value))}
              className={inputClass}
            />
          </label>
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Start date" icon={<Calendar className="h-3.5 w-3.5" />}>
          <input
            required
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="End date" icon={<Calendar className="h-3.5 w-3.5" />}>
          <input
            required
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Travelers" icon={<Users className="h-3.5 w-3.5" />}>
          <input
            required
            type="number"
            min={1}
            value={travelers}
            onChange={(e) => setTravelers(Number(e.target.value))}
            className={inputClass}
          />
        </Field>
        <Field label="Budget (USD, optional)" icon={<Wallet className="h-3.5 w-3.5" />}>
          <input
            type="number"
            min={0}
            value={budgetUsd}
            onChange={(e) => setBudgetUsd(e.target.value === '' ? '' : Number(e.target.value))}
            className={inputClass}
            placeholder="No limit"
          />
        </Field>
      </div>

      <div>
        <span className="block text-sm font-medium text-slate-700">Sustainability preference</span>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {PREFERENCES.map((option) => {
            const active = preference === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setPreference(option.value)}
                aria-pressed={active}
                className={`rounded-lg border px-2 py-2.5 text-center text-xs font-medium transition-all ${
                  active
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-500/30'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="block text-base">{option.emoji}</span>
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="group relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-600/25 disabled:translate-y-0 disabled:opacity-70"
      >
        <span className="relative flex items-center justify-center gap-2">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? 'Optimizing your itinerary…' : 'Plan my trip'}
        </span>
      </button>
    </form>
  );
}
