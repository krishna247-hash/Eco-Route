/* Hotel search, behind a provider abstraction.
 *
 * There is no real hotel inventory provider wired up: providers like
 * Booking.com, Amadeus, or Hotelbeds require a paid partner agreement to
 * get credentials, not just a signup -- there's no free/keyless option
 * the way there is for maps. Per the platform rule against fabricating
 * live prices, availability, or booking confirmations, HotelSearchResult
 * carries an explicit isDemoData flag, and the only provider implemented
 * is DemoHotelProvider: clearly-labeled, deterministically generated
 * listings (same destination + tier always returns the same hotels, so
 * it behaves consistently rather than like random noise), priced around
 * the same per-tier baselines the trip optimizer already assumes
 * (ai-service/app/core/candidate_generator.py's ACCOMMODATION_TIERS).
 *
 * A real provider can be added later by implementing HotelProvider and
 * swapping getHotelProvider()'s return value -- callers never change. */

export type AccommodationTier = "budget" | "standard" | "eco";

export interface HotelSearchQuery {
  destinationName: string;
  destinationCountry: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  tier?: AccommodationTier;
}

export interface HotelListing {
  id: string;
  name: string;
  tier: AccommodationTier;
  pricePerNightUsd: number;
  totalPriceUsd: number;
  currency: "USD";
  rating: number;
  distanceFromCenterKm: number;
  amenities: string[];
}

export interface HotelSearchResult {
  isDemoData: true;
  source: "demo-generated";
  disclaimer: string;
  hotels: HotelListing[];
}

export interface HotelProvider {
  search(query: HotelSearchQuery): Promise<HotelSearchResult>;
}

const TIER_BASE_PRICE_USD: Record<AccommodationTier, number> = {
  budget: 60,
  standard: 110,
  eco: 95,
};

const NAME_TEMPLATES: Record<AccommodationTier, string[]> = {
  budget: ["{dest} Traveler's Inn", "{dest} Budget Stay", "Backpacker House {dest}", "{dest} Central Hostel"],
  standard: ["{dest} Grand Hotel", "The {dest} Plaza", "{dest} City Hotel", "Hotel {dest} Central"],
  eco: ["{dest} Eco Lodge", "Green Stay {dest}", "{dest} Sustainable Retreat", "EcoNest {dest}"],
};

const AMENITIES_POOL = [
  "Free Wi-Fi",
  "Breakfast included",
  "Air conditioning",
  "24-hour front desk",
  "Solar-powered hot water",
  "Bicycle rental",
  "On-site restaurant",
  "Fitness center",
  "Locally-sourced dining",
  "Public transit nearby",
];

/** Small deterministic string hash (FNV-1a), used to derive stable
 * pseudo-random values from a seed string so results are consistent
 * per destination+hotel rather than reshuffling on every request. */
function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function seededFraction(seed: string): number {
  return hashSeed(seed) / 0xffffffff;
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(Math.round(ms / (1000 * 60 * 60 * 24)), 1);
}

function generateHotelsForTier(destinationName: string, tier: AccommodationTier, nights: number): HotelListing[] {
  const templates = NAME_TEMPLATES[tier];
  const basePrice = TIER_BASE_PRICE_USD[tier];

  return templates.map((template, i) => {
    const name = template.replace("{dest}", destinationName);
    const seed = `${destinationName.toLowerCase()}::${tier}::${i}`;

    // Deterministic variance around the tier baseline: +/-25% on price,
    // 3.5-4.9 star rating, 0.3-4.5 km from center.
    const priceVariance = 0.75 + seededFraction(`${seed}::price`) * 0.5;
    const pricePerNightUsd = Math.round(basePrice * priceVariance);
    const rating = Math.round((3.5 + seededFraction(`${seed}::rating`) * 1.4) * 10) / 10;
    const distanceFromCenterKm = Math.round(seededFraction(`${seed}::distance`) * 42) / 10;

    const amenityCount = 3 + Math.floor(seededFraction(`${seed}::amenities`) * 3);
    const amenities = [...AMENITIES_POOL]
      .sort((a, b) => seededFraction(`${seed}::${a}`) - seededFraction(`${seed}::${b}`))
      .slice(0, amenityCount);

    return {
      id: `demo-${hashSeed(seed).toString(36)}`,
      name,
      tier,
      pricePerNightUsd,
      totalPriceUsd: pricePerNightUsd * nights,
      currency: "USD",
      rating,
      distanceFromCenterKm,
      amenities,
    };
  });
}

export class DemoHotelProvider implements HotelProvider {
  async search(query: HotelSearchQuery): Promise<HotelSearchResult> {
    const nights = nightsBetween(query.checkIn, query.checkOut);
    const tiers: AccommodationTier[] = query.tier ? [query.tier] : ["budget", "standard", "eco"];

    const hotels = tiers.flatMap((tier) => generateHotelsForTier(query.destinationName, tier, nights));
    hotels.sort((a, b) => a.pricePerNightUsd - b.pricePerNightUsd);

    return {
      isDemoData: true,
      source: "demo-generated",
      disclaimer:
        "These are demo listings for demonstration purposes only -- not real hotel inventory, pricing, or availability. No live hotel provider is connected.",
      hotels,
    };
  }
}

export function getHotelProvider(): HotelProvider {
  return new DemoHotelProvider();
}
