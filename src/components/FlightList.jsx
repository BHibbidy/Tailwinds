import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function FlightList() {
  const [flights, setFlights] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'flights'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const flightData = [];
      snapshot.forEach((doc) => flightData.push({ id: doc.id, ...doc.data() }));
      setFlights(flightData);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2>Your Flights</h2>
      {flights.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>No flights recorded yet.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 8px', fontWeight: '500' }}>Date</th>
                <th style={{ padding: '12px 8px', fontWeight: '500' }}>Flight No.</th>
                <th style={{ padding: '12px 8px', fontWeight: '500' }}>Route</th>
                <th style={{ padding: '12px 8px', fontWeight: '500' }}>Type</th>
                <th style={{ padding: '12px 8px', fontWeight: '500' }}>Tail No.</th>
              </tr>
            </thead>
            <tbody>
              {flights.map(flight => (
                <tr key={flight.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 8px' }}>{flight.date}</td>
                  <td style={{ padding: '12px 8px', fontWeight: '600', color: 'var(--accent-color)' }}>{flight.flightNumber || '-'}</td>
                  <td style={{ padding: '12px 8px' }}>{flight.origin} → {flight.destination}</td>
                  <td style={{ padding: '12px 8px' }}>{flight.type}</td>
                  <td style={{ padding: '12px 8px' }}>{flight.tailNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
