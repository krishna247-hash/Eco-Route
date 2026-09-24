/* Live weather, via Open-Meteo -- free, keyless, no API key or partner
 * agreement needed (same family of provider as this project's other
 * free/keyless APIs). Real current conditions and a real short forecast
 * for the destination's coordinates -- never a fabricated "sunny and 24C"
 * placeholder. Short cache TTL since weather actually changes; an honest
 * null (widget simply doesn't render) rather than a guess when the
 * provider is unreachable. */

import { getCached, setCached } from "./cache.service";

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
const REQUEST_TIMEOUT_MS = 6000;
const CACHE_TTL_SECONDS = 60 * 60; // 1 hour -- current conditions shouldn't go stale much longer than that

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
  const cacheKey = `weather:${lat.toFixed(2)}:${lon.toFixed(2)}`;
  const cached = await getCached<WeatherSnapshot>(cacheKey);
  if (cached) return cached;

  const url = `${OPEN_METEO_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=6`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
      daily?: { time?: string[]; temperature_2m_max?: number[]; temperature_2m_min?: number[]; weather_code?: number[] };
    };

    if (data.current?.temperature_2m === undefined || data.current?.weather_code === undefined) {
      return null;
    }

    const dailyTimes = data.daily?.time ?? [];
    const daily: DailyForecast[] = dailyTimes.map((date, i) => ({
      date,
      maxC: data.daily!.temperature_2m_max![i],
      minC: data.daily!.temperature_2m_min![i],
      weatherCode: data.daily!.weather_code![i],
    }));

    const snapshot: WeatherSnapshot = {
      currentTempC: data.current.temperature_2m,
      currentWeatherCode: data.current.weather_code,
      daily,
    };
    await setCached(cacheKey, snapshot, CACHE_TTL_SECONDS);
    return snapshot;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
