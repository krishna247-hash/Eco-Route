import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Planner from './pages/Planner.jsx';
import Dashboard from './pages/Dashboard.jsx';
import MyTrips from './pages/MyTrips.jsx';
import TripPass from './pages/TripPass.jsx';

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/trips" element={<MyTrips />} />
          <Route path="/trips/:id" element={<TripPass />} />
          <Route
            path="*"
            element={
              <div className="container section center">
                <h1>Page not found</h1>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
