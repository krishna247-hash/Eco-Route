// Geo, transit & certified eco-hotel catalog — the destination database
// consumed by the trip wizard, the Pareto optimizer, and the route map.

import { Activity, HotelTier } from '@/lib/types';

export interface City {
  id: string;
  name: string;
  country: string;
  coords: { lat: number; lng: number };
  description: string;
  attractions: Activity[];
  hotelNames: Record<HotelTier, string>;
}

function attraction(
  city: string,
  id: string,
  name: string,
  category: string,
  description: string,
  durationHours: number,
  cost: number,
  carbonKg: number,
  offsetLat: number,
  offsetLng: number,
  baseCoords: { lat: number; lng: number }
): Activity {
  return {
    id: `${city}-${id}`,
    name,
    category,
    description,
    durationHours,
    cost,
    carbonKg,
    coords: { lat: baseCoords.lat + offsetLat, lng: baseCoords.lng + offsetLng },
  };
}

const PARIS_COORDS = { lat: 48.8566, lng: 2.3522 };
const AMSTERDAM_COORDS = { lat: 52.3676, lng: 4.9041 };
const BERLIN_COORDS = { lat: 52.52, lng: 13.405 };
const BARCELONA_COORDS = { lat: 41.3851, lng: 2.1734 };
const ROME_COORDS = { lat: 41.9028, lng: 12.4964 };
const VIENNA_COORDS = { lat: 48.2082, lng: 16.3738 };
const PRAGUE_COORDS = { lat: 50.0755, lng: 14.4378 };
const ZURICH_COORDS = { lat: 47.3769, lng: 8.5417 };

