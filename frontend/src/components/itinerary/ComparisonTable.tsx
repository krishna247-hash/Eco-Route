'use client';

import { Leaf, Scale, DollarSign, Zap, Target, Car, TrainFront, Bus, Plane } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import type { ItineraryLabel, ItineraryOption } from '@/types';

interface ComparisonTableProps {
  options: ItineraryOption[];
}

const LABEL_ICON: Record<ItineraryLabel, typeof Leaf> = {
  LOW_CARBON: Leaf,
  BALANCED: Scale,
  LOW_COST: DollarSign,
  TIME_EFFICIENT: Zap,
  PREFERENCE_FOCUSED: Target,
};

const LABEL_STYLE: Record<ItineraryLabel, { accent: string; bg: string }> = {
  LOW_CARBON: { accent: 'text-emerald-600', bg: 'bg-emerald-600' },
  BALANCED: { accent: 'text-teal-600', bg: 'bg-teal-600' },
  LOW_COST: { accent: 'text-amber-600', bg: 'bg-amber-600' },
  TIME_EFFICIENT: { accent: 'text-sky-600', bg: 'bg-sky-600' },
  PREFERENCE_FOCUSED: { accent: 'text-violet-600', bg: 'bg-violet-600' },
};

const TRANSPORT_ICON: Record<string, typeof Car> = {
  car: Car,
  train: TrainFront,
  bus: Bus,
  flight: Plane,
};

export function ComparisonTable({ options }: ComparisonTableProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-10">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => {
          const Icon = LABEL_ICON[option.label] ?? LABEL_ICON.BALANCED;
          const style = LABEL_STYLE[option.label] ?? LABEL_STYLE.BALANCED;
          const text = t(`labels.${option.label}`);
          const TransportIcon = TRANSPORT_ICON[option.transportMode] ?? Car;
          return (
            <div key={option.id} className="card-hover glass-card overflow-hidden rounded-2xl">
              <div className={`h-1.5 w-full ${style.bg}`} />
              <div className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${style.bg} text-white`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{text}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <TransportIcon className="h-3 w-3" />
                      {t(`planForm.transportOptions.${option.transportMode}`)} ·{' '}
                      {t(`planForm.accommodationOptions.${option.accommodationTier}`)}
                    </p>
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-slate-50 py-2">
                    <p className="text-sm font-semibold text-slate-900">{option.carbon.total_co2e.toFixed(0)}</p>
                    <p className="text-[10px] uppercase text-slate-500">kg CO2e</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 py-2">
                    <p className="text-sm font-semibold text-slate-900">${option.costUsd.toFixed(0)}</p>
                    <p className="text-[10px] uppercase text-slate-500">{t('compare.tableHeaders.cost')}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 py-2">
                    <p className="text-sm font-semibold text-slate-900">{option.durationHrs.toFixed(1)}h</p>
                    <p className="text-[10px] uppercase text-slate-500">{t('compare.tableHeaders.duration')}</p>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-slate-600">{option.explanation}</p>

                <div className="mt-4 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${style.bg}`}
                      style={{ width: `${Math.round(option.preferenceScore * 100)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-semibold ${style.accent}`}>
                    {Math.round(option.preferenceScore * 100)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-card overflow-x-auto rounded-2xl p-2">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                {t('compare.tableHeaders.strategy')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                {t('compare.tableHeaders.carbon')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                {t('compare.tableHeaders.cost')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                {t('compare.tableHeaders.duration')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                {t('compare.tableHeaders.match')}
              </th>
            </tr>
          </thead>
          <tbody>
            {options.map((option) => {
              const Icon = LABEL_ICON[option.label] ?? LABEL_ICON.BALANCED;
              const style = LABEL_STYLE[option.label] ?? LABEL_STYLE.BALANCED;
              return (
                <tr key={option.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/80">
                  <td className="flex items-center gap-2 px-4 py-3 font-medium text-slate-900">
                    <Icon className={`h-3.5 w-3.5 ${style.accent}`} />
                    {t(`labels.${option.label}`)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{option.carbon.total_co2e.toFixed(1)} kg</td>
                  <td className="px-4 py-3 text-slate-700">${option.costUsd.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-700">{option.durationHrs.toFixed(1)} h</td>
                  <td className="px-4 py-3 text-slate-700">{Math.round(option.preferenceScore * 100)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
