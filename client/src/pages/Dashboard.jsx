import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3, Trees, Leaf, TrendingDown } from 'lucide-react';
import { api } from '../api/client.js';
import { MODE_META, transportCarbon } from '../utils.js';

export default function Dashboard() {
  const [factors, setFactors] = useState(null);
  const [inputs, setInputs] = useState({
    distanceKm: 600,
    passengers: 1,
    nights: 3,
    mode: 'train',
    hotelTier: 'eco_hotel',
  });
  const [calc, setCalc] = useState(null);
  const [error, setError] = useState('');
  const set = (key, numeric = true) => (e) =>
    setInputs({ ...inputs, [key]: numeric ? Number(e.target.value) : e.target.value });

  useEffect(() => {
    api.factors().then(setFactors).catch((e) => setError(e.message));
  }, []);

  // Debounced call to the server-side calculator.
  useEffect(() => {
    const t = setTimeout(() => {
      api.carbon(inputs).then(setCalc).catch((e) => setError(e.message));
    }, 200);
    return () => clearTimeout(t);
  }, [inputs]);

  if (error) return <div className="container section"><div className="alert">{error}</div></div>;
  if (!factors) return <p className="container section muted center">Loading emission factors…</p>;

  const modal = Object.keys(factors.transport)
    .map((m) => ({
      mode: m,
      name: MODE_META[m].label,
      carbon: transportCarbon(factors, inputs.distanceKm, m, inputs.passengers),
      fill: MODE_META[m].color,
    }))
    .sort((a, b) => a.carbon - b.carbon);

  return (
    <div className="container section stack-lg">
      <div className="section-head">
        <span className="pill"><BarChart3 size={14} /> Carbon Analytics</span>
        <h1>Dynamic carbon dashboard</h1>
        <p className="muted">Simulate a one-way journey and stay, and compare it with a flight + standard-hotel baseline.</p>
      </div>

      <div className="grid-dash">
        <div className="card form">
          <h3>Simulation parameters</h3>
          <label className="slider-label"><span>Distance</span><strong>{inputs.distanceKm} km</strong></label>
          <input type="range" min={50} max={3000} step={50} value={inputs.distanceKm} onChange={set('distanceKm')} />
          <label className="slider-label"><span>Passengers</span><strong>{inputs.passengers}</strong></label>
          <input type="range" min={1} max={8} value={inputs.passengers} onChange={set('passengers')} />
          <label className="slider-label"><span>Nights</span><strong>{inputs.nights}</strong></label>
          <input type="range" min={0} max={14} value={inputs.nights} onChange={set('nights')} />

          <label className="field">
            <span>Transport mode</span>
            <select value={inputs.mode} onChange={set('mode', false)}>
              {Object.entries(factors.transport).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Accommodation</span>
            <select value={inputs.hotelTier} onChange={set('hotelTier', false)}>
              {Object.entries(factors.accommodation).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}
            </select>
          </label>
        </div>

        <div className="stack">
          {calc && (
            <div className="grid-2">
              <div className="kpi"><Leaf size={18} /><small>Your footprint</small><strong>{calc.totalCarbonKg} kg</strong><em>Transport {calc.transportCarbonKg} kg · Stay {calc.hotelCarbonKg} kg</em></div>
              <div className="kpi"><BarChart3 size={18} /><small>Baseline (flight + hotel)</small><strong>{calc.baselineCarbonKg} kg</strong><em>Conventional choice</em></div>
              <div className="kpi"><TrendingDown size={18} /><small>Avoided</small><strong className="good">{calc.savedCarbonKg} kg</strong><em>{calc.savingsPercentage}% below baseline</em></div>
              <div className="kpi"><Trees size={18} /><small>Tree equivalent</small><strong>{calc.treesEquivalent}</strong><em>trees absorbing CO₂ for one year</em></div>
            </div>
          )}
          <div className="card">
            <h4>Transport emissions by mode for {inputs.distanceKm} km, {inputs.passengers} passenger(s)</h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={modal} layout="vertical" margin={{ left: 30, right: 20 }}>
                <XAxis type="number" unit=" kg" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} kg CO₂e`, 'Emissions']} />
                <Bar dataKey="carbon" radius={[0, 6, 6, 0]}>
                  {modal.map((m) => <Cell key={m.mode} fill={m.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Emission factor reference</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Mode / asset</th><th>Factor</th><th>Unit</th><th>Source</th></tr>
            </thead>
            <tbody>
              {Object.entries(factors.transport).map(([k, f]) => (
                <tr key={k}>
                  <td><span className="swatch" style={{ background: f.color }} /> {f.label}</td>
                  <td className="mono">{f.factor}</td>
                  <td>kg CO₂e / {f.perVehicle ? 'vehicle-km' : 'passenger-km'}</td>
                  <td className="muted">{f.source}</td>
                </tr>
              ))}
              {Object.entries(factors.accommodation).map(([k, f]) => (
                <tr key={k}>
                  <td><span className="swatch" style={{ background: '#f59e0b' }} /> {f.label}</td>
                  <td className="mono">{f.factor}</td>
                  <td>kg CO₂e / room-night</td>
                  <td className="muted">{f.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted xs">
          Tree equivalent assumes one mature tree absorbs {factors.treeAnnualSequestrationKg} kg CO₂ per year.
        </p>
      </div>
    </div>
  );
}
