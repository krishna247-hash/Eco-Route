import { ACCOMMODATION_FACTORS } from '../carbon/factors';
import { Accommodation, Activity, City, HotelTier } from '../types';

export const POPULAR_CITIES: City[] = [
  { id: 'paris', name: 'Paris', country: 'France', coords: { lat: 48.8566, lng: 2.3522 } },
  { id: 'amsterdam', name: 'Amsterdam', country: 'Netherlands', coords: { lat: 52.3676, lng: 4.9041 } },
  { id: 'berlin', name: 'Berlin', country: 'Germany', coords: { lat: 52.52, lng: 13.405 } },
  { id: 'barcelona', name: 'Barcelona', country: 'Spain', coords: { lat: 41.3874, lng: 2.1686 } },
  { id: 'rome', name: 'Rome', country: 'Italy', coords: { lat: 41.9028, lng: 12.4964 } },
  { id: 'vienna', name: 'Vienna', country: 'Austria', coords: { lat: 48.2082, lng: 16.3738 } },
  { id: 'copenhagen', name: 'Copenhagen', country: 'Denmark', coords: { lat: 55.6761, lng: 12.5683 } },
  { id: 'lisbon', name: 'Lisbon', country: 'Portugal', coords: { lat: 38.7223, lng: -9.1393 } },
];

export function getCityById(idOrName: string): City | undefined {
  const needle = idOrName.trim().toLowerCase();
  return POPULAR_CITIES.find(
    (c) => c.id.toLowerCase() === needle || c.name.toLowerCase() === needle
  );
}

const HOTEL_NAMES: Record<HotelTier, string> = {
  eco_hostel: 'Green Hostel',
  eco_hotel: 'EcoStay Boutique Hotel',
  standard_hotel: 'City Center Hotel',
  luxury_resort: 'Grand Eco Resort & Spa',
};

const HOTEL_CERTIFICATIONS: Record<HotelTier, string[]> = {
  eco_hostel: ['Green Key'],
  eco_hotel: ['LEED Gold', 'Green Key'],
  standard_hotel: ['ISO 14001'],
  luxury_resort: ['LEED Platinum', 'Green Globe'],
};

const HOTEL_HIGHLIGHTS: Record<HotelTier, string[]> = {
  eco_hostel: ['Solar water heating', 'Zero single-use plastics', 'Community bike-share partner'],
  eco_hotel: ['100% renewable grid electricity', 'On-site greywater recycling', 'Locally sourced breakfast'],
  standard_hotel: ['Standard municipal energy grid', 'Linen & towel reuse program'],
  luxury_resort: ['Verified carbon offset program', 'Electric shuttle fleet', 'On-site solar array'],
};

export function getAccommodationForCity(city: City, tier: HotelTier): Accommodation {
  const factors = ACCOMMODATION_FACTORS[tier];
  return {
    name: `${city.name} ${HOTEL_NAMES[tier]}`,
    rating: factors.ratingDefault,
    pricePerNight: factors.pricePerNight,
    carbonKgPerNight: factors.carbonKgPerNight,
    ecoCertifications: HOTEL_CERTIFICATIONS[tier],
    ecoScore: factors.ecoScore,
    sustainabilityHighlights: HOTEL_HIGHLIGHTS[tier],
  };
}

type ActivitySeed = Omit<Activity, 'id'>;

