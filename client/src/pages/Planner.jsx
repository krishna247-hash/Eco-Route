import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Save, Printer, Info } from 'lucide-react';
import { api } from '../api/client.js';
import TripForm, { DEFAULT_TRIP } from '../components/TripForm.jsx';
import PlanCards from '../components/PlanCards.jsx';
import PlanView from '../components/PlanView.jsx';

export default function Planner() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState('balanced');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const generate = async (params) => {
    setLoading(true);
    setError('');
    try {
      setResult(await api.plan(params));
      setSelected('balanced');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Show a demo itinerary straight away.
  useEffect(() => {
    generate(DEFAULT_TRIP);
  }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const trip = await api.saveTrip({ result, selectedPlan: selected });
      navigate(`/trips/${trip._id}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const plan = result?.plans[selected];

  return (
    <div className="container section stack-lg">
      <div className="section-head">
        <span className="pill"><Sparkles size={14} /> Multi-Objective Optimisation Planner</span>
        <h1>Plan your sustainable journey</h1>
        <p className="muted">Balance carbon, budget and travel time across the Pareto-optimal frontier.</p>
      </div>

      <div className="narrow no-print">
        <TripForm onSubmit={generate} loading={loading} />
      </div>

      {error && <div className="alert">{error}</div>}

      {result && plan && (
        <div className="stack-lg results">
          <section className="stack">
            <div className="row between wrap gap-sm">
              <div>
                <h2>Pareto-optimal candidate plans</h2>
                <p className="muted xs">
                  {result.origin.name} → {result.destination.name} · {result.candidatesEvaluated} candidates
                  evaluated
                </p>
              </div>
              <span className="badge">
                {result.totalDays} days · {result.travelers} traveller{result.travelers > 1 ? 's' : ''}
              </span>
            </div>

            {result.modeFallback && (
              <div className="alert alert-info">
                <Info size={16} /> None of your selected modes can serve this route, so all feasible modes were
                considered.
              </div>
            )}

            <PlanCards plans={result.plans} selected={selected} onSelect={setSelected} />

            <div className="card action-bar no-print">
              <span>
                Selected: <strong>{plan.title}</strong> · EcoScore{' '}
                <strong className="good">{plan.explanation.ecoScore}</strong>
              </span>
              <div className="row gap-sm">
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  <Save size={15} /> {saving ? 'Saving…' : 'Save & get travel pass'}
                </button>
                <button className="btn btn-outline" onClick={() => window.print()}>
                  <Printer size={15} /> Print
                </button>
              </div>
            </div>
          </section>

          <PlanView result={result} planKey={selected} />
        </div>
      )}
    </div>
  );
}
