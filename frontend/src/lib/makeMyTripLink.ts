/* There is no free/keyless API for real hotel prices, photos, or offers
 * -- those require a paid OTA partner agreement (same constraint as
 * hotel.service.ts's inventory problem). Embedding MakeMyTrip directly
 * would also just show a blank/broken frame, since sites like that block
 * iframing.
 *
 * What genuinely works: sending the traveler to MakeMyTrip's own real
 * listing in a new tab, where the prices/photos/offers they see are
 * actually live. Since MakeMyTrip's internal hotel search needs a city
 * code we don't have (and guessing one risks landing on a broken or
 * wrong-city results page -- exactly the kind of fabricated-looking
 * failure this app avoids), the reliable way to get there is a
 * site-scoped Google search for the hotel by name and destination. That
 * URL format is stable and never 404s, and it surfaces MakeMyTrip's real
 * page for that hotel (or a relevant city search, for a placeholder-named
 * demo listing) rather than us guessing at a deep link. */

export function makeMyTripSearchUrl(hotelName: string, destinationName: string): string {
  const query = `${hotelName} ${destinationName} hotel site:makemytrip.com`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}
