import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Droplets, Thermometer, TrendingDown, Activity, RefreshCw } from 'lucide-react';


const waterLevelData = [
  { day: '08. Okt', level: 260, flow: 2100 },
  { day: '09. Okt', level: 255, flow: 2050 },
  { day: '10. Okt', level: 252, flow: 2010 },
  { day: '11. Okt', level: 248, flow: 1980 },
  { day: '12. Okt', level: 246, flow: 1950 },
  { day: '13. Okt', level: 245, flow: 1930 },
  { day: '14. Okt', level: 243, flow: 1910 },
];

export default function Hydrology() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.25rem' }}>
            Hidrološki Pregled & Monitor
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
            Praćenje vodostaja Dunava, protoka vode i parametara na mernoj stanici Novi Sad.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fff', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#475569' }}>
          <RefreshCw size={14} color="#0284c7" />
          <span>Ažurirano: <b>Danas, 18:00h</b></span>
        </div>
      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Trenutni vodostaj</span>
            <Droplets size={20} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', marginTop: '0.5rem' }}>
            243 <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#64748b' }}>cm</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '2px', marginTop: '0.25rem' }}>
            Bezbedna zona (Redovna odbrana: 450 cm)
          </span>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Temperatura vode</span>
            <Thermometer size={20} color="#f97316" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', marginTop: '0.5rem' }}>
            16.4 <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#64748b' }}>°C</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
            Prosek za oktobar: 15.8 °C
          </span>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Trend vodostaja</span>
            <TrendingDown size={20} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', marginTop: '0.5rem' }}>
            -2 <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#64748b' }}>cm / 24h</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
            Blagi pad u protekla 3 dana
          </span>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Protok vode</span>
            <Activity size={20} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', marginTop: '0.5rem' }}>
            1.910 <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#64748b' }}>m³/s</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#16a34a', marginTop: '0.25rem', display: 'block' }}>
            Stabilan hidrološki režim
          </span>
        </div>
      </div>

      {}
      <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>
              Kretanje vodostaja Dunava (Novi Sad)
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Prikaz vodostaja u centimetrima po danima</p>
          </div>

          <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '6px' }}>
            {['24h', '7d', '30d'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: selectedPeriod === period ? '#fff' : 'transparent',
                  color: selectedPeriod === period ? '#0284c7' : '#64748b',
                  boxShadow: selectedPeriod === period ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div style={{ width: '100%', height: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={waterLevelData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
              <YAxis domain={['dataMin - 10', 'dataMax + 10']} stroke="#94a3b8" fontSize={12} unit=" cm" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '0.85rem' }}
                itemStyle={{ color: '#38bdf8' }}
              />
              <Area type="monotone" dataKey="level" stroke="#0284c7" strokeWidth={3} fillOpacity={1} fill="url(#colorLevel)" name="Vodostaj (cm)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}