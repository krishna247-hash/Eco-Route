import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  type LucideIcon,
} from 'lucide-react';

/** WMO weather codes, as returned by Open-Meteo -- mapped to an icon and
 * an i18n key for a short label. https://open-meteo.com/en/docs */
export function weatherCodeInfo(code: number): { icon: LucideIcon; labelKey: string } {
  if (code === 0) return { icon: Sun, labelKey: 'weather.clearSky' };
  if (code <= 2) return { icon: CloudSun, labelKey: 'weather.partlyCloudy' };
  if (code === 3) return { icon: Cloud, labelKey: 'weather.overcast' };
  if (code === 45 || code === 48) return { icon: CloudFog, labelKey: 'weather.fog' };
  if (code >= 51 && code <= 57) return { icon: CloudDrizzle, labelKey: 'weather.drizzle' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { icon: CloudRain, labelKey: 'weather.rain' };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { icon: CloudSnow, labelKey: 'weather.snow' };
  if (code === 95 || code === 96 || code === 99) return { icon: CloudLightning, labelKey: 'weather.thunderstorm' };
  return { icon: Cloud, labelKey: 'weather.overcast' };
}
