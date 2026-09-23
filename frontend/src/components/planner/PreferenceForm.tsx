'use client';

import { useState, type FormEvent } from 'react';
import type { PlanTripRequest, TravelPreference } from '@/types';

interface PreferenceFormProps {
  onSubmit: (input: PlanTripRequest) => void;
  submitting: boolean;
}

const PREFERENCES: { value: TravelPreference; label: string }[] = [
  { value: 'eco', label: 'Eco (minimize carbon)' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'budget', label: 'Budget (minimize cost)' },
  { value: 'speed', label: 'Speed (minimize time)' },
];

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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm font-medium text-slate-700">
          Origin
          <input
            required
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Distance (km)
          <input
            required
            type="number"
            min={1}
            value={distanceKm}
            onChange={(e) => setDistanceKm(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <fieldset className="rounded-md border border-slate-200 p-4">
        <legend className="px-1 text-sm font-medium text-slate-700">Destination</legend>
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm text-slate-600">
            City
            <input
              required
              value={destinationName}
              onChange={(e) => setDestinationName(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm text-slate-600">
            Country
            <input
              required
              value={destinationCountry}
              onChange={(e) => setDestinationCountry(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm font-medium text-slate-700">
          Start date
          <input
            required
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          End date
          <input
            required
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm font-medium text-slate-700">
          Travelers
          <input
            required
            type="number"
            min={1}
            value={travelers}
            onChange={(e) => setTravelers(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Budget (USD, optional)
          <input
            type="number"
            min={0}
            value={budgetUsd}
            onChange={(e) => setBudgetUsd(e.target.value === '' ? '' : Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Sustainability preference
        <select
          value={preference}
          onChange={(e) => setPreference(e.target.value as TravelPreference)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {PREFERENCES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60"
      >
        {submitting ? 'Planning…' : 'Plan my trip'}
      </button>
    </form>
  );
}
