import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
  ScatterChart, Scatter, ZAxis, CartesianGrid, Legend,
} from 'recharts';
import { Leaf, Trees, Gauge, Wallet } from 'lucide-react';
import { MODE_META, TIER_LABELS, fmtMoney } from '../utils.js';

const BREAKDOWN_COLORS = { transport: '#0d9488', accommodation: '#f59e0b', activities: '#8b5cf6' };

export default function CarbonCharts({ plan, plans, candidates }) {
  const { explanation, breakdown } = plan;

  const pie = Object.entries(breakdown)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: k[0].toUpperCase() + k.slice(1), value: v, fill: BREAKDOWN_COLORS[k] }));

  const bars = [
    { name: 'Conventional', carbon: explanation.baselineComparison.baselineCarbonKg, fill: '#f43f5e' },
    { name: 'Speed-Priority', carbon: plans.fastest.totalCarbonKg, fill: '#0ea5e9' },
    { name: 'EcoRoute Optimal', carbon: plans.balanced.totalCarbonKg, fill: '#14b8a6' },
    { name: 'Eco-Champion', carbon: plans.ecoChampion.totalCarbonKg, fill: '#10b981' },
  ];

  // One scatter series per mode so the legend doubles as a colour key.
  const byMode = {};
  for (const c of candidates ?? []) (byMode[c.mode] ??= []).push(c);

  return (
    <div className="stack">
      <div className="grid-4">
        <div className="kpi">
          <Leaf size={18} />
          <small>Total footprint</small>
          <strong>{plan.totalCarbonKg} kg CO₂e</strong>
          <em>{plan.carbonPerTravelerKg} kg per traveller</em>
        </div>
        <div className="kpi">
          <Trees size={18} />
          <small>Avoided vs. conventional</small>
          <strong>{explanation.carbonSavingsKg} kg</strong>
          <em>≈ {explanation.treesEquivalent} trees for a year</em>
        </div>
        <div className="kpi">
          <Gauge size={18} />
          <small>Eco score</small>
          <strong className={`grade grade-${explanation.ecoScore.replace('+', 'plus')}`}>{explanation.ecoScore}</strong>
          <em>per-person, per-day intensity</em>
        </div>
        <div className="kpi">
          <Wallet size={18} />
          <small>Estimated cost</small>
          <strong>{fmtMoney(plan.totalCost)}</strong>
          <em>transport, lodging &amp; activities</em>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h4>Plan vs. conventional baseline (kg CO₂e)</h4>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={bars} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v} kg`, 'CO₂e']} />
              <Bar dataKey="carbon" radius={[6, 6, 0, 0]}>
                {bars.map((b) => <Cell key={b.name} fill={b.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h4>Emission breakdown — {plan.title}</h4>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {pie.map((p) => <Cell key={p.name} fill={p.fill} />)}
              </Pie>
              <Tooltip formatter={(v) => `${v} kg`} />
              <Legend iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {candidates?.length > 0 && (
        <div className="card">
          <h4>Pareto frontier — all {candidates.length} candidates (carbon vs. cost)</h4>
          <p className="muted xs">
            Larger dots are non-dominated (on the frontier); hover for mode, lodging and transit time.
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" dataKey="carbon" name="Carbon" unit=" kg" tick={{ fontSize: 11 }} />
              <YAxis type="number" dataKey="cost" name="Cost" unit=" $" tick={{ fontSize: 11 }} />
              <ZAxis type="number" dataKey="size" range={[40, 160]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ payload }) => {
                  const c = payload?.[0]?.payload;
                  if (!c) return null;
                  return (
                    <div className="tooltip">
                      <strong>{MODE_META[c.mode].label} · {TIER_LABELS[c.tier]}</strong>
                      <div>{c.carbon} kg CO₂e · {fmtMoney(c.cost)} · {c.time} h</div>
                      <div>{c.onFrontier ? 'On Pareto frontier' : 'Dominated'}</div>
                    </div>
                  );
                }}
              />
              <Legend />
              {Object.entries(byMode).map(([mode, pts]) => (
                <Scatter
                  key={mode}
                  name={MODE_META[mode].label}
                  data={pts.map((p) => ({ ...p, size: p.onFrontier ? 160 : 40 }))}
                  fill={MODE_META[mode].color}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
