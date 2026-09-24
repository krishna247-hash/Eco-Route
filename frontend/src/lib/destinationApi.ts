const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export interface DestinationSummary {
  title: string;
  extract: string;
  photoUrl?: string;
  wikipediaUrl?: string;
}

export interface Attraction {
  name: string;
  photoUrl?: string;
  distanceFromCenterKm: number;
}

export async function getDestinationSummary(name: string): Promise<DestinationSummary | null> {
  const response = await fetch(`${API_BASE_URL}/api/v1/destinations/${encodeURIComponent(name)}/summary`);
  if (!response.ok) return null;
  const data = (await response.json()) as { summary: DestinationSummary | null };
  return data.summary;
}

export interface DailyForecast {
  date: string;
  maxC: number;
  minC: number;
  weatherCode: number;
}

export interface WeatherSnapshot {
  currentTempC: number;
  currentWeatherCode: number;
  daily: DailyForecast[];
}

export async function getWeather(lat: number, lon: number): Promise<WeatherSnapshot | null> {
  const response = await fetch(`${API_BASE_URL}/api/v1/destinations/weather?lat=${lat}&lon=${lon}`);
  if (!response.ok) return null;
  const data = (await response.json()) as { weather: WeatherSnapshot | null };
  return data.weather;
}

export async function getFamousPlaces(name: string, lat: number, lon: number): Promise<Attraction[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/destinations/${encodeURIComponent(name)}/attractions?lat=${lat}&lon=${lon}`,
  );
  if (!response.ok) return [];
  const data = (await response.json()) as { attractions: Attraction[] };
  return data.attractions;
}
