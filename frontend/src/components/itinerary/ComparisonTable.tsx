import { Leaf, Scale, DollarSign, Zap, Target, Car, TrainFront, Bus, Plane, Hotel } from 'lucide-react';
import type { ItineraryLabel, ItineraryOption } from '@/types';

interface ComparisonTableProps {
  options: ItineraryOption[];
}

const LABEL_META: Record<ItineraryLabel, { text: string; icon: typeof Leaf; accent: string; bg: string }> = {
  LOW_CARBON: { text: 'Low Carbon', icon: Leaf, accent: 'text-emerald-600', bg: 'from-emerald-500 to-emerald-600' },
  BALANCED: { text: 'Balanced', icon: Scale, accent: 'text-teal-600', bg: 'from-teal-500 to-teal-600' },
  LOW_COST: { text: 'Low Cost', icon: DollarSign, accent: 'text-amber-600', bg: 'from-amber-500 to-amber-600' },
  TIME_EFFICIENT: { text: 'Time Efficient', icon: Zap, accent: 'text-sky-600', bg: 'from-sky-500 to-sky-600' },
  PREFERENCE_FOCUSED: {
    text: 'Preference Focused',
    icon: Target,
    accent: 'text-violet-600',
    bg: 'from-violet-500 to-violet-600',
  },
};

const TRANSPORT_ICON: Record<string, typeof Car> = {
  car: Car,
  train: TrainFront,
  bus: Bus,
  flight: Plane,
};

export function ComparisonTable({ options }: ComparisonTableProps) {
  return (
    <div className="space-y-10">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {options.map((option, i) => {
          const meta = LABEL_META[option.label] ?? LABEL_META.BALANCED;
          const TransportIcon = TRANSPORT_ICON[option.transportMode] ?? Car;
          return (
            <div
              key={option.id}
              className="card-hover glass-card animate-scale-in overflow-hidden rounded-2xl"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <div className={`h-1.5 w-full bg-gradient-to-r ${meta.bg}`} />
              <div className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${meta.bg} text-white shadow-sm`}>
                    <meta.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{meta.text}</p>
                    <p className="flex items-center gap-1 text-xs capitalize text-slate-500">
                      <TransportIcon className="h-3 w-3" />
                      {option.transportMode} · {option.accommodationTier}
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
                    <p className="text-[10px] uppercase text-slate-500">cost</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 py-2">
                    <p className="text-sm font-semibold text-slate-900">{option.durationHrs.toFixed(1)}h</p>
                    <p className="text-[10px] uppercase text-slate-500">duration</p>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-slate-600">{option.explanation}</p>

                <div className="mt-4 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${meta.bg}`}
                      style={{ width: `${Math.round(option.preferenceScore * 100)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-semibold ${meta.accent}`}>
                    {Math.round(option.preferenceScore * 100)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-card animate-fade-up overflow-x-auto rounded-2xl p-2 [animation-delay:200ms]">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Strategy
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Carbon
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Cost
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Duration
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Match
              </th>
            </tr>
          </thead>
          <tbody>
            {options.map((option) => {
              const meta = LABEL_META[option.label] ?? LABEL_META.BALANCED;
              return (
                <tr key={option.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/80">
                  <td className="flex items-center gap-2 px-4 py-3 font-medium text-slate-900">
                    <meta.icon className={`h-3.5 w-3.5 ${meta.accent}`} />
                    {meta.text}
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