export const POPULAR_CITIES: City[] = [
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    coords: PARIS_COORDS,
    description: 'The City of Light, served by an extensive electrified TGV rail network.',
    attractions: [
      attraction('paris', 'louvre', 'The Louvre Museum', 'Culture', 'World-renowned art museum, reachable via Metro.', 2.5, 20, 0.4, 0.001, 0.002, PARIS_COORDS),
      attraction('paris', 'seine', 'Seine River Walking Tour', 'Nature', 'Self-guided riverside walk with zero-emission travel.', 2, 0, 0, -0.004, 0.005, PARIS_COORDS),
      attraction('paris', 'montmartre', 'Montmartre & Sacré-Cœur', 'Landmark', 'Hilltop basilica and artist quarter, accessible on foot.', 2, 5, 0.1, 0.012, -0.004, PARIS_COORDS),
      attraction('paris', 'orsay', "Musée d'Orsay", 'Culture', 'Impressionist masterpieces in a converted railway station.', 1.5, 16, 0.3, -0.006, -0.001, PARIS_COORDS),
    ],
    hotelNames: {
      eco_hostel: 'Green Marais Eco-Hostel',
      eco_hotel: 'Hôtel Vert Rive Gauche',
      standard_hotel: 'Hôtel Central Paris',
      luxury_resort: 'Palace Champs-Élysées Resort & Spa',
    },
  },
  {
    id: 'amsterdam',
    name: 'Amsterdam',
    country: 'Netherlands',
    coords: AMSTERDAM_COORDS,
    description: 'A cycling-first capital powered heavily by wind and grid electricity.',
    attractions: [
      attraction('amsterdam', 'rijks', 'Rijksmuseum', 'Culture', 'Dutch Golden Age masterpieces in the museum quarter.', 2.5, 22, 0.3, 0.003, 0.004, AMSTERDAM_COORDS),
      attraction('amsterdam', 'canal', 'Canal Ring Bike Tour', 'Outdoor', 'UNESCO canal belt explored by rented bicycle.', 2, 12, 0, -0.005, 0.007, AMSTERDAM_COORDS),
      attraction('amsterdam', 'vondelpark', 'Vondelpark Picnic & Stroll', 'Nature', 'Green urban park, ideal for a zero-carbon afternoon.', 1.5, 0, 0, 0.007, -0.006, AMSTERDAM_COORDS),
      attraction('amsterdam', 'anne-frank', 'Anne Frank House', 'Landmark', 'Historic museum on the Prinsengracht canal.', 1.5, 18, 0.2, -0.002, -0.003, AMSTERDAM_COORDS),
    ],
    hotelNames: {
      eco_hostel: 'Canal Green Hostel',
      eco_hotel: 'Hotel Jordaan Eco Lodge',
      standard_hotel: 'Amsterdam City Centre Hotel',
      luxury_resort: 'Grand Herengracht Resort',
    },
  },
  {
    id: 'berlin',
    name: 'Berlin',
    country: 'Germany',
    coords: BERLIN_COORDS,
    description: 'A rail hub with an extensive electrified S-Bahn and U-Bahn network.',
    attractions: [
      attraction('berlin', 'brandenburg', 'Brandenburg Gate', 'Landmark', 'Iconic neoclassical monument in Mitte.', 1, 0, 0, 0.001, 0.002, BERLIN_COORDS),
      attraction('berlin', 'museum-island', 'Museum Island', 'Culture', 'UNESCO cluster of five world-class museums.', 3, 24, 0.4, 0.004, -0.003, BERLIN_COORDS),
      attraction('berlin', 'tiergarten', 'Tiergarten Park Cycle', 'Outdoor', 'Central park loop by rented e-bike.', 1.5, 8, 0.1, -0.006, 0.004, BERLIN_COORDS),
      attraction('berlin', 'eastside', 'East Side Gallery', 'Culture', 'Open-air mural gallery on the former Berlin Wall.', 1.5, 0, 0, 0.01, 0.015, BERLIN_COORDS),
    ],
    hotelNames: {
      eco_hostel: 'Kreuzberg Green Hostel',
      eco_hotel: 'Hotel Mitte Sustainable Suites',
      standard_hotel: 'Berlin Central Hotel',
      luxury_resort: 'Unter den Linden Grand Resort',
    },
  },
  {
    id: 'barcelona',
    name: 'Barcelona',
    country: 'Spain',
    coords: BARCELONA_COORDS,
    description: 'Mediterranean coastal city with high-speed AVE rail connections.',
    attractions: [
      attraction('barcelona', 'sagrada', 'Sagrada Família', 'Landmark', "Gaudí's unfinished basilica masterpiece.", 2, 26, 0.3, 0.006, 0.006, BARCELONA_COORDS),
      attraction('barcelona', 'park-guell', 'Park Güell', 'Nature', 'Mosaic-tiled hillside park with panoramic views.', 2, 10, 0.2, 0.014, -0.002, BARCELONA_COORDS),
      attraction('barcelona', 'gothic', 'Gothic Quarter Walking Tour', 'Culture', 'Medieval alleys explored entirely on foot.', 2, 0, 0, -0.003, -0.006, BARCELONA_COORDS),
      attraction('barcelona', 'barceloneta', 'Barceloneta Beach', 'Outdoor', 'Urban beach walk and cycling promenade.', 1.5, 0, 0.1, -0.008, 0.012, BARCELONA_COORDS),
    ],
    hotelNames: {
      eco_hostel: 'Raval Sustainable Hostel',
      eco_hotel: 'Hotel Born Eco Retreat',
      standard_hotel: 'Barcelona Central Hotel',
      luxury_resort: 'Passeig de Gràcia Grand Resort',
    },
  },
  {
    id: 'rome',
    name: 'Rome',
    country: 'Italy',
    coords: ROME_COORDS,
    description: 'The Eternal City, linked by high-speed Frecciarossa rail.',
    attractions: [
      attraction('rome', 'colosseum', 'Colosseum & Roman Forum', 'Landmark', 'Ancient amphitheatre and forum ruins.', 3, 25, 0.4, 0.001, 0.003, ROME_COORDS),
      attraction('rome', 'vatican', 'Vatican Museums & Sistine Chapel', 'Culture', 'Renaissance art collection including Michelangelo\'s ceiling.', 3, 28, 0.3, 0.004, -0.01, ROME_COORDS),
      attraction('rome', 'trastevere', 'Trastevere Walking Tour', 'Culture', 'Cobblestone streets and trattorias on foot.', 2, 0, 0, -0.005, -0.004, ROME_COORDS),
      attraction('rome', 'villa-borghese', 'Villa Borghese Gardens', 'Nature', 'Landscaped park with rowboats and cycling paths.', 1.5, 6, 0.1, 0.01, 0.005, ROME_COORDS),
    ],
    hotelNames: {
      eco_hostel: 'Monti Green Hostel',
      eco_hotel: 'Hotel Trastevere Eco Suites',
      standard_hotel: 'Rome Central Hotel',
      luxury_resort: 'Via Veneto Grand Resort',
    },
  },
  {
    id: 'vienna',
    name: 'Vienna',
    country: 'Austria',
    coords: VIENNA_COORDS,
    description: 'A green capital with near-total renewable public transit coverage.',
    attractions: [
      attraction('vienna', 'schonbrunn', 'Schönbrunn Palace', 'Landmark', 'Imperial summer residence and gardens.', 2.5, 22, 0.3, 0.008, -0.008, VIENNA_COORDS),
      attraction('vienna', 'stephansdom', "St. Stephen's Cathedral", 'Culture', 'Gothic cathedral in the historic centre.', 1, 6, 0.1, 0.001, 0.001, VIENNA_COORDS),
      attraction('vienna', 'prater', 'Prater Park Cycle', 'Outdoor', 'Historic park loop by bicycle.', 1.5, 5, 0.1, 0.012, 0.014, VIENNA_COORDS),
      attraction('vienna', 'belvedere', 'Belvedere Museum', 'Culture', "Klimt's The Kiss and baroque palace grounds.", 2, 18, 0.2, -0.006, 0.004, VIENNA_COORDS),
    ],
    hotelNames: {
      eco_hostel: 'Neubau Green Hostel',
      eco_hotel: 'Hotel Ringstrasse Eco Lodge',
      standard_hotel: 'Vienna Central Hotel',
      luxury_resort: 'Hofburg Grand Resort & Spa',
    },
  },
  {
    id: 'prague',
    name: 'Prague',
    country: 'Czechia',
    coords: PRAGUE_COORDS,
    description: 'A compact, walkable capital with an electric tram network.',
    attractions: [
      attraction('prague', 'castle', 'Prague Castle', 'Landmark', "Europe's largest ancient castle complex.", 2.5, 15, 0.2, 0.005, -0.009, PRAGUE_COORDS),
      attraction('prague', 'charles-bridge', 'Charles Bridge Walk', 'Culture', 'Gothic stone bridge across the Vltava River.', 1, 0, 0, -0.002, -0.001, PRAGUE_COORDS),
      attraction('prague', 'old-town', 'Old Town Square & Astronomical Clock', 'Culture', 'Medieval square with the famous astronomical clock.', 1.5, 0, 0, 0.002, 0.003, PRAGUE_COORDS),
      attraction('prague', 'petrin', 'Petřín Hill & Gardens', 'Nature', 'Hilltop park reached by funicular.', 2, 4, 0.1, -0.01, -0.012, PRAGUE_COORDS),
    ],
    hotelNames: {
      eco_hostel: 'Zizkov Green Hostel',
      eco_hotel: 'Hotel Vltava Eco Suites',
      standard_hotel: 'Prague Central Hotel',
      luxury_resort: 'Old Town Grand Resort',
    },
  },
  {
    id: 'zurich',
    name: 'Zurich',
    country: 'Switzerland',
    coords: ZURICH_COORDS,
    description: 'Home to a nearly 100% hydro and nuclear-powered rail network.',
    attractions: [
      attraction('zurich', 'altstadt', 'Altstadt Old Town Walk', 'Culture', 'Historic lakeside old town, fully walkable.', 2, 0, 0, 0.001, 0.001, ZURICH_COORDS),
      attraction('zurich', 'lake', 'Lake Zurich Cruise', 'Nature', 'Electric passenger ferry across the lake.', 2, 20, 0.2, -0.008, 0.006, ZURICH_COORDS),
      attraction('zurich', 'kunsthaus', 'Kunsthaus Zürich', 'Culture', 'Leading Swiss museum of fine arts.', 1.5, 23, 0.2, 0.004, -0.005, ZURICH_COORDS),
      attraction('zurich', 'uetliberg', 'Uetliberg Summit Hike', 'Outdoor', "Zurich's local mountain, reached by electric train.", 3, 10, 0.15, 0.02, -0.02, ZURICH_COORDS),
    ],
    hotelNames: {
      eco_hostel: 'Kreis 4 Green Hostel',
      eco_hotel: 'Hotel Limmat Eco Lodge',
      standard_hotel: 'Zurich Central Hotel',
      luxury_resort: 'Bahnhofstrasse Grand Resort',
    },
  },
];

export function getCityById(idOrName: string | undefined | null): City | undefined {
  if (!idOrName) return undefined;
  const normalized = idOrName.trim().toLowerCase();
  return POPULAR_CITIES.find(
    (c) => c.id.toLowerCase() === normalized || c.name.toLowerCase() === normalized
  );
}
