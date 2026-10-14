import React, { useState } from 'react';
import { ShieldAlert, Building2, Users, AlertTriangle, Calculator, MapPin, Search } from 'lucide-react';

const mockEvents = [
  { id: 1, name: 'Havarisani prekid - Janka Čmelika', radius: 400, basePop: 3200, facilities: ['PU Radosno detinjstvo (Vrtić)', 'OŠ Dositej Obradović'], riskLevel: 'Visok' },
  { id: 2, name: 'Planirani radovi - Liman 3', radius: 600, basePop: 5400, facilities: ['Dom zdravlja Liman', 'Baletska škola'], riskLevel: 'Srednji' },
  { id: 3, name: 'Ispiranje mreže - Sremska Kamenica', radius: 300, basePop: 1800, facilities: ['Institut Sremska Kamenica (Cisterna active)'], riskLevel: 'Kritičan' },
];

const allFacilities = [
  { id: 1, name: 'Klinički centar Vojvodine', category: 'Zdravstvo', priority: 'Kritičan', usersAffected: '1.200 bolesnika', riskScore: 'Visok' },
  { id: 2, name: 'Dom zdravlja Liman', category: 'Zdravstvo', priority: 'Visok', usersAffected: '~3.000 poseta/dan', riskScore: 'Srednji' },
  { id: 3, name: 'PU Radosno detinjstvo (Vrtić)', category: 'Vrtić', priority: 'Visok', usersAffected: '280 dece', riskScore: 'Srednji' },
  { id: 4, name: 'Gimnazija Jovan Jovanović Zmaj', category: 'Škola', priority: 'Srednji', usersAffected: '1.000 učenika', riskScore: 'Nizak' },
];

export default function Exposure() {
  const [selectedEventId, setSelectedEventId] = useState(1);
  const [customRadius, setCustomRadius] = useState(400);

  const currentEvent = mockEvents.find(e => e.id === Number(selectedEventId));
 
  const calculatedPopulation = Math.round(currentEvent.basePop * (customRadius / currentEvent.radius));

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.25rem' }}>
          Prostorna Analiza & Izloženost
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
          Demonstracija prostorne analize: Procena ranjivosti i izloženosti stanovništva i objekata u radijusu prekida.
        </p>
      </div>

      {}
      <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #0284c7', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.08)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0284c7', marginBottom: '1rem' }}>
          <Calculator size={22} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>Interaktivni Simulator Uticaja Događaja</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
          {}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>
              Odaberite Događaj / Lokaciju prekida:
            </label>
            <select 
              value={selectedEventId} 
              onChange={(e) => setSelectedEventId(e.target.value)}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', backgroundColor: '#f8fafc', fontWeight: '600', cursor: 'pointer' }}
            >
              {mockEvents.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          </div>

          {}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>Radijus prostornog uticaja:</label>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0284c7' }}>{customRadius} metara</span>
            </div>
            <input 
              type="range" 
              min="100" 
              max="1000" 
              step="50"
              value={customRadius} 
              onChange={(e) => setCustomRadius(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#0284c7', cursor: 'pointer' }}
            />
          </div>

          {}
          <div style={{ backgroundColor: '#f0f9ff', padding: '1rem', borderRadius: '10px', border: '1px solid #bae6fd' }}>
            <div style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: '600', textTransform: 'uppercase' }}>Procena Izloženosti Stanovništva</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0c4a6e', marginTop: '0.2rem' }}>
              ~{calculatedPopulation.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>stanovnika</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#0284c7', marginTop: '0.2rem' }}>
              Procena na osnovu Population Grid mreže
            </div>
          </div>
        </div>

        {}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed #cbd5e1' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>Kritični objekti u zoni zahvaćenosti: </span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {currentEvent.facilities.map((fac, idx) => (
              <span key={idx} style={{ padding: '0.3rem 0.75rem', borderRadius: '16px', backgroundColor: '#ffe4e6', color: '#e11d48', fontSize: '0.8rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Building2 size={14} /> {fac}
              </span>
            ))}
          </div>
        </div>
      </div>

      {}
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>Kritična Infrastruktura na GIS Mreži</h3>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600' }}>
              <th style={{ padding: '1rem' }}>Ustanova</th>
              <th style={{ padding: '1rem' }}>Kategorija</th>
              <th style={{ padding: '1rem' }}>Korisnici</th>
              <th style={{ padding: '1rem' }}>Prioritet</th>
            </tr>
          </thead>
          <tbody>
            {allFacilities.map((fac) => (
              <tr key={fac.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem', fontWeight: '600', color: '#0f172a' }}>{fac.name}</td>
                <td style={{ padding: '1rem', color: '#475569' }}>{fac.category}</td>
                <td style={{ padding: '1rem', color: '#334155' }}>{fac.usersAffected}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.6rem', 
                    borderRadius: '20px', 
                    fontSize: '0.78rem', 
                    fontWeight: '600',
                    backgroundColor: fac.priority === 'Kritičan' ? '#ffe4e6' : '#fef3c7',
                    color: fac.priority === 'Kritičan' ? '#e11d48' : '#d97706'
                  }}>
                    {fac.priority}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}