import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Compass, BarChart3, ArrowRight, Plane, Train, Trees, Scale, CheckCircle2,
} from 'lucide-react';
import { api } from '../api/client.js';

// Used until /api/factors responds.
const FALLBACK = { flight: 0.255, train: 0.032, tree: 21.77 };

export default function Home() {
  const [distance, setDistance] = useState(500);
  const [f, setF] = useState(FALLBACK);

  useEffect(() => {
    api
      .factors()
      .then((d) =>
        setF({
          flight: d.transport.flight.factor,
          train: d.transport.train.factor,
          tree: d.treeAnnualSequestrationKg,
        })
      )
      .catch(() => {});
  }, []);

  const flight = Math.round(distance * f.flight * 10) / 10;
  const train = Math.round(distance * f.train * 10) / 10;
  const saved = Math.round((flight - train) * 10) / 10;
  const trees = Math.round((saved / f.tree) * 10) / 10;

  return (
    <div className="stack-xl">
      <section className="container hero">
        <span className="pill">
          <Sparkles size={14} /> AI-Driven Multi-Objective Carbon Optimization
        </span>
        <h1 className="hero-title">
          Travel Freely. <span className="gradient-text">Emit Responsibly.</span>
        </h1>
        <p className="hero-lead">
          EcoRoute builds personalised itineraries by jointly optimising carbon footprint, cost, travel
          time and comfort with Pareto-frontier modelling and explainable AI.
        </p>
        <div className="row gap center wrap">
          <Link to="/planner" className="btn btn-primary btn-lg">
            <Compass size={18} /> Launch Trip Planner <ArrowRight size={16} />
          </Link>
          <Link to="/dashboard" className="btn btn-outline btn-lg">
            <BarChart3 size={18} /> Carbon Dashboard
          </Link>
        </div>

        <div className="card calc-card">
          <div className="card-head">
            <div>
              <span className="eyebrow">Live Carbon Abatement Calculator</span>
              <h3>Flight vs. Electrified High-Speed Rail</h3>
            </div>
            <span className="badge badge-green">DEFRA GHG Factors</span>
          </div>

          <label className="slider-label">
            <span>Journey distance</span>
            <strong>{distance} km</strong>
          </label>
          <input
            type="range"
            min={100}
            max={1500}
            step={25}
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
          />
          <div className="row between muted xs">
            <span>100 km</span>
            <span>800 km (Paris – Nice)</span>
            <span>1500 km</span>
          </div>

          <div className="grid-3 mt">
            <div className="stat stat-rose">
              <span className="stat-label"><Plane size={14} /> Flight</span>
              <strong>{flight} kg</strong>
              <small>Incl. radiative forcing</small>
            </div>
            <div className="stat stat-green">
              <span className="stat-label"><Train size={14} /> Electric rail</span>
              <strong>{train} kg</strong>
              <small>Grid-electrified transit</small>
            </div>
            <div className="stat stat-solid">
              <span className="stat-label"><Trees size={14} /> Net abated</span>
              <strong>{saved} kg</strong>
              <small>≈ {trees} trees absorbing CO₂ for a year</small>
            </div>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="section-head">
          <span className="eyebrow">Algorithmic Innovations</span>
          <h2>The EcoRoute Framework</h2>
          <p className="muted">How EcoRoute resolves the trade-off between rapid travel and environmental impact.</p>
        </div>
        <div className="grid-3">
          {[
            {
              icon: Scale,
              title: 'Multi-Objective Optimization',
              text: 'Every feasible mode × lodging combination is scored on carbon, cost, time and comfort, and dominated options are discarded.',
              points: ['Pareto non-dominated filtering', 'Weighted knee-point selection'],
            },
            {
              icon: Sparkles,
              title: 'Explainable AI (XAI)',
              text: 'Each recommendation ships with a plain-language rationale, quantified trade-offs and actionable eco-nudges.',
              points: ['Carbon, time & cost deltas', 'Behavioural nudges'],
            },
            {
              icon: BarChart3,
              title: 'Standardised Carbon Accounting',
              text: 'DEFRA 2023 and ICAO factors for transport, hotel energy intensity and aviation radiative forcing.',
              points: ['DEFRA / ICAO factors', 'Tree-sequestration equivalents'],
            },
          ].map(({ icon: Icon, title, text, points }) => (
            <div key={title} className="card feature">
              <span className="feature-icon"><Icon size={22} /></span>
              <h3>{title}</h3>
              <p className="muted">{text}</p>
              <ul className="check-list">
                {points.map((p) => (
                  <li key={p}><CheckCircle2 size={14} /> {p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="container">
        <div className="cta">
          <div>
            <h3>Ready to experience EcoRoute?</h3>
            <p>Generate an intelligent, carbon-aware itinerary in seconds and save it to your digital travel pass.</p>
          </div>
          <Link to="/planner" className="btn btn-white btn-lg">
            Start Planning <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
