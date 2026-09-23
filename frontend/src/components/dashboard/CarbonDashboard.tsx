'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CarbonBreakdown } from '@/types';

interface CarbonDashboardProps {
  carbon: CarbonBreakdown;
}

export function CarbonDashboard({ carbon }: CarbonDashboardProps) {
  const data = [
    { name: 'Transport', kgCo2e: carbon.transport_co2e },
    { name: 'Accommodation', kgCo2e: carbon.accommodation_co2e },
    { name: 'Activities', kgCo2e: carbon.activity_co2e },
    { name: 'Total', kgCo2e: carbon.total_co2e },
  ];

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Carbon breakdown</h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} unit=" kg" />
            <Tooltip formatter={(value: number) => [`${value.toFixed(1)} kg CO2e`, 'Emissions']} />
            <Bar dataKey="kgCo2e" fill="#059669" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
