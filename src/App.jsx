import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import FlightList from './components/FlightList';
import FlightForm from './components/FlightForm';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <div className="container">
      <header className="glass-panel" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ color: 'var(--accent-color)' }}>Tailwinds</h1>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => setCurrentView('dashboard')}>Dashboard</button>
          <button className="btn-secondary" onClick={() => setCurrentView('logbook')}>Logbook</button>
          <button className="btn-primary" onClick={() => setCurrentView('add')}>+ New Flight</button>
        </div>
      </header>

      <main>
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'logbook' && <FlightList />}
        {currentView === 'add' && <FlightForm onSuccess={() => setCurrentView('logbook')} />}
      </main>
    </div>
  );
}

export default App;
