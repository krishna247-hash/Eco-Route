import { Hotel, Clock, Leaf, CheckCircle2 } from 'lucide-react';
import { MODE_META, fmtDate, fmtMoney } from '../utils.js';

export default function DayTimeline({ days, accommodation }) {
  return (
    <div className="stack">
      {days.map((day) => (
        <div key={day.dayNumber} className="card day">
          <div className="day-head">
            <div className="row gap-sm">
              <span className="day-num">D{day.dayNumber}</span>
              <div>
                <strong>Day {day.dayNumber} — {day.city}</strong>
                <div className="muted xs">{fmtDate(day.date)}</div>
              </div>
            </div>
            <div className="row gap-sm">
              <span className="badge badge-green"><Leaf size={12} /> {day.dailyCarbonKg} kg</span>
              <span className="badge">{fmtMoney(day.dailyCost)}</span>
            </div>
          </div>

          <div className="day-body">
            {day.legs.map((leg) => {
              const { icon: Icon, label, color } = MODE_META[leg.mode];
              return (
                <div key={leg.id} className="item item-leg">
                  <span className="item-icon" style={{ color }}><Icon size={16} /></span>
                  <div className="grow">
                    <strong>{leg.fromName} → {leg.toName}</strong>
                    <span className="badge sm">{label}</span>
                    <p className="muted xs">{leg.description}</p>
                  </div>
                  <div className="item-stats">
                    <span>{leg.distanceKm} km</span>
                    <span>~{leg.durationHours} h</span>
                    <span className="good">{leg.carbonKg} kg</span>
                  </div>
                </div>
              );
            })}

            {day.staying && (
              <div className="item item-stay">
                <span className="item-icon"><Hotel size={16} /></span>
                <div className="grow">
                  <strong>{accommodation.name}</strong>
                  <span className="badge sm">★ {accommodation.rating}</span>
                  <div className="row gap-sm wrap mt-xs">
                    {accommodation.ecoCertifications.map((c) => (
                      <span key={c} className="badge badge-green sm"><CheckCircle2 size={11} /> {c}</span>
                    ))}
                  </div>
                </div>
                <div className="item-stats">
                  <span>{fmtMoney(accommodation.pricePerNight)}/night</span>
                  <span className="good">{accommodation.carbonKgPerNight} kg/night</span>
                </div>
              </div>
            )}

            <h5 className="muted">Scheduled activities</h5>
            {day.activities.length === 0 ? (
              <p className="muted xs">Travel day — self-guided exploration and rest.</p>
            ) : (
              day.activities.map((a) => (
                <div key={a.id} className="item">
                  <span className="bullet-dot" />
                  <div className="grow">
                    <strong>{a.name}</strong>
                    <span className="badge sm">{a.category}</span>
                    <p className="muted xs">{a.description}</p>
                  </div>
                  <div className="item-stats">
                    <span><Clock size={12} /> {a.durationHours} h</span>
                    <span>{a.cost > 0 ? fmtMoney(a.cost) : 'Free'}</span>
                    <span className="good">{a.carbonKg} kg</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
