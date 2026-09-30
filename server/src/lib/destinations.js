/**
 * City catalogue, curated low-impact activities and eco-lodging templates.
 * `region` groups cities that are connected by land (rail/road/coach).
 */

export const CITIES = [
  { id: 'nyc', name: 'New York', country: 'United States', region: 'north-america', coords: [40.7128, -74.006] },
  { id: 'boston', name: 'Boston', country: 'United States', region: 'north-america', coords: [42.3601, -71.0589] },
  { id: 'washington', name: 'Washington, D.C.', country: 'United States', region: 'north-america', coords: [38.9072, -77.0369] },
  { id: 'toronto', name: 'Toronto', country: 'Canada', region: 'north-america', coords: [43.6532, -79.3832] },
  { id: 'montreal', name: 'Montreal', country: 'Canada', region: 'north-america', coords: [45.5019, -73.5674] },
  { id: 'sf', name: 'San Francisco', country: 'United States', region: 'north-america', coords: [37.7749, -122.4194] },
  { id: 'la', name: 'Los Angeles', country: 'United States', region: 'north-america', coords: [34.0522, -118.2437] },

  { id: 'london', name: 'London', country: 'United Kingdom', region: 'europe', coords: [51.5074, -0.1278] },
  { id: 'paris', name: 'Paris', country: 'France', region: 'europe', coords: [48.8566, 2.3522] },
  { id: 'amsterdam', name: 'Amsterdam', country: 'Netherlands', region: 'europe', coords: [52.3676, 4.9041] },
  { id: 'brussels', name: 'Brussels', country: 'Belgium', region: 'europe', coords: [50.8503, 4.3517] },
  { id: 'berlin', name: 'Berlin', country: 'Germany', region: 'europe', coords: [52.52, 13.405] },
  { id: 'munich', name: 'Munich', country: 'Germany', region: 'europe', coords: [48.1351, 11.582] },
  { id: 'zurich', name: 'Zurich', country: 'Switzerland', region: 'europe', coords: [47.3769, 8.5417] },
  { id: 'vienna', name: 'Vienna', country: 'Austria', region: 'europe', coords: [48.2082, 16.3738] },
  { id: 'prague', name: 'Prague', country: 'Czechia', region: 'europe', coords: [50.0755, 14.4378] },
  { id: 'barcelona', name: 'Barcelona', country: 'Spain', region: 'europe', coords: [41.3851, 2.1734] },
  { id: 'madrid', name: 'Madrid', country: 'Spain', region: 'europe', coords: [40.4168, -3.7038] },
  { id: 'milan', name: 'Milan', country: 'Italy', region: 'europe', coords: [45.4642, 9.19] },
  { id: 'rome', name: 'Rome', country: 'Italy', region: 'europe', coords: [41.9028, 12.4964] },
  { id: 'copenhagen', name: 'Copenhagen', country: 'Denmark', region: 'europe', coords: [55.6761, 12.5683] },

  { id: 'delhi', name: 'New Delhi', country: 'India', region: 'south-asia', coords: [28.6139, 77.209] },
  { id: 'jaipur', name: 'Jaipur', country: 'India', region: 'south-asia', coords: [26.9124, 75.7873] },
  { id: 'mumbai', name: 'Mumbai', country: 'India', region: 'south-asia', coords: [19.076, 72.8777] },
  { id: 'bengaluru', name: 'Bengaluru', country: 'India', region: 'south-asia', coords: [12.9716, 77.5946] },
  { id: 'chennai', name: 'Chennai', country: 'India', region: 'south-asia', coords: [13.0827, 80.2707] },

  { id: 'tokyo', name: 'Tokyo', country: 'Japan', region: 'japan', coords: [35.6762, 139.6503] },
  { id: 'kyoto', name: 'Kyoto', country: 'Japan', region: 'japan', coords: [35.0116, 135.7681] },
  { id: 'bangkok', name: 'Bangkok', country: 'Thailand', region: 'southeast-asia', coords: [13.7563, 100.5018] },
  { id: 'singapore', name: 'Singapore', country: 'Singapore', region: 'southeast-asia', coords: [1.3521, 103.8198] },
  { id: 'kuala-lumpur', name: 'Kuala Lumpur', country: 'Malaysia', region: 'southeast-asia', coords: [3.139, 101.6869] },

  { id: 'sydney', name: 'Sydney', country: 'Australia', region: 'australia', coords: [-33.8688, 151.2093] },
  { id: 'melbourne', name: 'Melbourne', country: 'Australia', region: 'australia', coords: [-37.8136, 144.9631] },
  { id: 'cairo', name: 'Cairo', country: 'Egypt', region: 'africa', coords: [30.0444, 31.2357] },
  { id: 'cape-town', name: 'Cape Town', country: 'South Africa', region: 'africa-south', coords: [-33.9249, 18.4241] },
  { id: 'sao-paulo', name: 'São Paulo', country: 'Brazil', region: 'south-america', coords: [-23.5505, -46.6333] },
  { id: 'buenos-aires', name: 'Buenos Aires', country: 'Argentina', region: 'south-america', coords: [-34.6037, -58.3816] },
];

