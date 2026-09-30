import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Copy, Check } from 'lucide-react';
import { api } from '../api/client.js';
import TravelPass from '../components/TravelPass.jsx';
import PlanCards from '../components/PlanCards.jsx';
import PlanView from '../components/PlanView.jsx';

export default function TripPass() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setTrip(null);
    setError('');
    api.trip(id).then(setTrip).catch((e) => setError(e.message));
  }, [id]);

  const choosePlan = async (key) => {
    const prev = trip;
    setTrip({ ...trip, selectedPlan: key });
    try {
      setTrip(await api.updateTrip(trip._id, { selectedPlan: key }));
    } catch (e) {
      setTrip(prev);
      setError(e.message);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(trip.passCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (error) {
    return (
      <div className="container section stack">
        <div className="alert">{error}</div>
        <Link to="/trips" className="btn btn-outline"><ArrowLeft size={16} /> Back to my trips</Link>
      </div>
    );
  }
  if (!trip) return <p className="container section muted center">Loading pass…</p>;

  return (
    <div className="container section stack-lg">
      <div className="row between wrap gap-sm no-print">
        <Link to="/trips" className="btn btn-outline"><ArrowLeft size={16} /> My trips</Link>
        <div className="row gap-sm">
          <button className="btn btn-outline" onClick={copyCode}>
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy pass code'}
          </button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <Printer size={16} /> Print pass
          </button>
        </div>
      </div>

      <TravelPass trip={trip} />

      <section className="stack no-print">
        <div>
          <h2>Switch plan</h2>
          <p className="muted xs">Changing the plan updates this saved trip and its pass.</p>
        </div>
        <PlanCards plans={trip.result.plans} selected={trip.selectedPlan} onSelect={choosePlan} />
      </section>

      <PlanView result={trip.result} planKey={trip.selectedPlan} />
    </div>
  );
}
