import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

// ─── Reason definitions ────────────────────────────────────────────────────
const REASONS = [
  { id: 'work',        label: 'Work',        description: 'Flying as working crew' },
  { id: 'commuting',   label: 'Commuting',   description: 'Positioning to or from work' },
  { id: 'deadhead',    label: 'Deadhead',    description: 'Riding as a passenger on duty' },
  { id: 'instruction', label: 'Instruction', description: 'Flight training or instruction' },
  { id: 'sim',         label: 'Sim Event',   description: 'Simulator training session' },
  { id: 'pleasure',    label: 'Pleasure',    description: 'Personal or leisure flying' },
  { id: 'other',       label: 'Other',       description: 'Anything else' },
];

// ─── Which fields appear for each reason ──────────────────────────────────
const FIELD_SETS = {
  work:        ['date', 'airline', 'flightNumber', 'origin', 'destination', 'tailNumber', 'type', 'night', 'actualInstrument', 'dayTakeoffs', 'nightTakeoffs', 'dayLandings', 'nightLandings', 'approachType', 'crew', 'passengerCount', 'remarks'],
  commuting:   ['date', 'airline', 'flightNumber', 'origin', 'destination', 'type', 'tailNumber', 'remarks'],
  deadhead:    ['date', 'airline', 'flightNumber', 'origin', 'destination', 'remarks'],
  instruction: ['date', 'type', 'tailNumber', 'origin', 'destination', 'night', 'actualInstrument', 'dayTakeoffs', 'nightTakeoffs', 'dayLandings', 'nightLandings', 'approachType', 'crew', 'remarks'],
  sim:         ['date', 'type', 'actualInstrument', 'approachType', 'crew', 'remarks'],
  pleasure:    ['date', 'type', 'tailNumber', 'origin', 'destination', 'night', 'actualInstrument', 'dayTakeoffs', 'nightTakeoffs', 'dayLandings', 'nightLandings', 'approachType', 'passengerCount', 'remarks'],
  other:       ['date', 'airline', 'flightNumber', 'origin', 'destination', 'tailNumber', 'type', 'night', 'actualInstrument', 'dayTakeoffs', 'nightTakeoffs', 'dayLandings', 'nightLandings', 'approachType', 'crew', 'passengerCount', 'remarks'],
};

// ─── Field configuration ───────────────────────────────────────────────────
const FIELD_CONFIG = {
  date:             { label: 'Date',                      type: 'date',     required: true },
  airline:          { label: 'Airline',                   type: 'text',     placeholder: 'e.g. Delta, United' },
  flightNumber:     { label: 'Flight Number',             type: 'text',     placeholder: 'e.g. DL 404' },
  origin:           { label: 'Origin',                    type: 'text',     placeholder: 'e.g. KJFK' },
  destination:      { label: 'Destination',               type: 'text',     placeholder: 'e.g. KLAX' },
  tailNumber:       { label: 'Tail Number',               type: 'text',     placeholder: 'e.g. N12345' },
  type:             { label: 'Aircraft Type / Make & Model', type: 'text',  placeholder: 'e.g. B737, C172' },
  night:            { label: 'Night Hours',               type: 'number',   step: '0.1' },
  actualInstrument: { label: 'Actual Instrument Hours',   type: 'number',   step: '0.1' },
  dayTakeoffs:      { label: 'Day Takeoffs',              type: 'number' },
  nightTakeoffs:    { label: 'Night Takeoffs',            type: 'number' },
  dayLandings:      { label: 'Day Landings',              type: 'number' },
  nightLandings:    { label: 'Night Landings',            type: 'number' },
  approachType:     { label: 'Approach Type',             type: 'text',     placeholder: 'e.g. ILS, RNAV, VFR' },
  crew:             { label: 'Crew',                      type: 'text',     wide: true },
  passengerCount:   { label: 'Passenger Count',           type: 'number' },
  remarks:          { label: 'Remarks',                   type: 'textarea', wide: true },
};

// Label overrides for Sim reason
const SIM_OVERRIDES = {
  type:             'Sim Device / Type',
  actualInstrument: 'Simulated Instrument Hours',
  approachType:     'Approach Types Practiced',
};

// ─── Reason Picker ─────────────────────────────────────────────────────────
function ReasonPicker({ onSelect }) {
  return (
    <div className="glass-panel" style={{ maxWidth: '480px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '24px' }}>New Flight</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {REASONS.map(reason => (
          <button
            key={reason.id}
            id={`reason-btn-${reason.id}`}
            onClick={() => onSelect(reason)}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '16px 20px',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'Inter, sans-serif',
              fontWeight: '500',
              fontSize: '1rem',
              color: 'var(--text-color)',
              backdropFilter: 'blur(12px)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent-color)';
              e.currentTarget.style.color = 'var(--accent-color)';
              e.currentTarget.style.background = 'var(--accent-light)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-color)';
              e.currentTarget.style.background = 'var(--card-bg)';
            }}
          >
            {reason.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Flight Form ───────────────────────────────────────────────────────────
function FlightEntryForm({ reason, onSuccess, onBack }) {
  const fields = FIELD_SETS[reason.id];
  const initial = Object.fromEntries(fields.map(f => [f, '']));
  const [formData, setFormData] = useState(initial);
  const [loading, setLoading] = useState(false);

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'flights'), { ...formData, reason: reason.label });
      onSuccess();
    } catch (err) {
      console.error('Error saving flight:', err);
      alert('Error saving flight. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <button
          onClick={onBack}
          className="btn-secondary"
          style={{ padding: '8px 16px', fontSize: '0.875rem' }}
        >
          ← Back
        </button>
        <div>
          <h2 style={{ color: 'var(--accent-color)', margin: 0 }}>
            {reason.label}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            {reason.description}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
      }}>
        {fields.map(fieldKey => {
          const config = FIELD_CONFIG[fieldKey];
          const label = reason.id === 'sim' && SIM_OVERRIDES[fieldKey]
            ? SIM_OVERRIDES[fieldKey]
            : config.label;
          const isWide = config.wide;

          return (
            <div
              key={fieldKey}
              className="input-group"
              style={{ gridColumn: isWide ? '1 / -1' : undefined, marginBottom: 0 }}
            >
              <label>{label}{config.required && <span style={{ color: 'var(--accent-color)' }}> *</span>}</label>
              {config.type === 'textarea' ? (
                <textarea
                  name={fieldKey}
                  rows="3"
                  value={formData[fieldKey]}
                  onChange={handleChange}
                  placeholder={config.placeholder}
                />
              ) : (
                <input
                  type={config.type}
                  name={fieldKey}
                  required={config.required}
                  step={config.step}
                  value={formData[fieldKey]}
                  onChange={handleChange}
                  placeholder={config.placeholder}
                />
              )}
            </div>
          );
        })}

        <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
          <button
            type="submit"
            id="submit-flight-btn"
            className="btn-primary"
            style={{ width: '100%', fontSize: '1.05rem', padding: '16px' }}
            disabled={loading}
          >
            {loading ? 'Saving to Cloud...' : `Save ${reason.label} Flight`}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────
export default function FlightForm({ onSuccess }) {
  const [selectedReason, setSelectedReason] = useState(null);

  if (!selectedReason) {
    return <ReasonPicker onSelect={setSelectedReason} />;
  }

  return (
    <FlightEntryForm
      reason={selectedReason}
      onSuccess={onSuccess}
      onBack={() => setSelectedReason(null)}
    />
  );
}
