'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { IndianRupee } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useCurrency } from '@/lib/CurrencyProvider';
import type { CostBreakdown } from '@/types';

interface CostDashboardProps {
  cost: CostBreakdown;
}

export function CostDashboard({ cost }: CostDashboardProps) {
  const { t } = useI18n();
  const { formatInr, rate } = useCurrency();

  const data = [
    { name: t('costDashboard.transport'), usd: cost.transport_usd },
    { name: t('costDashboard.accommodation'), usd: cost.accommodation_usd },
    { name: t('costDashboard.activities'), usd: cost.activity_usd },
    { name: t('costDashboard.total'), usd: cost.total_usd },
  ];

  return (
    <div className="card-hover glass-card h-full rounded-xl p-5">
      <h2 className="mb-4 flex items-center gap-1.5 text-lg font-semibold text-slate-900">
        <IndianRupee className="h-4 w-4 text-emerald-600" />
        {t('costDashboard.heading')}
      </h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <defs>
              <linearGradient id="costBarFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value: number) => (rate ? `₹${Math.round(value * rate.usdToInr)}` : `$${value}`)}
            />
            <Tooltip
              cursor={{ fill: 'rgba(2, 132, 199, 0.06)' }}
              formatter={(value: number) => [formatInr(value), t('costDashboard.amount')]}
            />
            <Bar dataKey="usd" fill="url(#costBarFill)" radius={[6, 6, 0, 0]} animationDuration={800} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
