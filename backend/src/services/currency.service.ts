import { getCached, setCached } from "./cache.service";

/* Live USD->INR exchange rate, via the Frankfurter API -- free, keyless,
 * ECB-sourced, updated daily on banking days. Used to display costs in
 * rupees without hardcoding a conversion rate that would drift out of
 * date and become a quietly-wrong number over time.
 *
 * All cost math elsewhere in this app (candidate_generator.py, Stripe
 * line items, stored Booking rows) stays denominated in USD -- that's
 * the actual unit the underlying data was authored in. This service
 * only converts for *display*, at the boundary, the same way Phase 3's
 * map services only ever add a presentation layer over a provider
 * rather than changing what's computed underneath. */

const FRANKFURTER_URL = "https://api.frankfurter.dev/v1/latest?from=USD&to=INR";
const REQUEST_TIMEOUT_MS = 6000;
const LIVE_CACHE_KEY = "currency:usd-inr:live";
const LIVE_CACHE_TTL_SECONDS = 60 * 60; // 1 hour -- rates don't move fast enough to need fresher polling
const LAST_KNOWN_KEY = "currency:usd-inr:last-known";
const LAST_KNOWN_TTL_SECONDS = 60 * 60 * 24 * 14; // 2 weeks -- a real (if stale) rate beats none

export interface UsdInrRate {
  usdToInr: number;
  asOf: string;
  isLive: boolean;
}

interface CachedRate {
  usdToInr: number;
  asOf: string;
}

async function fetchLiveRate(): Promise<CachedRate> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(FRANKFURTER_URL, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) {
    throw new Error(`Frankfurter responded HTTP ${response.status}`);
  }

  const data = (await response.json()) as { rates?: { INR?: number }; date?: string };
  const rate = data.rates?.INR;
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
    throw new Error("Frankfurter response did not include a usable INR rate");
  }

  return { usdToInr: rate, asOf: data.date ?? new Date().toISOString().slice(0, 10) };
}

export async function getUsdToInrRate(): Promise<UsdInrRate> {
  const cached = await getCached<CachedRate>(LIVE_CACHE_KEY);
  if (cached) {
    return { ...cached, isLive: true };
  }

  try {
    const fresh = await fetchLiveRate();
    await setCached(LIVE_CACHE_KEY, fresh, LIVE_CACHE_TTL_SECONDS);
    await setCached(LAST_KNOWN_KEY, fresh, LAST_KNOWN_TTL_SECONDS);
    return { ...fresh, isLive: true };
  } catch {
    // The live rate provider is unreachable -- fall back to the last
    // real rate we successfully fetched (never a hardcoded/invented
    // number) rather than blocking currency display entirely.
    const lastKnown = await getCached<CachedRate>(LAST_KNOWN_KEY);
    if (lastKnown) {
      return { ...lastKnown, isLive: false };
    }
    throw new Error("No live or cached USD-INR exchange rate is available");
  }
}