const ACTIVITY_POOL: Record<string, ActivitySeed[]> = {
  paris: [
    { name: 'Louvre Museum Walking Tour', category: 'Museum', description: 'Guided walk through the world\'s largest art museum.', durationHours: 3, cost: 22, carbonKg: 0.4, coords: { lat: 48.8606, lng: 2.3376 } },
    { name: 'Seine River Electric Boat Cruise', category: 'Outdoors', description: 'Zero-emission electric boat tour along the Seine.', durationHours: 1.5, cost: 18, carbonKg: 0.2, coords: { lat: 48.8566, lng: 2.3444 } },
    { name: 'Montmartre Food Walk', category: 'Food', description: 'Small-group tasting tour of local bakeries and bistros.', durationHours: 2.5, cost: 45, carbonKg: 0.3, coords: { lat: 48.8867, lng: 2.3431 } },
    { name: 'Luxembourg Gardens Bike Ride', category: 'Outdoors', description: 'City bike-share ride through the Luxembourg Gardens.', durationHours: 1, cost: 8, carbonKg: 0.1, coords: { lat: 48.8462, lng: 2.3372 } },
  ],
  amsterdam: [
    { name: 'Canal District Cycling Tour', category: 'Outdoors', description: 'Guided bicycle tour of the UNESCO canal ring.', durationHours: 2.5, cost: 25, carbonKg: 0.1, coords: { lat: 52.3702, lng: 4.8952 } },
    { name: 'Van Gogh Museum Visit', category: 'Museum', description: 'Self-paced visit through the Van Gogh collection.', durationHours: 2, cost: 20, carbonKg: 0.3, coords: { lat: 52.3584, lng: 4.8811 } },
    { name: 'Jordaan Local Market Walk', category: 'Food', description: 'Stroll through the Jordaan district\'s organic markets.', durationHours: 1.5, cost: 15, carbonKg: 0.2, coords: { lat: 52.3746, lng: 4.8829 } },
    { name: 'Vondelpark Picnic & Stroll', category: 'Outdoors', description: 'Relaxed picnic in Amsterdam\'s largest green space.', durationHours: 1.5, cost: 10, carbonKg: 0.1, coords: { lat: 52.3579, lng: 4.8686 } },
  ],
  berlin: [
    { name: 'Berlin Wall Memorial Walk', category: 'Culture', description: 'Historical walking tour along the East Side Gallery.', durationHours: 2, cost: 12, carbonKg: 0.2, coords: { lat: 52.5051, lng: 13.4396 } },
    { name: 'Museum Island Pass', category: 'Museum', description: 'Access to five major museums on Museum Island.', durationHours: 3.5, cost: 24, carbonKg: 0.4, coords: { lat: 52.5169, lng: 13.4015 } },
    { name: 'Tiergarten Electric Tram Ride', category: 'Outdoors', description: 'Scenic tram ride through Berlin\'s central park.', durationHours: 1, cost: 9, carbonKg: 0.15, coords: { lat: 52.5145, lng: 13.3501 } },
    { name: 'Kreuzberg Street Food Tour', category: 'Food', description: 'Multicultural street food tasting in Kreuzberg.', durationHours: 2, cost: 30, carbonKg: 0.3, coords: { lat: 52.4996, lng: 13.4033 } },
  ],
  barcelona: [
    { name: 'Sagrada Familia Guided Visit', category: 'Landmark', description: 'Skip-the-line guided tour of Gaudi\'s masterpiece.', durationHours: 2, cost: 35, carbonKg: 0.3, coords: { lat: 41.4036, lng: 2.1744 } },
    { name: 'Park Guell Walking Tour', category: 'Culture', description: 'Guided walk through Gaudi\'s mosaic park.', durationHours: 1.5, cost: 20, carbonKg: 0.2, coords: { lat: 41.4145, lng: 2.1527 } },
    { name: 'Boqueria Market Tapas Tour', category: 'Food', description: 'Tapas tasting through La Boqueria market.', durationHours: 2, cost: 40, carbonKg: 0.3, coords: { lat: 41.3818, lng: 2.1717 } },
    { name: 'Barceloneta Beach Cycle', category: 'Outdoors', description: 'Coastal bike-share ride along the beachfront promenade.', durationHours: 1.5, cost: 12, carbonKg: 0.1, coords: { lat: 41.3784, lng: 2.1925 } },
  ],
  rome: [
    { name: 'Colosseum & Forum Tour', category: 'Landmark', description: 'Guided tour of the Colosseum and Roman Forum.', durationHours: 3, cost: 38, carbonKg: 0.4, coords: { lat: 41.8902, lng: 12.4922 } },
    { name: 'Vatican Museums Walk', category: 'Museum', description: 'Guided walk through the Vatican Museums and Sistine Chapel.', durationHours: 3, cost: 32, carbonKg: 0.4, coords: { lat: 41.9065, lng: 12.4536 } },
    { name: 'Trastevere Food Walk', category: 'Food', description: 'Evening food tasting tour through Trastevere.', durationHours: 2.5, cost: 48, carbonKg: 0.3, coords: { lat: 41.8896, lng: 12.4695 } },
    { name: 'Villa Borghese Gardens Walk', category: 'Outdoors', description: 'Self-guided stroll through Rome\'s central gardens.', durationHours: 1, cost: 6, carbonKg: 0.1, coords: { lat: 41.9142, lng: 12.4922 } },
  ],
  vienna: [
    { name: 'Schonbrunn Palace Tour', category: 'Landmark', description: 'Guided tour of the imperial summer palace and gardens.', durationHours: 2.5, cost: 28, carbonKg: 0.3, coords: { lat: 48.1858, lng: 16.3122 } },
    { name: 'Vienna State Opera Backstage', category: 'Culture', description: 'Behind-the-scenes tour of the historic opera house.', durationHours: 1, cost: 15, carbonKg: 0.1, coords: { lat: 48.2035, lng: 16.369 } },
    { name: 'Naschmarkt Food Tasting', category: 'Food', description: 'Guided tasting tour through Vienna\'s largest market.', durationHours: 2, cost: 35, carbonKg: 0.25, coords: { lat: 48.1974, lng: 16.3653 } },
    { name: 'Danube Island Bike Ride', category: 'Outdoors', description: 'City bike-share ride along the Danube Island paths.', durationHours: 1.5, cost: 10, carbonKg: 0.1, coords: { lat: 48.2312, lng: 16.4234 } },
  ],
  copenhagen: [
    { name: 'Nyhavn Harbor Walk', category: 'Culture', description: 'Waterfront walking tour of the colorful harbor district.', durationHours: 1.5, cost: 0, carbonKg: 0.05, coords: { lat: 55.6799, lng: 12.5921 } },
    { name: 'Christiania Bike Tour', category: 'Outdoors', description: 'Guided cargo-bike tour through the freetown district.', durationHours: 2, cost: 22, carbonKg: 0.1, coords: { lat: 55.6737, lng: 12.5983 } },
    { name: 'Torvehallerne Market Tasting', category: 'Food', description: 'Nordic food tasting tour through the glass market halls.', durationHours: 1.5, cost: 30, carbonKg: 0.2, coords: { lat: 55.6839, lng: 12.5698 } },
    { name: 'National Museum Visit', category: 'Museum', description: 'Self-paced visit through Danish cultural history.', durationHours: 2, cost: 14, carbonKg: 0.25, coords: { lat: 55.6739, lng: 12.5744 } },
  ],
  lisbon: [
    { name: 'Belem Tower & Monastery Walk', category: 'Landmark', description: 'Guided walking tour of Belem\'s riverside monuments.', durationHours: 2.5, cost: 20, carbonKg: 0.3, coords: { lat: 38.6916, lng: -9.2159 } },
    { name: 'Alfama Tram & Fado Evening', category: 'Culture', description: 'Historic tram ride followed by a live fado performance.', durationHours: 2, cost: 32, carbonKg: 0.2, coords: { lat: 38.7112, lng: -9.1289 } },
    { name: 'Time Out Market Tasting', category: 'Food', description: 'Curated tasting tour through Lisbon\'s food hall.', durationHours: 1.5, cost: 28, carbonKg: 0.2, coords: { lat: 38.7069, lng: -9.1459 } },
    { name: 'LX Factory Walking Tour', category: 'Culture', description: 'Self-guided walk through the creative former factory district.', durationHours: 1.5, cost: 8, carbonKg: 0.15, coords: { lat: 38.7031, lng: -9.1783 } },
  ],
};

const DEFAULT_ACTIVITIES: ActivitySeed[] = [
  { name: 'Old Town Walking Tour', category: 'Culture', description: 'Self-guided exploration of the historic city center.', durationHours: 2, cost: 15, carbonKg: 0.2 },
  { name: 'Local Market Visit', category: 'Food', description: 'Sample regional produce and street food at the central market.', durationHours: 1.5, cost: 20, carbonKg: 0.2 },
];

export function getActivitiesForCity(cityId: string): Activity[] {
  const pool = ACTIVITY_POOL[cityId] ?? DEFAULT_ACTIVITIES;
  return pool.map((activity, index) => ({ ...activity, id: `${cityId}-act-${index}` }));
}
