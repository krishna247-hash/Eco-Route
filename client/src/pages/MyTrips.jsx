import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ticket, Trash2, Search, Compass, Leaf } from 'lucide-react';
import { api } from '../api/client.js';
import { fmtDate, fmtMoney, fmtKg } from '../utils.js';

const PLAN_TITLES = { ecoChampion: 'Eco-Champion', balanced: 'EcoRoute Optimal', fastest: 'Speed-Priority' };

export default function MyTrips() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState(null);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');

  const load = () =>
    api
      .trips()
      .then(setTrips)
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    if (!window.confirm('Delete this saved trip?')) return;
    try {
      await api.deleteTrip(id);
      setTrips((ts) => ts.filter((t) => t._id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  const totalSaved = trips?.reduce((s, t) => s + (t.savedCarbonKg || 0), 0) ?? 0;

  return (
    <div className="container section stack-lg">
      <div className="section-head">
        <span className="pill"><Ticket size={14} /> Digital Travel Passes</span>
        <h1>My saved trips</h1>
        <p className="muted">Itineraries saved to MongoDB, each with a shareable low-carbon travel pass.</p>
      </div>

      <form
        className="card row gap-sm lookup"
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim()) navigate(`/trips/${code.trim().toUpperCase()}`);
        }}
      >
        <Search size={16} className="muted" />
        <input
          placeholder="Look up a pass code, e.g. ECO-1A2B3C4D"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button className="btn btn-primary">Open pass</button>
      </form>

      {error && <div className="alert">{error}</div>}

      {trips && trips.length > 0 && (
        <div className="grid-3">
          <div className="kpi"><Ticket size={18} /><small>Saved trips</small><strong>{trips.length}</strong></div>
          <div className="kpi"><Leaf size={18} /><small>Total CO₂ avoided</small><strong>{fmtKg(totalSaved)}</strong></div>
          <div className="kpi"><Leaf size={18} /><small>Avg. per trip</small><strong>{fmtKg(totalSaved / trips.length)}</strong></div>
        </div>
      )}

      {trips === null && !error && <p className="muted center">Loading…</p>}

      {trips?.length === 0 && (
        <div className="card empty">
          <p>No trips saved yet.</p>
          <Link to="/planner" className="btn btn-primary"><Compass size={16} /> Plan a trip</Link>
        </div>
      )}

      <div className="trip-list">
        {trips?.map((t) => (
          <div key={t._id} className="card trip-row">
            <Link to={`/trips/${t._id}`} className="grow">
              <strong>{t.name}</strong>
              <div className="muted xs">
                {fmtDate(t.startDate)} – {fmtDate(t.endDate)} · {t.travelers} traveller(s) ·{' '}
                {PLAN_TITLES[t.selectedPlan]}
              </div>
            </Link>
            <span className="badge badge-green">{t.ecoScore}</span>
            <span className="xs">{fmtKg(t.totalCarbonKg)}</span>
            <span className="xs">{fmtMoney(t.totalCost)}</span>
            <span className="mono xs muted">{t.passCode}</span>
            <button className="icon-btn danger" aria-label="Delete trip" onClick={() => remove(t._id)}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
