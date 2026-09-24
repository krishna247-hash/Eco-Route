'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Leaf, Compass, Map, Sparkles } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ChatWidget } from '@/components/chat/ChatWidget';

export function SiteChrome({ children }: { children: ReactNode }) {
  const { t } = useI18n();

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xl tracking-tight text-slate-900">EcoRoute</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 -mt-0.5 hidden sm:block">{t('nav.brandTagline')}</p>
            </div>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/plan"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 hover:text-emerald-600 hover:bg-emerald-50/60 rounded-lg transition-colors"
            >
              <Compass className="w-4 h-4 text-emerald-600" />
              <span>{t('nav.tripPlanner')}</span>
            </Link>
            <Link
              href="/map"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 hover:text-emerald-600 hover:bg-emerald-50/60 rounded-lg transition-colors"
            >
              <Map className="w-4 h-4 text-emerald-600" />
              <span>{t('nav.exploreMap')}</span>
            </Link>
            <Link
              href="/plan"
              className="hidden md:flex items-center gap-1.5 ml-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-lg shadow-sm shadow-emerald-600/20 transition-all hover:shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('nav.generateItinerary')}</span>
            </Link>
            <div className="ml-1 sm:ml-2">
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200 bg-white py-8 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center text-white">
              <Leaf className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-800">{t('footer.org')}</span>
            <span>{t('footer.tagline')}</span>
          </div>
          <p className="text-slate-400">{t('footer.compliance')}</p>
        </div>
      </footer>

      <ChatWidget />
    </>
  );
}
