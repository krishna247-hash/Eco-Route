import { BrainCircuit, Scale, Leaf, Lightbulb } from 'lucide-react';

export default function ExplainCard({ explanation, title }) {
  return (
    <div className="card xai">
      <div className="card-head">
        <div className="row gap-sm">
          <span className="feature-icon sm"><BrainCircuit size={18} /></span>
          <div>
            <span className="eyebrow">Explainable AI rationale</span>
            <h3>Why “{title}”?</h3>
          </div>
        </div>
      </div>
      <blockquote>{explanation.summary}</blockquote>

      <div className="grid-3">
        <div>
          <h5><Scale size={14} /> Quantified trade-offs</h5>
          <ul className="bullets">
            {explanation.keyTradeoffs.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
        <div>
          <h5><Leaf size={14} /> Sustainability evidence</h5>
          <ul className="bullets">
            {explanation.ecoHighlights.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
        <div>
          <h5><Lightbulb size={14} /> Eco-nudges</h5>
          <ul className="bullets">
            {explanation.actionableTips.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
