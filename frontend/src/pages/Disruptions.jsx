import React, { useState } from 'react';
import { AlertTriangle, Search, Filter, Calendar, MapPin, CheckCircle, Clock } from 'lucide-react';

const initialEvents = [
  { id: 1, title: 'Prekid vodosnabdevanja', location: 'Janka Čmelika', date: '02.07.2026.', time: '08:00 - 14:00', status: 'Završen', type: 'Planirani radovi', description: 'Planirana zamena dela vodovodne cevi u ulici Janka Čmelika.' },
  { id: 2, title: 'Havarija na mreži', location: 'Bulevar kneza Miloša', date: '31.07.2026.', time: '11:30 - 18:00', status: 'Završen', type: 'Hitna intervencija', description: 'Sanacija havarije na magistralnom cevovodu.' },
  { id: 3, title: 'Prekid vodosnabdevanja', location: 'Sremska Kamenica', date: '02.07.2026.', time: '09:00 - 15:00', status: 'Završen', type: 'Radovi na rezervoaru', description: 'Ispiranje i dezinfekcija rezervoara Sremska Kamenica.' },
  { id: 4, title: 'Ispiranje vodovodne mreže', location: 'Liman 3', date: '12.08.2026.', time: '22:00 - 05:00', status: 'Planirano', type: 'Redovno održavanje', description: 'Redovno noćno ispiranje mreže na teritoriji MZ Liman 3.' }
];

export default function Disruptions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Sve');

  const filteredEvents = initialEvents.filter(event => {
    const matchesSearch = event.location.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          event.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Sve' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.25rem' }}>
          Događaji i Prekidi Vodosnabdevanja
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
          Evidencija planiranih radova, havarija i istorijskih prekida vodosnabdevanja na teritoriji Novog Sada.
        </p>
      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Ukupno zabeleženo</span>
            <AlertTriangle size={20} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', marginTop: '0.5rem' }}>{initialEvents.length}</div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Planirane aktivnosti</span>
            <Clock size={20} color="#eab308" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', marginTop: '0.5rem' }}>
            {initialEvents.filter(e => e.status === 'Planirano').length}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Sanirani prekidi</span>
            <CheckCircle size={20} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', marginTop: '0.5rem' }}>
            {initialEvents.filter(e => e.status === 'Završen').length}
          </div>
        </div>
      </div>

      {}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Pretraži po lokaciji ili nazivu..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
          />
        </div>

        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', backgroundColor: '#fff', cursor: 'pointer' }}
        >
          <option value="Sve">Svi statusi</option>
          <option value="Završen">Završen</option>
          <option value="Planirano">Planirano</option>
        </select>
      </div>

      {}
      <div style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600' }}>
              <th style={{ padding: '1rem' }}>Događaj</th>
              <th style={{ padding: '1rem' }}>Lokacija</th>
              <th style={{ padding: '1rem' }}>Datum & Vreme</th>
              <th style={{ padding: '1rem' }}>Tip</th>
              <th style={{ padding: '1rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map((event) => (
              <tr key={event.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem', fontWeight: '600', color: '#0f172a' }}>{event.title}</td>
                <td style={{ padding: '1rem', color: '#334155' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={15} color="#64748b" /> {event.location}
                  </span>
                </td>
                <td style={{ padding: '1rem', color: '#475569' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{event.date}</span>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{event.time}</span>
                  </div>
                </td>
                <td style={{ padding: '1rem', color: '#475569' }}>{event.type}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.6rem', 
                    borderRadius: '20px', 
                    fontSize: '0.78rem', 
                    fontWeight: '600',
                    backgroundColor: event.status === 'Završen' ? '#dcfce7' : '#fef9c3',
                    color: event.status === 'Završen' ? '#166534' : '#854d0e'
                  }}>
                    {event.status}
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