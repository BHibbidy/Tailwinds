import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalFlights: 0, totalPassengers: 0, totalNight: 0 });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'flights'), (snapshot) => {
      let flights = snapshot.size;
      let passengers = 0;
      let nightHours = 0;
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.passengerCount) passengers += Number(data.passengerCount);
        if (data.night) nightHours += Number(data.night);
      });
      
      setStats({ totalFlights: flights, totalPassengers: passengers, totalNight: nightHours });
    });
    
    return () => unsubscribe();
  }, []);

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2>Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
        <div className="glass-panel" style={{ textAlign: 'center', borderColor: 'var(--accent-color)', borderWidth: '2px' }}>
          <h3 style={{ fontSize: '2.5rem', color: 'var(--accent-color)', marginBottom: '8px' }}>{stats.totalFlights}</h3>
          <p style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Total Flights</p>
        </div>
        <div className="glass-panel" style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{stats.totalPassengers}</h3>
          <p style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Total Passengers</p>
        </div>
        <div className="glass-panel" style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{stats.totalNight}</h3>
          <p style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Night Hours</p>
        </div>
      </div>
    </div>
  );
}
