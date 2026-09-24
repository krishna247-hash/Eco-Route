import type { Metadata } from 'next';
import './globals.css';
import { I18nProvider } from '@/i18n/I18nProvider';
import { CurrencyProvider } from '@/lib/CurrencyProvider';
import { SiteChrome } from '@/components/layout/SiteChrome';

export const metadata: Metadata = {
  title: 'EcoRoute | AI-Driven Sustainable Travel Planning',
  description:
    'Multi-objective carbon optimization platform for intelligent, carbon-aware travel itineraries.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        <I18nProvider>
          <CurrencyProvider>
            <SiteChrome>{children}</SiteChrome>
          </CurrencyProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
