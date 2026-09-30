import { useEffect, useState } from 'react';
import { Leaf, Sparkles, Clock, DollarSign, Scale, ArrowLeftRight } from 'lucide-react';
import { api } from '../api/client.js';
import { MODE_META, isoOffset } from '../utils.js';

const PRIORITIES = [
  { id: 'balanced', label: 'Balanced', icon: Scale },
  { id: 'eco', label: 'Lowest CO₂', icon: Leaf },
  { id: 'speed', label: 'Fastest', icon: Clock },
  { id: 'budget', label: 'Cheapest', icon: DollarSign },
];

export const DEFAULT_TRIP = {
  origin: 'paris',
  destination: 'amsterdam',
  startDate: isoOffset(7),
  endDate: isoOffset(10),
  travelers: 1,
  budget: 1200,
  priority: 'balanced',
  preferredModes: ['train', 'flight', 'bus', 'ev'],
};

export default function TripForm({ onSubmit, loading }) {
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState(DEFAULT_TRIP);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  useEffect(() => {
    api.cities().then(setCities).catch(() => {});
  }, []);

  const toggleMode = (mode) => {
    const has = form.preferredModes.includes(mode);
    if (has && form.preferredModes.length === 1) return;
    setForm({
      ...form,
      preferredModes: has
        ? form.preferredModes.filter((m) => m !== mode)
        : [...form.preferredModes, mode],
    });
  };

  const submit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, travelers: Number(form.travelers), budget: Number(form.budget) });
  };

  const cityOptions = (exclude) =>
    cities
      .filter((c) => c.id !== exclude)
      .map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}, {c.country}
        </option>
      ));

  return (
    <form className="card form" onSubmit={submit}>
      <div className="card-head">
        <div>
          <h2>Configure Trip Parameters</h2>
          <p className="muted xs">Multi-objective constraint set-up</p>
        </div>
        <span className="badge badge-green"><Leaf size={12} /> DEFRA Standard</span>
      </div>

      <div className="grid-route">
        <label className="field">
          <span>From</span>
          <select value={form.origin} onChange={set('origin')}>{cityOptions(form.destination)}</select>
        </label>
        <button
          type="button"
          className="icon-btn swap"
          aria-label="Swap origin and destination"
          onClick={() => setForm({ ...form, origin: form.destination, destination: form.origin })}
        >
          <ArrowLeftRight size={16} />
        </button>
        <label className="field">
          <span>To</span>
          <select value={form.destination} onChange={set('destination')}>{cityOptions(form.origin)}</select>
        </label>
      </div>

      <div className="grid-4">
        <label className="field">
          <span>Start date</span>
          <input type="date" value={form.startDate} onChange={set('startDate')} required />
        </label>
        <label className="field">
          <span>End date</span>
          <input
            type="date"
            value={form.endDate}
            min={form.startDate}
            onChange={set('endDate')}
            required
          />
        </label>
        <label className="field">
          <span>Travellers</span>
          <input type="number" min={1} max={10} value={form.travelers} onChange={set('travelers')} />
        </label>
        <label className="field">
          <span>Budget (USD, group)</span>
          <input type="number" min={0} step={50} value={form.budget} onChange={set('budget')} />
        </label>
      </div>

      <div className="field">
        <span>Optimisation priority</span>
        <div className="segmented">
          {PRIORITIES.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              className={form.priority === id ? 'active' : ''}
              onClick={() => setForm({ ...form, priority: id })}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span>Candidate transport modes</span>
        <div className="chips">
          {['train', 'flight', 'bus', 'ev', 'car'].map((m) => {
            const { label, icon: Icon } = MODE_META[m];
            const on = form.preferredModes.includes(m);
            return (
              <button type="button" key={m} className={`chip ${on ? 'on' : ''}`} onClick={() => toggleMode(m)}>
                <Icon size={14} /> {label}
              </button>
            );
          })}
        </div>
      </div>

      <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
        {loading ? (
          <>
            <span className="spinner" /> Computing Pareto frontier…
          </>
        ) : (
          <>
            <Sparkles size={18} /> Generate Carbon-Optimised Itineraries
          </>
        )}
      </button>
    </form>
  );
}
