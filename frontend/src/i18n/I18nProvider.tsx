'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import en from './locales/en.json';
import hi from './locales/hi.json';

export type Locale = 'en' | 'hi';

const DICTIONARIES: Record<Locale, Record<string, unknown>> = { en, hi };
const STORAGE_KEY = 'ecoroute_locale';

function getByPath(dict: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => {
    if (node !== null && typeof node === 'object' && key in (node as Record<string, unknown>)) {
      return (node as Record<string, unknown>)[key];
    }
    return undefined;
  }, dict);
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Dot-path lookup with {placeholder} interpolation. Falls back to the
   * English string (never a raw key or blank UI) if a Hindi translation
   * is somehow missing, then to the key itself as a last resort. */
  t: (path: string, vars?: Record<string, string | number>) => string;
  /** Raw namespace accessor for structured content (arrays of objects,
   * etc.) that a flat t() string lookup doesn't fit well. */
  tRaw: <T = unknown>(path: string) => T;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'hi') {
        setLocaleState(stored);
        return;
      }
      if (navigator.language?.toLowerCase().startsWith('hi')) {
        setLocaleState('hi');
      }
    } catch {
      // localStorage unavailable (private mode, etc.) -- default 'en' stands.
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Non-fatal: the choice just won't persist across reloads.
    }
  }, []);

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) => {
      const value = getByPath(DICTIONARIES[locale], path) ?? getByPath(DICTIONARIES.en, path);
      if (typeof value !== 'string') return path;
      return interpolate(value, vars);
    },
    [locale],
  );

  const tRaw = useCallback(
    <T = unknown,>(path: string): T => {
      const value = getByPath(DICTIONARIES[locale], path) ?? getByPath(DICTIONARIES.en, path);
      return value as T;
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t, tRaw }), [locale, setLocale, t, tRaw]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider');
  return ctx;
}
