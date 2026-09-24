'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { MapPin, Route, Calendar, Users, Wallet, Loader2, Navigation, Hotel, Gauge } from 'lucide-react';
import { LocationAutocomplete } from '@/components/map/LocationAutocomplete';
import { getRoute, type LocationResult } from '@/lib/locationApi';
import { useI18n } from '@/i18n/I18nProvider';
import type {
  AccommodationTierFilter,
  PlanTripRequest,
  TransportModeFilter,
  TravelPreference,
} from '@/types';

interface PreferenceFormProps {
  onSubmit: (input: PlanTripRequest) => void;
  submitting: boolean;
}

const PREFERENCE_EMOJI: Record<TravelPreference, string> = {
  eco: '🌿',
  balanced: '⚖️',
  budget: '💰',
  speed: '⚡',
};

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
  const { t } = useI18n();

  const PREFERENCES: { value: TravelPreference; label: string; emoji: string }[] = [
    { value: 'eco', label: t('planForm.preferenceOptions.eco'), emoji: PREFERENCE_EMOJI.eco },
    { value: 'balanced', label: t('planForm.preferenceOptions.balanced'), emoji: PREFERENCE_EMOJI.balanced },
    { value: 'budget', label: t('planForm.preferenceOptions.budget'), emoji: PREFERENCE_EMOJI.budget },
    { value: 'speed', label: t('planForm.preferenceOptions.speed'), emoji: PREFERENCE_EMOJI.speed },
  ];

  const TRANSPORT_OPTIONS: { value: TransportModeFilter | ''; label: string }[] = [
    { value: '', label: t('planForm.transportOptions.any') },
    { value: 'car', label: t('planForm.transportOptions.car') },
    { value: 'train', label: t('planForm.transportOptions.train') },
    { value: 'bus', label: t('planForm.transportOptions.bus') },
    { value: 'flight', label: t('planForm.transportOptions.flight') },
  ];

  const ACCOMMODATION_OPTIONS: { value: AccommodationTierFilter | ''; label: string }[] = [
    { value: '', label: t('planForm.accommodationOptions.any') },
    { value: 'budget', label: t('planForm.accommodationOptions.budget') },
    { value: 'standard', label: t('planForm.accommodationOptions.standard') },
    { value: 'eco', label: t('planForm.accommodationOptions.eco') },
  ];

  // Prefilled synchronously (not via useEffect) from the interactive map
  // page's "Plan this trip" link, if present, so LocationAutocomplete's
  // initialValue is correct on its very first render.
  const searchParams = useSearchParams();
  const mapToLat = searchParams.get('toLat');
  const mapToLon = searchParams.get('toLon');
  const mapDistanceKm = searchParams.get('distanceKm');

  const [origin, setOrigin] = useState(() => searchParams.get('fromName') || 'London');
  const [originLocation, setOriginLocation] = useState<LocationResult | null>(null);
  const [destinationName, setDestinationName] = useState(() => searchParams.get('toName') || 'Paris');
  const [destinationCountry, setDestinationCountry] = useState(() => searchParams.get('toCountry') || 'France');
  const [latitude, setLatitude] = useState(() => (mapToLat ? Number(mapToLat) : 48.8566));
  const [longitude, setLongitude] = useState(() => (mapToLon ? Number(mapToLon) : 2.3522));
  const [distanceKm, setDistanceKm] = useState(() => (mapDistanceKm ? Number(mapDistanceKm) : 350));
  const [distanceSource, setDistanceSource] = useState<'manual' | 'live-route' | 'straight-line'>(
    mapDistanceKm ? 'live-route' : 'manual',
  );
  const [computingDistance, setComputingDistance] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelers, setTravelers] = useState(1);
  const [budgetUsd, setBudgetUsd] = useState<number | ''>('');
  const [preference, setPreference] = useState<TravelPreference>('balanced');
  const [transportModeFilter, setTransportModeFilter] = useState<TransportModeFilter | ''>('');
  const [accommodationTierFilter, setAccommodationTierFilter] = useState<AccommodationTierFilter | ''>('');

  // Auto-compute distance from real routing once both ends have coordinates,
  // without overriding a value the user typed in manually themselves.
  async function recomputeDistance(nextOrigin: LocationResult | null, nextDestLat: number, nextDestLon: number) {
    if (!nextOrigin) return;
    setComputingDistance(true);
    try {
      const result = await getRoute(
        { latitude: nextOrigin.latitude, longitude: nextOrigin.longitude },
        { latitude: nextDestLat, longitude: nextDestLon },
      );
      setDistanceKm(Math.round(result.routes[0].distanceKm));
      setDistanceSource(result.ok ? 'live-route' : 'straight-line');
    } catch {
      // Routing provider unreachable -- leave the existing distance value as-is
      // rather than fabricating a number; the field stays manually editable.
    } finally {
      setComputingDistance(false);
    }
  }

  function handleSelectOrigin(location: LocationResult) {
    setOrigin(location.name);
    setOriginLocation(location);
    void recomputeDistance(location, latitude, longitude);
  }

  function handleSelectDestination(location: LocationResult) {
    setDestinationName(location.name);
    setDestinationCountry(location.country ?? '');
    setLatitude(location.latitude);
    setLongitude(location.longitude);
    void recomputeDistance(originLocation, location.latitude, location.longitude);
  }

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
      transportModeFilter: transportModeFilter || undefined,
      accommodationTierFilter: accommodationTierFilter || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Field label={t('planForm.originLabel')} icon={<MapPin className="h-3.5 w-3.5" />}>
          <LocationAutocomplete
            initialValue={origin}
            placeholder={t('planForm.originPlaceholder')}
            onSelect={handleSelectOrigin}
          />
        </Field>
        <Field label={t('planForm.destinationLabel')} icon={<MapPin className="h-3.5 w-3.5" />}>
          <LocationAutocomplete
            initialValue={destinationName}
            placeholder={t('planForm.destinationPlaceholder')}
            onSelect={handleSelectDestination}
          />
        </Field>
      </div>

      <Field label={t('planForm.distanceLabel')} icon={<Route className="h-3.5 w-3.5" />}>
        <div className="relative">
          <input
            required
            type="number"
            min={1}
            value={distanceKm}
            onChange={(e) => {
              setDistanceKm(Number(e.target.value));
              setDistanceSource('manual');
            }}
            className={inputClass}
          />
          {computingDistance && (
            <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-emerald-500" />
          )}
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
          <Gauge className="h-3 w-3" />
          {distanceSource === 'live-route' && t('planForm.distanceHintLive')}
          {distanceSource === 'straight-line' && t('planForm.distanceHintFallback')}
          {distanceSource === 'manual' && t('planForm.distanceHintManual')}
        </p>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label={t('planForm.startDateLabel')} icon={<Calendar className="h-3.5 w-3.5" />}>
          <input
            required
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={t('planForm.endDateLabel')} icon={<Calendar className="h-3.5 w-3.5" />}>
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
        <Field label={t('planForm.travelersLabel')} icon={<Users className="h-3.5 w-3.5" />}>
          <input
            required
            type="number"
            min={1}
            value={travelers}
            onChange={(e) => setTravelers(Number(e.target.value))}
            className={inputClass}
          />
        </Field>
        <Field label={t('planForm.budgetLabel')} icon={<Wallet className="h-3.5 w-3.5" />}>
          <input
            type="number"
            min={0}
            value={budgetUsd}
            onChange={(e) => setBudgetUsd(e.target.value === '' ? '' : Number(e.target.value))}
            className={inputClass}
            placeholder={t('planForm.budgetPlaceholder')}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label={t('planForm.transportPrefLabel')} icon={<Navigation className="h-3.5 w-3.5" />}>
          <select
            value={transportModeFilter}
            onChange={(e) => setTransportModeFilter(e.target.value as TransportModeFilter | '')}
            className={inputClass}
          >
            {TRANSPORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('planForm.accommodationPrefLabel')} icon={<Hotel className="h-3.5 w-3.5" />}>
          <select
            value={accommodationTierFilter}
            onChange={(e) => setAccommodationTierFilter(e.target.value as AccommodationTierFilter | '')}
            className={inputClass}
          >
            {ACCOMMODATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div>
        <span className="block text-sm font-medium text-slate-700">{t('planForm.sustainabilityLabel')}</span>
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
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-70"
      >
        <span className="flex items-center justify-center gap-2">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? t('planForm.submitting') : t('planForm.submit')}
        </span>
      </button>
    </form>
  );
}
