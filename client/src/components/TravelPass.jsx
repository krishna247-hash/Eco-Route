import { Leaf, ArrowRight, Users, CalendarDays, Wallet, Trees, Hotel } from 'lucide-react';
import { MODE_META, fmtDate, fmtMoney } from '../utils.js';

/** Deterministic pseudo-QR pattern derived from the pass code (visual only). */
function PassCodeGrid({ code }) {
  const size = 11;
  let seed = [...code].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const cells = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      const finder = (x < 3 && y < 3) || (x > size - 4 && y < 3) || (x < 3 && y > size - 4);
      if (finder || (seed >> 16) % 2) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
    }
  }
  return (
    <svg viewBox={`-1 -1 ${size + 2} ${size + 2}`} className="pass-code" role="img" aria-label={`Pass code ${code}`}>
      <rect x="-1" y="-1" width={size + 2} height={size + 2} fill="#fff" />
      <g fill="#0f172a">{cells}</g>
    </svg>
  );
}

export default function TravelPass({ trip }) {
  const { result, selectedPlan, passCode } = trip;
  const plan = result.plans[selectedPlan];
  const { icon: ModeIcon, label } = MODE_META[plan.mode];

  return (
    <div className="pass">
      <div className="pass-top">
        <div className="row gap-sm">
          <span className="brand-logo"><Leaf size={18} /></span>
          <div>
            <strong>EcoRoute Digital Travel Pass</strong>
            <small>{plan.title} · Certified low-carbon itinerary</small>
          </div>
        </div>
        <div className="pass-score">
          <small>EcoScore</small>
          <strong>{plan.explanation.ecoScore}</strong>
        </div>
      </div>

      <div className="pass-route">
        <div>
          <small>From</small>
          <strong>{result.origin.name}</strong>
          <span>{result.origin.country}</span>
        </div>
        <div className="pass-mode">
          <ModeIcon size={20} />
          <span>{label}</span>
          <ArrowRight size={16} />
          <small>{plan.totalDurationHours} h transit</small>
        </div>
        <div className="right">
          <small>To</small>
          <strong>{result.destination.name}</strong>
          <span>{result.destination.country}</span>
        </div>
      </div>

      <div className="pass-grid">
        <div><CalendarDays size={14} /><small>Dates</small><strong>{fmtDate(result.startDate)} – {fmtDate(result.endDate)}</strong></div>
        <div><Users size={14} /><small>Travellers</small><strong>{trip.travelerName || `${result.travelers} person(s)`}</strong></div>
        <div><Wallet size={14} /><small>Est. cost</small><strong>{fmtMoney(plan.totalCost)}</strong></div>
        <div><Trees size={14} /><small>CO₂ avoided</small><strong>{plan.explanation.carbonSavingsKg} kg</strong></div>
      </div>

      <div className="pass-stay">
        <Hotel size={16} />
        <div className="grow">
          <strong>{plan.accommodation.name}</strong>
          <small>{plan.accommodation.sustainabilityHighlights.join(' · ')}</small>
        </div>
        <span className="badge badge-green">{plan.accommodation.ecoScore}</span>
      </div>

      <div className="pass-foot">
        <div>
          <small>Pass code</small>
          <strong className="mono">{passCode}</strong>
          <small>Footprint: {plan.totalCarbonKg} kg CO₂e ({plan.carbonPerTravelerKg} kg / traveller)</small>
        </div>
        <PassCodeGrid code={passCode} />
      </div>
    </div>
  );
}