const CITY_BY_ID = new Map(CITIES.map((c) => [c.id, c]));

/** Accepts an id ("paris") or a display name ("Paris"). */
export function findCity(idOrName) {
  if (!idOrName) return undefined;
  const key = String(idOrName).trim().toLowerCase();
  return CITY_BY_ID.get(key) ?? CITIES.find((c) => c.name.toLowerCase() === key);
}

/** Curated, city-specific low-carbon activities. */
const CURATED_ACTIVITIES = {
  paris: [
    ['Seine Riverside Cycling Loop', 'outdoor', 'Vélib’ e-bike tour along the quays past Notre-Dame and the Louvre.', 3, 18, 0.2],
    ['Musée d’Orsay', 'culture', 'Impressionist masterpieces in a restored Beaux-Arts railway station.', 3, 16, 1.2],
    ['Marais Walking Food Tour', 'food', 'Seasonal, vegetarian-forward bites from local producers.', 2.5, 45, 1.8],
    ['Jardin du Luxembourg Picnic', 'outdoor', 'Zero-waste picnic with market produce.', 2, 12, 0.6],
  ],
  amsterdam: [
    ['Canal Ring Bike Tour', 'outdoor', 'Explore the UNESCO canal belt the Dutch way.', 3, 25, 0.1],
    ['Rijksmuseum', 'culture', 'Rembrandt and Vermeer in the national museum.', 3, 25, 1.1],
    ['Electric Canal Boat Cruise', 'outdoor', 'Silent, battery-powered cruise through the canals.', 1.5, 20, 0.4],
    ['De Hallen Food Hall', 'food', 'Local, plant-forward street food in a converted tram depot.', 2, 30, 1.5],
  ],
  london: [
    ['Thames Path Walk', 'outdoor', 'Westminster to Tower Bridge on foot.', 3, 0, 0],
    ['British Museum', 'culture', 'Free entry to two million years of human history.', 3, 0, 1.0],
    ['Borough Market Tasting', 'food', 'Seasonal British produce and street food.', 2, 30, 1.6],
    ['Kew Gardens', 'outdoor', 'World-leading botanical conservation gardens.', 4, 28, 0.5],
  ],
  berlin: [
    ['Berlin Wall Memorial Bike Ride', 'culture', 'Cycle the Mauerweg history trail.', 3, 20, 0.1],
    ['Museum Island', 'culture', 'Five world-class museums on the Spree.', 4, 24, 1.3],
    ['Tempelhofer Feld', 'outdoor', 'Picnic on a former airport runway turned park.', 2, 0, 0],
  ],
  rome: [
    ['Ancient Rome Walking Tour', 'culture', 'Colosseum, Forum and Palatine Hill on foot.', 4, 22, 0.5],
    ['Trastevere Food Walk', 'food', 'Neighbourhood trattorias and seasonal Roman dishes.', 2.5, 40, 1.8],
    ['Villa Borghese Gardens', 'outdoor', 'Rowboats and shaded paths in Rome’s central park.', 2, 5, 0.1],
  ],
  barcelona: [
    ['Gothic Quarter Walk', 'culture', 'Medieval lanes and Roman ruins.', 2.5, 0, 0],
    ['Sagrada Família', 'culture', 'Gaudí’s unfinished basilica.', 2, 30, 1.0],
    ['Montjuïc Cable Car & Gardens', 'outdoor', 'Electric cable car to panoramic gardens.', 3, 15, 0.4],
  ],
  delhi: [
    ['Old Delhi Heritage Walk', 'culture', 'Chandni Chowk, Jama Masjid and spice markets on foot.', 3, 10, 0.2],
    ['Lodhi Garden Morning Walk', 'outdoor', '15th-century tombs amid 90 acres of greenery.', 2, 0, 0],
    ['Humayun’s Tomb', 'culture', 'UNESCO-listed Mughal garden tomb.', 2, 7, 0.5],
    ['Vegetarian Thali Experience', 'food', 'Traditional plant-based North Indian meal.', 1.5, 8, 0.9],
  ],
  jaipur: [
    ['Amber Fort (by e-rickshaw)', 'culture', 'Hilltop Rajput fort reached by electric rickshaw.', 3, 8, 0.3],
    ['Pink City Heritage Walk', 'culture', 'Hawa Mahal and bazaars of the walled city.', 2.5, 5, 0.1],
    ['Block-Printing Workshop', 'culture', 'Hands-on craft with natural dyes in Sanganer.', 2, 15, 0.4],
  ],
  mumbai: [
    ['Colaba & Fort Heritage Walk', 'culture', 'Gothic and Art Deco landmarks on foot.', 2.5, 5, 0.1],
    ['Sanjay Gandhi National Park', 'outdoor', 'Kanheri caves and forest trails inside the city.', 4, 3, 0.2],
    ['Local Train Street-Food Trail', 'food', 'Vada pav and chaat via suburban rail.', 2, 8, 0.8],
  ],
  tokyo: [
    ['Meiji Shrine Forest Walk', 'outdoor', 'Shaded forest paths in central Tokyo.', 2, 0, 0],
    ['Yanaka Old Town Walk', 'culture', 'Temples and craft shops of old Edo.', 2.5, 0, 0.1],
    ['Shojin Ryori Lunch', 'food', 'Buddhist temple vegan cuisine.', 1.5, 35, 0.8],
  ],
  kyoto: [
    ['Arashiyama Bamboo Grove', 'outdoor', 'Early-morning walk through the bamboo forest.', 2, 0, 0],
    ['Fushimi Inari Hike', 'outdoor', 'Thousands of torii gates up Mount Inari.', 3, 0, 0],
    ['Tea Ceremony', 'culture', 'Traditional matcha ceremony in a machiya.', 1.5, 30, 0.3],
  ],
  nyc: [
    ['High Line & Hudson Yards Walk', 'outdoor', 'Elevated park on a former freight line.', 2, 0, 0],
    ['The Met', 'culture', '5,000 years of art on Museum Mile.', 3, 30, 1.3],
    ['Central Park Citi Bike Loop', 'outdoor', 'Six-mile loop by bike share.', 2, 15, 0.1],
  ],
};

