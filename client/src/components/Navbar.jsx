import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Leaf, Compass, BarChart3, Ticket, Menu, X } from 'lucide-react';

const LINKS = [
  { to: '/planner', label: 'Trip Planner', icon: Compass },
  { to: '/dashboard', label: 'Carbon Analytics', icon: BarChart3 },
  { to: '/trips', label: 'My Trips', icon: Ticket },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="navbar no-print">
      <div className="container navbar-inner">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-logo">
            <Leaf size={20} />
          </span>
          <span>
            <span className="brand-name">EcoRoute</span>
            <span className="brand-tag">AI</span>
            <small className="brand-sub">Carbon-Aware Itineraries</small>
          </span>
        </Link>

        <button className="nav-toggle" aria-label="Toggle menu" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="nav-link" onClick={() => setOpen(false)}>
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
