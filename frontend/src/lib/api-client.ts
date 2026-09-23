import type { PlanTripRequest, PlanTripResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
const TOKEN_STORAGE_KEY = 'ecoroute_token';

/**
 * The build guide's phased backend never adds a login page, but
 * POST /api/v1/trips/plan is JWT-protected. To keep the demo data flow
 * working without inventing an out-of-scope login UI, silently create a
 * guest account on first use and reuse its token from then on.
 */
async function ensureAuthToken(): Promise<string> {
  const existing = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const guestId = crypto.randomUUID();
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `guest-${guestId}@ecoroute.local`,
      password: guestId,
      name: 'Guest Traveler',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to start a guest session (${response.status})`);
  }

  const data = (await response.json()) as { token: string };
  window.localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
  return data.token;
}

export async function planTrip(input: PlanTripRequest): Promise<PlanTripResponse> {
  const token = await ensureAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/v1/trips/plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to plan trip (${response.status}): ${detail}`);
  }

  return response.json() as Promise<PlanTripResponse>;
}
