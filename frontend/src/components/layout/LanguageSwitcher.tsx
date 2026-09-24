'use client';

import { useI18n } from '@/i18n/I18nProvider';

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium">
      <button
        type="button"
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
        className={`rounded-md px-2 py-1 transition-colors ${
          locale === 'en' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale('hi')}
        aria-pressed={locale === 'hi'}
        className={`rounded-md px-2 py-1 transition-colors ${
          locale === 'hi' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        हिं
      </button>
    </div>
  );
}
