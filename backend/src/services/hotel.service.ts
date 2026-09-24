/* Hotel search, behind a provider abstraction.
 *
 * There is no real hotel *inventory* provider wired up: providers like
 * Booking.com, Amadeus, or Hotelbeds require a paid partner agreement to
 * get credentials, not just a signup -- there's no free/keyless option
 * for live prices/availability the way there is for maps. Per the
 * platform rule against fabricating those, every HotelSearchResult
 * carries an explicit isDemoData flag and disclaimer: pricing, ratings,
 * and availability are always estimated demo data, never live.
 *
 * What CAN be real, for free: which hotels actually exist near the
 * destination, and where. OsmDemoHotelProvider looks those up from
 * OpenStreetMap via the Overpass API (free, keyless, the same provider
 * family as Phase 3's location search) -- real names and real
 * coordinates, with demo pricing/ratings/amenities layered on top the
 * same deterministic way as before. If Overpass is unreachable, has no
 * listings nearby, or no coordinates were given, it honestly falls back
 * to fully-synthetic names rather than blocking the page or fabricating
 * fake "real" ones -- the disclaimer says which case happened, and a
 * request can even end up with a mix (real names for the tiers OSM had
 * enough listings for, synthetic filling in the rest). */

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const OVERPASS_RADIUS_METERS = 5000;
const OVERPASS_TIMEOUT_MS = 7000;
const HOTELS_PER_TIER = 4;

export type AccommodationTier = "budget" | "standard" | "eco";

export interface HotelSearchQuery {
  destinationName: string;
  destinationCountry: string;
  destinationLat?: number;
  destinationLon?: number;
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
  /** A real photo, only present when the matching OSM venue itself
   * carries a `wikimedia_commons=File:...` tag -- never a stock photo
   * substituted in for venues (real or synthetic) that don't have one. */
  photoUrl?: string;
}

