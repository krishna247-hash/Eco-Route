'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, Compass, Map, Sparkles, MapPinned, Hotel, Bookmark, MessageCircle, Menu, X } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ChatWidget } from '@/components/chat/ChatWidget';

export function SiteChrome({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NAV_LINKS = [
    { href: '/destinations', label: t('nav.destinations'), icon: MapPinned },
    { href: '/hotels', label: t('nav.hotels'), icon: Hotel },
    { href: '/map', label: t('nav.exploreMap'), icon: Map },
    { href: '/my-trips', label: t('nav.myTrips'), icon: Bookmark },
    { href: '/assistant', label: t('nav.assistant'), icon: MessageCircle },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">EcoRoute</span>
              <p className="-mt-0.5 hidden text-[11px] text-slate-500 sm:block">{t('nav.brandTagline')}</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href || pathname?.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-emerald-50/60 hover:text-emerald-600'
                  }`}
                >
                  <link.icon className="h-4 w-4 text-emerald-600" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <Link
              href="/plan"
              className="ml-2 flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t('nav.generateItinerary')}</span>
            </Link>
            <div className="ml-2">
              <LanguageSwitcher />
            </div>
          </nav>

          <div className="flex items-center gap-2 lg:hidden">
            <Link
              href="/plan"
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <Compass className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('nav.tripPlanner')}</span>
            </Link>
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-slate-200 bg-white px-4 py-2 lg:hidden">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50/60 hover:text-emerald-600"
              >
                <link.icon className="h-4 w-4 text-emerald-600" />
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:px-6 md:flex-row lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-600 text-white">
              <Leaf className="h-3.5 w-3.5" />
            </div>
            <span className="font-semibold text-slate-800">{t('footer.org')}</span>
            <span>{t('footer.tagline')}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-slate-700">
              {t('nav.about')}
            </Link>
            <p className="text-slate-400">{t('footer.compliance')}</p>
          </div>
        </div>
      </footer>

      <ChatWidget />
    </>
  );
}
