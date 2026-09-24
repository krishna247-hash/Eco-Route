'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import type { CarbonBreakdown } from '@/types';

interface CarbonDashboardProps {
  carbon: CarbonBreakdown;
}

export function CarbonDashboard({ carbon }: CarbonDashboardProps) {
  const { t } = useI18n();
  const data = [
    { name: t('carbonDashboard.transport'), kgCo2e: carbon.transport_co2e },
    { name: t('carbonDashboard.accommodation'), kgCo2e: carbon.accommodation_co2e },
    { name: t('carbonDashboard.activities'), kgCo2e: carbon.activity_co2e },
    { name: t('carbonDashboard.total'), kgCo2e: carbon.total_co2e },
  ];

  return (
    <div className="card-hover glass-card h-full rounded-xl p-5">
      <h2 className="mb-4 flex items-center gap-1.5 text-lg font-semibold text-slate-900">
        <BarChart3 className="h-4 w-4 text-emerald-600" />
        {t('carbonDashboard.heading')}
      </h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <defs>
              <linearGradient id="carbonBarFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0d9488" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} unit=" kg" />
            <Tooltip
              cursor={{ fill: 'rgba(16, 185, 129, 0.06)' }}
              formatter={(value: number) => [`${value.toFixed(1)} kg CO2e`, t('carbonDashboard.emissions')]}
            />
            <Bar dataKey="kgCo2e" fill="url(#carbonBarFill)" radius={[6, 6, 0, 0]} animationDuration={800} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