export interface HotelSearchResult {
  isDemoData: true;
  source: "osm" | "demo-generated";
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

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

/** An identity is just "what is this place called and where is it" --
 * either a real OSM venue or a synthetic placeholder. Pricing, rating,
 * and amenities are always generated the same deterministic way,
 * seeded by the identity, regardless of which kind it is. */
interface HotelIdentity {
  key: string;
  name: string;
  distanceFromCenterKm?: number;
  photoUrl?: string;
}

function buildListing(identity: HotelIdentity, tier: AccommodationTier, nights: number): HotelListing {
  const basePrice = TIER_BASE_PRICE_USD[tier];
  const seed = `${identity.key}::${tier}`;

  const priceVariance = 0.75 + seededFraction(`${seed}::price`) * 0.5;
  const pricePerNightUsd = Math.round(basePrice * priceVariance);
  const rating = Math.round((3.5 + seededFraction(`${seed}::rating`) * 1.4) * 10) / 10;
  const distanceFromCenterKm =
    identity.distanceFromCenterKm ?? Math.round(seededFraction(`${seed}::distance`) * 42) / 10;

  const amenityCount = 3 + Math.floor(seededFraction(`${seed}::amenities`) * 3);
  const amenities = [...AMENITIES_POOL]
    .sort((a, b) => seededFraction(`${seed}::${a}`) - seededFraction(`${seed}::${b}`))
    .slice(0, amenityCount);

  return {
    id: `demo-${hashSeed(seed).toString(36)}`,
    name: identity.name,
    tier,
    pricePerNightUsd,
    totalPriceUsd: pricePerNightUsd * nights,
    currency: "USD",
    rating,
    distanceFromCenterKm: Math.round(distanceFromCenterKm * 10) / 10,
    amenities,
    photoUrl: identity.photoUrl,
  };
}

function syntheticIdentities(destinationName: string, tier: AccommodationTier): HotelIdentity[] {
  return NAME_TEMPLATES[tier].map((template, i) => ({
    key: `${destinationName.toLowerCase()}::${tier}::${i}`,
    name: template.replace("{dest}", destinationName),
  }));
}

const DEMO_DISCLAIMER =
  "These are demo listings for demonstration purposes only -- not real hotel inventory, pricing, or availability. No live hotel provider is connected.";

export class DemoHotelProvider implements HotelProvider {
  async search(query: HotelSearchQuery): Promise<HotelSearchResult> {
    const nights = nightsBetween(query.checkIn, query.checkOut);
    const tiers: AccommodationTier[] = query.tier ? [query.tier] : ["budget", "standard", "eco"];

    const hotels = tiers.flatMap((tier) =>
      syntheticIdentities(query.destinationName, tier).map((identity) => buildListing(identity, tier, nights)),
    );
    hotels.sort((a, b) => a.pricePerNightUsd - b.pricePerNightUsd);

    return { isDemoData: true, source: "demo-generated", disclaimer: DEMO_DISCLAIMER, hotels };
  }
}

/* ---- OpenStreetMap-backed identities, via the free/keyless Overpass API ---- */

const WIKIMEDIA_COMMONS_FILE_PREFIX = "File:";

/** Turns an OSM `wikimedia_commons=File:...` tag into a real, directly
 * loadable photo URL via Commons' Special:FilePath redirect -- no extra
 * API call or lookup needed. Category: tags and anything else are left
 * alone (never guessed at) since there's no single photo to point to. */
function wikimediaPhotoUrl(wikimediaCommonsTag: string | undefined): string | undefined {
  if (!wikimediaCommonsTag?.startsWith(WIKIMEDIA_COMMONS_FILE_PREFIX)) {
    return undefined;
  }
  const filename = wikimediaCommonsTag.slice(WIKIMEDIA_COMMONS_FILE_PREFIX.length);
  if (!filename) return undefined;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=800`;
}

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

async function fetchOsmHotelIdentities(lat: number, lon: number): Promise<HotelIdentity[]> {
  const query = `[out:json][timeout:8];(node["tourism"~"^(hotel|hostel|guest_house)$"]["name"](around:${OVERPASS_RADIUS_METERS},${lat},${lon});way["tourism"~"^(hotel|hostel|guest_house)$"]["name"](around:${OVERPASS_RADIUS_METERS},${lat},${lon}););out center ${HOTELS_PER_TIER * 6};`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: query,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) {
    throw new Error(`Overpass responded HTTP ${response.status}`);
  }

  const data = (await response.json()) as { elements?: OverpassElement[] };
  const elements = data.elements ?? [];

  const seen = new Set<string>();
  const identities: HotelIdentity[] = [];
  for (const el of elements) {
    const name = el.tags?.name;
    const elLat = el.lat ?? el.center?.lat;
    const elLon = el.lon ?? el.center?.lon;
    if (!name || elLat === undefined || elLon === undefined || seen.has(name)) continue;
    seen.add(name);
    identities.push({
      key: `osm-${el.type}-${el.id}`,
      name,
      distanceFromCenterKm: haversineKm(lat, lon, elLat, elLon),
      photoUrl: wikimediaPhotoUrl(el.tags?.wikimedia_commons),
    });
  }
  return identities;
}

/** Deterministically assigns each real venue to one of the three tiers
 * (OSM doesn't reliably tag a price tier), so the same venue always
 * lands in the same tier rather than reshuffling per request. */
function splitByTier(identities: HotelIdentity[]): Record<AccommodationTier, HotelIdentity[]> {
  const buckets: Record<AccommodationTier, HotelIdentity[]> = { budget: [], standard: [], eco: [] };
  const tiers: AccommodationTier[] = ["budget", "standard", "eco"];
  for (const identity of identities) {
    const tier = tiers[hashSeed(`tier::${identity.key}`) % tiers.length];
    buckets[tier].push(identity);
  }
  return buckets;
}

export class OsmDemoHotelProvider implements HotelProvider {
  async search(query: HotelSearchQuery): Promise<HotelSearchResult> {
    const nights = nightsBetween(query.checkIn, query.checkOut);
    const tiers: AccommodationTier[] = query.tier ? [query.tier] : ["budget", "standard", "eco"];

    if (query.destinationLat === undefined || query.destinationLon === undefined) {
      return new DemoHotelProvider().search(query);
    }

    let realByTier: Record<AccommodationTier, HotelIdentity[]> = { budget: [], standard: [], eco: [] };
    let osmReachable = true;
    try {
      const identities = await fetchOsmHotelIdentities(query.destinationLat, query.destinationLon);
      realByTier = splitByTier(identities);
    } catch {
      osmReachable = false;
    }

    let usedAnyReal = false;
    let ranShort = false;
    const hotels = tiers.flatMap((tier) => {
      const real = realByTier[tier].slice(0, HOTELS_PER_TIER);
      if (real.length > 0) usedAnyReal = true;
      const shortfall = HOTELS_PER_TIER - real.length;
      if (shortfall > 0 && osmReachable) ranShort = true;

      const synthetic = shortfall > 0 ? syntheticIdentities(query.destinationName, tier).slice(0, shortfall) : [];
      return [...real, ...synthetic].map((identity) => buildListing(identity, tier, nights));
    });
    hotels.sort((a, b) => a.pricePerNightUsd - b.pricePerNightUsd);

    if (!usedAnyReal) {
      const reason = osmReachable
        ? "no matching OpenStreetMap listings were found near this destination"
        : "the OpenStreetMap lookup was temporarily unreachable";
      return {
        isDemoData: true,
        source: "demo-generated",
        disclaimer: `${DEMO_DISCLAIMER} (${reason}, so hotel names below are also placeholders, not real venues.)`,
        hotels,
      };
    }

    const disclaimer = ranShort
      ? "Hotel names and locations are sourced from OpenStreetMap contributors where a nearby listing was found; " +
        "remaining slots use placeholder names. Pricing, ratings, and availability are always estimated demo data " +
        "-- no live hotel provider is connected."
      : "Hotel names and locations are sourced from OpenStreetMap contributors. Pricing, ratings, and availability " +
        "are still estimated demo data -- no live hotel provider is connected.";

    return { isDemoData: true, source: "osm", disclaimer, hotels };
  }
}

export function getHotelProvider(): HotelProvider {
  return new OsmDemoHotelProvider();
}
