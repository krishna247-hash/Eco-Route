import type { PlanTripRequest, PlanTripResponse } from '@/types';
import type { AccommodationTier } from '@/lib/hotelApi';

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

export interface Booking {
  id: string;
  tripId: string;
  hotelId: string;
  hotelName: string;
  tier: AccommodationTier;
  checkIn: string;
  checkOut: string;
  guests: number;
  pricePerNightUsd: number;
  totalPriceUsd: number;
  isDemoData: true;
  status: 'SAVED' | 'CANCELLED';
  disclaimer: string;
}

export interface CreateBookingInput {
  tripId: string;
  hotelId: string;
  hotelName: string;
  tier: AccommodationTier;
  checkIn: string;
  checkOut: string;
  guests: number;
  pricePerNightUsd: number;
  totalPriceUsd: number;
}

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await ensureAuthToken();
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  });
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const response = await authedFetch('/api/v1/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to save booking (${response.status}): ${detail}`);
  }
  return response.json() as Promise<Booking>;
}

export async function listTripBookings(tripId: string): Promise<Booking[]> {
  const response = await authedFetch(`/api/v1/bookings/trip/${tripId}`);
  if (!response.ok) {
    throw new Error(`Failed to load bookings (${response.status})`);
  }
  const data = (await response.json()) as { bookings: Booking[] };
  return data.bookings;
}

export async function cancelBooking(bookingId: string): Promise<void> {
  const response = await authedFetch(`/api/v1/bookings/${bookingId}`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`Failed to cancel booking (${response.status})`);
  }
}

export async function isPaymentConfigured(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/payments/status`);
    if (!response.ok) return false;
    const data = (await response.json()) as { configured: boolean };
    return data.configured;
  } catch {
    return false;
  }
}

export class PaymentNotConfiguredError extends Error {}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatTripContext {
  origin: string;
  destination: string;
  nights: number;
  preference: string;
  recommended_transport_mode?: string | null;
  recommended_accommodation_tier?: string | null;
  recommended_carbon_kg?: number | null;
  recommended_cost_usd?: number | null;
  recommended_cost_inr_formatted?: string | null;
}

export async function sendChatMessage(
  messages: ChatMessage[],
  tripContext?: ChatTripContext | null,
  locale?: 'en' | 'hi',
): Promise<string> {
  const response = await authedFetch('/api/v1/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, tripContext: tripContext ?? undefined, locale: locale ?? 'en' }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Chat request failed (${response.status}): ${detail}`);
  }
  const data = (await response.json()) as { reply: string };
  return data.reply;
}

export async function createCheckoutSession(input: {
  bookingId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ checkoutUrl: string }> {
  const response = await authedFetch('/api/v1/payments/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (response.status === 503) {
    const detail = await response.json().catch(() => ({ error: 'Payment is not available.' }));
    throw new PaymentNotConfiguredError(detail.error ?? 'Payment is not available.');
  }
  if (!response.ok) {
    throw new Error(`Failed to start checkout (${response.status})`);
  }
  return response.json() as Promise<{ checkoutUrl: string }>;
}
