import type { StoredTripResult, PlanTripRequest, PlanTripResponse } from '@/types';

const STORAGE_PREFIX = 'ecoroute_trip_';

export function saveTripResult(request: PlanTripRequest, response: PlanTripResponse): void {
  const record: StoredTripResult = { request, response };
  window.sessionStorage.setItem(`${STORAGE_PREFIX}${response.tripId}`, JSON.stringify(record));
}

export function loadTripResult(tripId: string): StoredTripResult | null {
  const raw = window.sessionStorage.getItem(`${STORAGE_PREFIX}${tripId}`);
  return raw ? (JSON.parse(raw) as StoredTripResult) : null;
}
