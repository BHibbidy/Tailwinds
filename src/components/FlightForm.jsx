import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function FlightForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    date: '', airline: '', flightNumber: '', reason: '', type: '', origin: '', destination: '', tailNumber: '', night: '', actualInstrument: '', dayTakeoffs: '', nightTakeoffs: '', dayLandings: '', nightLandings: '', approachType: '', crew: '', remarks: '', passengerCount: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'flights'), formData);
      onSuccess();
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Error saving flight.");
    }
    setLoading(false);
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '24px', color: 'var(--accent-color)' }}>Log New Flight</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        
        <div className="input-group">
          <label>Date *</label>
          <input type="date" name="date" required onChange={handleChange} value={formData.date} />
        </div>
        <div className="input-group">
          <label>Airline</label>
          <input type="text" name="airline" onChange={handleChange} value={formData.airline} />
        </div>
        <div className="input-group">
          <label>Flight Number</label>
          <input type="text" name="flightNumber" onChange={handleChange} value={formData.flightNumber} />
        </div>
        <div className="input-group">
          <label>Reason</label>
          <input type="text" name="reason" onChange={handleChange} value={formData.reason} />
        </div>
        <div className="input-group">
          <label>Type / Make Model</label>
          <input type="text" name="type" onChange={handleChange} value={formData.type} />
        </div>
        <div className="input-group">
          <label>Origin</label>
          <input type="text" name="origin" onChange={handleChange} value={formData.origin} placeholder="e.g. KJFK" />
        </div>
        <div className="input-group">
          <label>Destination</label>
          <input type="text" name="destination" onChange={handleChange} value={formData.destination} placeholder="e.g. KLAX" />
        </div>
        <div className="input-group">
          <label>Tail Number</label>
          <input type="text" name="tailNumber" onChange={handleChange} value={formData.tailNumber} />
        </div>
        
        {/* Expanded Details */}
        <div className="input-group">
          <label>Night Hours</label>
          <input type="number" step="0.1" name="night" onChange={handleChange} value={formData.night} />
        </div>
        <div className="input-group">
          <label>Actual Instrument Hours</label>
          <input type="number" step="0.1" name="actualInstrument" onChange={handleChange} value={formData.actualInstrument} />
        </div>
        <div className="input-group">
          <label>Day Takeoffs</label>
          <input type="number" name="dayTakeoffs" onChange={handleChange} value={formData.dayTakeoffs} />
        </div>
        <div className="input-group">
          <label>Night Takeoffs</label>
          <input type="number" name="nightTakeoffs" onChange={handleChange} value={formData.nightTakeoffs} />
        </div>
        <div className="input-group">
          <label>Day Landings</label>
          <input type="number" name="dayLandings" onChange={handleChange} value={formData.dayLandings} />
        </div>
        <div className="input-group">
          <label>Night Landings</label>
          <input type="number" name="nightLandings" onChange={handleChange} value={formData.nightLandings} />
        </div>
        <div className="input-group">
          <label>Approach Type</label>
          <input type="text" name="approachType" onChange={handleChange} value={formData.approachType} />
        </div>
        <div className="input-group">
          <label>Passenger Count</label>
          <input type="number" name="passengerCount" onChange={handleChange} value={formData.passengerCount} />
        </div>
        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
          <label>Crew</label>
          <input type="text" name="crew" onChange={handleChange} value={formData.crew} />
        </div>
        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
          <label>Remarks</label>
          <textarea name="remarks" rows="3" onChange={handleChange} value={formData.remarks}></textarea>
        </div>

        <div style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
          <button type="submit" className="btn-primary" style={{ width: '100%', fontSize: '1.1rem', padding: '16px' }} disabled={loading}>
            {loading ? 'Saving to Cloud...' : 'Save Flight Log'}
          </button>
        </div>
      </form>
    </div>
  );
}
