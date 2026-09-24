'use client';

import { useEffect, useState } from 'react';
import { getWeather, type WeatherSnapshot } from '@/lib/destinationApi';
import { weatherCodeInfo } from '@/lib/weatherCodes';
import { useI18n } from '@/i18n/I18nProvider';

interface WeatherWidgetProps {
  latitude: number;
  longitude: number;
}

export function WeatherWidget({ latitude, longitude }: WeatherWidgetProps) {
  const { t, locale } = useI18n();
  const [weather, setWeather] = useState<WeatherSnapshot | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getWeather(latitude, longitude).then((result) => {
      if (!cancelled) setWeather(result);
    });
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  // No live weather available -- say nothing rather than showing a
  // fabricated "sunny and 24C" placeholder.
  if (!weather) return null;

  const current = weatherCodeInfo(weather.currentWeatherCode);
  const dayFmt = new Intl.DateTimeFormat(locale === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'short' });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">{t('weather.heading')}</h3>
      <div className="flex items-center gap-3">
        <current.icon className="h-9 w-9 text-emerald-600" />
        <div>
          <p className="text-2xl font-semibold text-slate-900">{Math.round(weather.currentTempC)}°C</p>
          <p className="text-xs text-slate-500">{t(current.labelKey)}</p>
        </div>
      </div>
      {weather.daily.length > 0 && (
        <div className="mt-4 grid grid-cols-6 gap-1.5 border-t border-slate-100 pt-4">
          {weather.daily.map((day) => {
            const info = weatherCodeInfo(day.weatherCode);
            return (
              <div key={day.date} className="flex flex-col items-center gap-1 text-center">
                <span className="text-[10px] font-medium uppercase text-slate-400">{dayFmt.format(new Date(day.date))}</span>
                <info.icon className="h-4 w-4 text-slate-500" />
                <span className="text-[11px] text-slate-600">{Math.round(day.maxC)}°</span>
                <span className="text-[11px] text-slate-400">{Math.round(day.minC)}°</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
