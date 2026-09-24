'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchUsdToInrRate, type UsdInrRate } from './currencyApi';
import { useI18n } from '@/i18n/I18nProvider';

interface CurrencyContextValue {
  rate: UsdInrRate | null;
  loading: boolean;
  /** Converts a USD amount to rupees using the live/cached rate, or null
   * if no rate is available at all (never a fabricated conversion). */
  toInr: (usdAmount: number) => number | null;
  /** Formats a USD amount as a rupee string. Falls back to an honest
   * USD-denominated string, labeled as such, when no rate is available. */
  formatInr: (usdAmount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [rate, setRate] = useState<UsdInrRate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchUsdToInrRate()
      .then((r) => {
        if (!cancelled) setRate(r);
      })
      .catch(() => {
        // No live or cached rate available anywhere -- formatInr/toInr
        // honestly fall back to USD below rather than guessing a number.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<CurrencyContextValue>(() => {
    const toInr = (usdAmount: number): number | null => (rate ? usdAmount * rate.usdToInr : null);
    const formatInr = (usdAmount: number): string => {
      const inr = toInr(usdAmount);
      return inr !== null
        ? inrFormatter.format(inr)
        : t('currency.liveRateUnavailable', { usd: usdFormatter.format(usdAmount) });
    };
    return { rate, loading, toInr, formatInr };
  }, [rate, loading, t]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
}
