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
  work:        ['date', 'airline', 'flightNumber', 'origin', 'destination', 'tailNumber', 'type', 'night', 'actualInstrument', 'takeoffs', 'landings', 'approachType', 'crew', 'passengerCount', 'remarks'],
  commuting:   ['date', 'airline', 'flightNumber', 'origin', 'destination', 'type', 'tailNumber', 'remarks'],
  deadhead:    ['date', 'airline', 'flightNumber', 'origin', 'destination', 'remarks'],
  instruction: ['date', 'type', 'tailNumber', 'origin', 'destination', 'night', 'actualInstrument', 'takeoffs', 'landings', 'approachType', 'crew', 'remarks'],
  sim:         ['date', 'type', 'actualInstrument', 'approachType', 'crew', 'remarks'],
  pleasure:    ['date', 'type', 'tailNumber', 'origin', 'destination', 'night', 'actualInstrument', 'takeoffs', 'landings', 'approachType', 'passengerCount', 'remarks'],
  other:       ['date', 'airline', 'flightNumber', 'origin', 'destination', 'tailNumber', 'type', 'night', 'actualInstrument', 'takeoffs', 'landings', 'approachType', 'crew', 'passengerCount', 'remarks'],
};

// ─── Field configuration ───────────────────────────────────────────────────
const FIELD_CONFIG = {
  date:             { label: 'Date',                      type: 'date',     required: true },
  airline:          { label: 'Airline',                   type: 'text' },
  flightNumber:     { label: 'Flight Number',             type: 'text' },
  origin:           { label: 'Origin',                    type: 'text' },
  destination:      { label: 'Destination',               type: 'text' },
  tailNumber:       { label: 'Tail Number',               type: 'text' },
  type:             { label: 'Aircraft Type / Make & Model', type: 'text' },
  night:            { label: 'Night Hours',               type: 'number',   step: '0.1' },
  actualInstrument: { label: 'Actual Instrument Hours',   type: 'number',   step: '0.1' },
  takeoffs:         { label: 'Takeoffs',                  type: 'radio',    options: [{ value: 'day', label: 'Day' }, { value: 'night', label: 'Night' }] },
  landings:         { label: 'Landings',                  type: 'radio',    options: [{ value: 'day', label: 'Day' }, { value: 'night', label: 'Night' }] },
  approachType:     { label: 'Approach Type',             type: 'text' },
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
  const initial = {
    date: '',
    flightNumber: '',
    origin: '',
    ...Object.fromEntries(fields.map(f => [f, '']))
  };
  const [formData, setFormData] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleChange = e => {
    let { name, value } = e.target;
    if (name === 'origin' || name === 'destination') {
      value = value.toUpperCase();
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleLookupKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLookup();
    }
  };

  const handleLookup = async () => {
    if (!formData.date || !formData.flightNumber || !formData.origin) {
      alert('Please fill in Date, Flight Number, and Origin before searching.');
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(
        `/api/lookup?date=${encodeURIComponent(formData.date)}&flightNumber=${encodeURIComponent(formData.flightNumber)}&origin=${encodeURIComponent(formData.origin)}`
      );
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Flight lookup failed.');
      } else {
        const data = await res.json();
        // Update form state with the fetched flight data
        setFormData(prev => ({
          ...prev,
          ...data
        }));
      }
    } catch (err) {
      console.error('Lookup request error:', err);
      alert('Error connecting to the lookup service.');
    }
    setSearching(false);
  };

  const handleSubmit = e => {
    e.preventDefault();
    setSaving(true);
    try {
      addDoc(collection(db, 'flights'), { ...formData, reason: reason.label });
      onSuccess();
    } catch (err) {
      console.error('Error saving flight:', err);
      alert('Error saving flight. Please try again.');
    }
    setSaving(false);
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
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Set-apart core & lookup section */}
        <div style={{
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.02)',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'end'
        }}>
          <div className="input-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
            <label>Date<span style={{ color: 'var(--accent-color)' }}> *</span></label>
            <input
              type="date"
              name="date"
              required
              value={formData.date}
              onChange={handleChange}
              onKeyDown={handleLookupKeyDown}
            />
          </div>
          <div className="input-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
            <label>Flight Number</label>
            <input
              type="text"
              name="flightNumber"
              value={formData.flightNumber}
              onChange={handleChange}
              onKeyDown={handleLookupKeyDown}
            />
          </div>
          <div className="input-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
            <label>Origin</label>
            <input
              type="text"
              name="origin"
              value={formData.origin}
              onChange={handleChange}
              onKeyDown={handleLookupKeyDown}
            />
          </div>
          <div style={{ flex: '0 0 auto' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '12px 24px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={handleLookup}
              disabled={searching || saving}
            >
              {searching ? 'Searching...' : 'Lookup'}
            </button>
          </div>
        </div>

        {/* Other fields */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}>
          {fields.filter(fieldKey => !['date', 'flightNumber', 'origin'].includes(fieldKey)).map(fieldKey => {
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
                  />
                ) : config.type === 'radio' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', height: '42px' }}>
                    {config.options.map(opt => (
                      <label key={opt.value} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', margin: 0, fontWeight: 'normal' }}>
                        <input
                          type="radio"
                          name={fieldKey}
                          value={opt.value}
                          checked={formData[fieldKey] === opt.value}
                          onChange={handleChange}
                          style={{ width: 'auto', margin: 0 }}
                        />
                        {opt.label}
                      </label>
                    ))}
                    {formData[fieldKey] && (
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '2px 8px', fontSize: '0.75rem', height: '24px' }}
                        onClick={() => setFormData(prev => ({ ...prev, [fieldKey]: '' }))}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                ) : (
                  <input
                    type={config.type}
                    name={fieldKey}
                    required={config.required}
                    step={config.step}
                    value={formData[fieldKey]}
                    onChange={handleChange}
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
              disabled={searching || saving}
            >
              {saving ? 'Saving to Cloud...' : `Save ${reason.label} Flight`}
            </button>
          </div>
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
