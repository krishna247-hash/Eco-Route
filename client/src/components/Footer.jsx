import { Leaf } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer no-print">
      <div className="container footer-inner">
        <div className="row gap-sm">
          <span className="brand-logo sm">
            <Leaf size={14} />
          </span>
          <strong>EcoRoute Project</strong>
          <span className="muted">— Multi-Objective Carbon Optimization Framework (MERN)</span>
        </div>
        <p className="muted">Emission factors follow DEFRA 2023 &amp; ICAO greenhouse-gas accounting guidance.</p>
      </div>
    </footer>
  );
}
