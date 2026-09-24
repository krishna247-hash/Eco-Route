/** A small curated seed list of real destinations to surface for
 * discovery/search, each with real coordinates -- not fabricated, just a
 * starting point for browsing. Any destination can still be planned via
 * the search box on /plan; this list only drives /destinations' grid. */
export interface CuratedDestination {
  slug: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

export const CURATED_DESTINATIONS: CuratedDestination[] = [
  { slug: 'goa', name: 'Goa', country: 'India', latitude: 15.2993, longitude: 74.124 },
  { slug: 'jaipur', name: 'Jaipur', country: 'India', latitude: 26.9124, longitude: 75.7873 },
  { slug: 'kochi', name: 'Kochi', country: 'India', latitude: 9.9312, longitude: 76.2673 },
  { slug: 'leh', name: 'Leh', country: 'India', latitude: 34.1526, longitude: 77.5771 },
  { slug: 'mumbai', name: 'Mumbai', country: 'India', latitude: 19.076, longitude: 72.8777 },
  { slug: 'paris', name: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522 },
  { slug: 'rome', name: 'Rome', country: 'Italy', latitude: 41.9028, longitude: 12.4964 },
  { slug: 'kyoto', name: 'Kyoto', country: 'Japan', latitude: 35.0116, longitude: 135.7681 },
];

export function findDestinationBySlug(slug: string): CuratedDestination | undefined {
  return CURATED_DESTINATIONS.find((d) => d.slug === slug);
}
