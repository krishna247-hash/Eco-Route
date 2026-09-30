import { Plane, Train, Bus, Car, Zap } from 'lucide-react';

export const MODE_META = {
  train: { label: 'Electric Rail', icon: Train, color: '#10b981' },
  ev: { label: 'Electric Car', icon: Zap, color: '#06b6d4' },
  bus: { label: 'Coach / Bus', icon: Bus, color: '#f59e0b' },
  car: { label: 'Petrol Car', icon: Car, color: '#64748b' },
  flight: { label: 'Flight', icon: Plane, color: '#f43f5e' },
};

export const TIER_LABELS = {
  hostel: 'Eco Hostel',
  eco_hotel: 'Eco Hotel',
  standard_hotel: 'Standard Hotel',
  luxury_hotel: 'Luxury Hotel',
};

export const PLAN_KEYS = ['ecoChampion', 'balanced', 'fastest'];

export const isoOffset = (days) =>
  new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

export const fmtMoney = (n) => `$${Math.round(n).toLocaleString()}`;
export const fmtKg = (n) => `${Number(n).toLocaleString(undefined, { maximumFractionDigits: 1 })} kg`;

export function fmtDate(iso) {
  if (!iso) return '';
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** Mirrors the server calculator so sliders update instantly. */
export function transportCarbon(factors, distanceKm, mode, passengers) {
  const f = factors.transport[mode];
  const units = f.perVehicle ? Math.max(1, Math.ceil(passengers / 4)) : passengers;
  return Math.round(distanceKm * f.factor * units * 10) / 10;
}
