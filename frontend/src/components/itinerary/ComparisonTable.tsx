import type { ItineraryOption } from '@/types';

interface ComparisonTableProps {
  options: ItineraryOption[];
}

const LABEL_TEXT: Record<string, string> = {
  LOW_CARBON: 'Low Carbon',
  BALANCED: 'Balanced',
  LOW_COST: 'Low Cost',
  TIME_EFFICIENT: 'Time Efficient',
  PREFERENCE_FOCUSED: 'Preference Focused',
};

export function ComparisonTable({ options }: ComparisonTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-40 border-b border-slate-200 py-2 text-left font-medium text-slate-500" />
            {options.map((option) => (
              <th key={option.id} className="border-b border-slate-200 px-4 py-2 text-left font-semibold text-slate-900">
                {LABEL_TEXT[option.label] ?? option.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-2 text-slate-500">Transport</td>
            {options.map((option) => (
              <td key={option.id} className="px-4 py-2 capitalize">
                {option.transportMode}
              </td>
            ))}
          </tr>
          <tr>
            <td className="py-2 text-slate-500">Accommodation</td>
            {options.map((option) => (
              <td key={option.id} className="px-4 py-2 capitalize">
                {option.accommodationTier}
              </td>
            ))}
          </tr>
          <tr>
            <td className="py-2 text-slate-500">Carbon</td>
            {options.map((option) => (
              <td key={option.id} className="px-4 py-2">
                {option.carbon.total_co2e.toFixed(1)} kg CO2e
              </td>
            ))}
          </tr>
          <tr>
            <td className="py-2 text-slate-500">Cost</td>
            {options.map((option) => (
              <td key={option.id} className="px-4 py-2">
                ${option.costUsd.toFixed(2)}
              </td>
            ))}
          </tr>
          <tr>
            <td className="py-2 text-slate-500">Duration</td>
            {options.map((option) => (
              <td key={option.id} className="px-4 py-2">
                {option.durationHrs.toFixed(1)} h
              </td>
            ))}
          </tr>
          <tr>
            <td className="py-2 text-slate-500">Preference match</td>
            {options.map((option) => (
              <td key={option.id} className="px-4 py-2">
                {(option.preferenceScore * 100).toFixed(0)}%
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => (
          <div key={option.id} className="rounded-lg border border-slate-200 p-4">
            <p className="mb-1 text-sm font-semibold text-slate-900">{LABEL_TEXT[option.label] ?? option.label}</p>
            <p className="text-sm text-slate-600">{option.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
