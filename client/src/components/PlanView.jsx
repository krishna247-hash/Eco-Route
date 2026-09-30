import { useMemo } from 'react';
import CarbonCharts from './CarbonCharts.jsx';
import ExplainCard from './ExplainCard.jsx';
import RouteMap from './RouteMap.jsx';
import DayTimeline from './DayTimeline.jsx';

/** Full breakdown of one plan: metrics, XAI rationale, map and day-by-day schedule. */
export default function PlanView({ result, planKey }) {
  const plan = result.plans[planKey];
  const activities = useMemo(() => plan.days.flatMap((d) => d.activities), [plan]);

  return (
    <div className="stack-lg">
      <section className="stack">
        <div>
          <h2>Carbon impact &amp; metrics</h2>
          <p className="muted xs">Granular emissions analysis for “{plan.title}”</p>
        </div>
        <CarbonCharts plan={plan} plans={result.plans} candidates={result.candidates} />
      </section>

      <ExplainCard explanation={plan.explanation} title={plan.title} />

      <section className="grid-map">
        <div className="stack">
          <div>
            <h3>Route map</h3>
            <p className="muted xs">Origin, destination, lodging &amp; scheduled activities</p>
          </div>
          <RouteMap
            origin={result.origin}
            destination={result.destination}
            mode={plan.mode}
            activities={activities}
            lodging={plan.accommodation}
          />
          <div className="card">
            <h5 className="muted">Transit legs</h5>
            {plan.allLegs.map((leg) => (
              <div key={leg.id} className="row between leg-row">
                <span>{leg.fromName} → {leg.toName}</span>
                <strong className="good">{leg.carbonKg} kg CO₂e</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="stack">
          <div>
            <h3>Day-by-day schedule</h3>
            <p className="muted xs">Transit, lodging and low-impact activities</p>
          </div>
          <DayTimeline days={plan.days} accommodation={plan.accommodation} />
        </div>
      </section>
    </div>
  );
}
