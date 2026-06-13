import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalFlights: 0,
    totalPassengers: 0,
    last30Days: 0,
    last365Days: 0,
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'flights'), (snapshot) => {
      const now = new Date();
      const ms30 = 30 * 24 * 60 * 60 * 1000;
      const ms365 = 365 * 24 * 60 * 60 * 1000;

      let totalFlights = snapshot.size;
      let totalPassengers = 0;
      let last30Days = 0;
      let last365Days = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.passengerCount) totalPassengers += Number(data.passengerCount);

        if (data.date) {
          const flightDate = new Date(data.date);
          const diff = now - flightDate;
          if (diff <= ms30) last30Days++;
          if (diff <= ms365) last365Days++;
        }
      });

      setStats({ totalFlights, totalPassengers, last30Days, last365Days });
    });

    return () => unsubscribe();
  }, []);

  const StatCard = ({ value, label, accent }) => (
    <div
      className="glass-panel"
      style={{
        textAlign: 'center',
        borderColor: accent ? 'var(--accent-color)' : 'var(--card-border)',
        borderWidth: accent ? '2px' : '1px',
      }}
    >
      <h3 style={{ fontSize: '2.5rem', color: accent ? 'var(--accent-color)' : 'var(--text-color)', marginBottom: '8px' }}>
        {value}
      </h3>
      <p style={{ color: 'var(--text-muted)', fontWeight: '500' }}>{label}</p>
    </div>
  );

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2>Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
        <StatCard value={stats.totalFlights} label="Total Flights" accent={true} />
        <StatCard value={stats.totalPassengers} label="Total Passengers" />
        <StatCard value={stats.last30Days} label="Flights (Last 30 Days)" />
        <StatCard value={stats.last365Days} label="Flights (Last 365 Days)" />
      </div>
    </div>
  );
}