const GENERIC_ACTIVITIES = [
  ['{city} Old Town Walking Tour', 'culture', 'Guided heritage walk through historic neighbourhoods.', 2.5, 15, 0.2],
  ['{city} City Museum', 'culture', 'Local history and art collections.', 2.5, 18, 1.1],
  ['{city} Bike-Share Discovery Ride', 'outdoor', 'Self-guided ride on the public bike-share network.', 2, 12, 0.1],
  ['Farmers’ Market & Plant-Based Lunch', 'food', 'Seasonal produce from regional growers.', 2, 25, 1.0],
  ['{city} Urban Park & Botanical Garden', 'outdoor', 'Green spaces and native flora.', 2, 5, 0.1],
];

/** Deterministic small offset so activities spread around the city centre on the map. */
function offsetCoords([lat, lng], i) {
  const angle = (i * 137.5 * Math.PI) / 180;
  const r = 0.012 + 0.006 * (i % 3);
  return [+(lat + r * Math.cos(angle)).toFixed(5), +(lng + r * Math.sin(angle)).toFixed(5)];
}

export function getActivities(city) {
  const rows = CURATED_ACTIVITIES[city.id] ?? GENERIC_ACTIVITIES;
  return rows.map(([name, category, description, durationHours, cost, carbonKg], i) => ({
    id: `${city.id}-act-${i}`,
    name: name.replace('{city}', city.name),
    category,
    description,
    durationHours,
    cost,
    carbonKg,
    coords: offsetCoords(city.coords, i),
  }));
}

const LODGING_TEMPLATES = {
  eco_hotel: {
    name: '{city} Green Key Eco Hotel',
    ecoCertifications: ['Green Key', 'LEED Gold'],
    sustainabilityHighlights: ['100% renewable electricity', 'Zero single-use plastic', 'Local organic breakfast'],
    ecoScore: 'A+',
  },
  hostel: {
    name: '{city} Eco Hostel & Guesthouse',
    ecoCertifications: ['GSTC Recognised'],
    sustainabilityHighlights: ['Solar hot water', 'Shared low-energy facilities', 'Bike rental on site'],
    ecoScore: 'A',
  },
  standard_hotel: {
    name: '{city} Central City Hotel',
    ecoCertifications: [],
    sustainabilityHighlights: ['Towel re-use programme', 'LED lighting'],
    ecoScore: 'C',
  },
  luxury_hotel: {
    name: 'The Grand {city} Resort',
    ecoCertifications: [],
    sustainabilityHighlights: ['Spa & heated pool', 'Daily linen service'],
    ecoScore: 'D',
  },
};

export function getLodging(city, tier, factors) {
  const t = LODGING_TEMPLATES[tier];
  const f = factors[tier];
  return {
    tier,
    name: t.name.replace('{city}', city.name),
    rating: f.rating,
    pricePerNight: f.pricePerNight,
    carbonKgPerNight: f.factor,
    ecoCertifications: t.ecoCertifications,
    sustainabilityHighlights: t.sustainabilityHighlights,
    ecoScore: t.ecoScore,
    coords: offsetCoords(city.coords, 7),
  };
}
