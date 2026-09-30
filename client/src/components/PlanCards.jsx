import { Leaf, Sparkles, Clock, Check, AlertTriangle } from 'lucide-react';
import { MODE_META, TIER_LABELS, PLAN_KEYS, fmtMoney } from '../utils.js';

const META = {
  ecoChampion: { badge: 'Lowest Carbon', icon: Leaf, tone: 'green' },
  balanced: { badge: 'Recommended Knee', icon: Sparkles, tone: 'teal' },
  fastest: { badge: 'Fastest Transit', icon: Clock, tone: 'sky' },
};

export default function PlanCards({ plans, selected, onSelect }) {
  return (
    <div className="grid-3">
      {PLAN_KEYS.map((key) => {
        const plan = plans[key];
        const { badge, icon: Icon, tone } = META[key];
        const ModeIcon = MODE_META[plan.mode].icon;
        const active = key === selected;
        return (
          <button
            type="button"
            key={key}
            className={`plan-card tone-${tone} ${active ? 'active' : ''}`}
            onClick={() => onSelect(key)}
            aria-pressed={active}
          >
            <div className="row between">
              <span className="badge badge-outline"><Icon size={13} /> {badge}</span>
              {active && <span className="check-dot"><Check size={13} /></span>}
            </div>
            <h3>{plan.title}</h3>
            <p className="muted xs">{plan.tagline}</p>
            <p className="plan-mode">
              <ModeIcon size={15} /> {MODE_META[plan.mode].label} · {TIER_LABELS[plan.tier]}
            </p>
            <div className="plan-metrics">
              <div>
                <small>Carbon</small>
                <strong>{plan.totalCarbonKg} kg</strong>
                <em className="good">−{plan.carbonSavedPercentage}%</em>
              </div>
              <div>
                <small>Cost</small>
                <strong>{fmtMoney(plan.totalCost)}</strong>
                <em>all incl.</em>
              </div>
              <div>
                <small>Transit</small>
                <strong>{plan.totalDurationHours} h</strong>
                <em>round trip</em>
              </div>
            </div>
            {plan.overBudget && (
              <p className="warn xs"><AlertTriangle size={13} /> Over budget</p>
            )}
          </button>
        );
      })}
    </div>
  );
}
