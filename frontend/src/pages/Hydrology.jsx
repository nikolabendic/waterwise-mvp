import React, { useState, useEffect } from 'react';
import { Waves, Thermometer, Wind, RefreshCw, Calendar, MapPin } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Početni rezervni podaci (fallback)
const initialLatest = {
  station: 'Novi Sad',
  river: 'Dunav',
  timestamp: 'Danas',
  water_level_cm: -85,
  water_temperature_c: 18,
  flow_m3_s: 860.0
};

const initialHistory = [
  { timestamp: '20.10.', water_level_cm: -90, water_temperature_c: 16.2, flow_m3_s: 840 },
  { timestamp: '21.10.', water_level_cm: -88, water_temperature_c: 16.0, flow_m3_s: 850 },
  { timestamp: '22.10.', water_level_cm: -86, water_temperature_c: 15.8, flow_m3_s: 860 }
];

export default function Hydrology() {
  const [latestData, setLatestData] = useState(initialLatest);
  const [historyData, setHistoryData] = useState(initialHistory);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('water_level_cm'); // 'water_level_cm', 'water_temperature_c', 'flow_m3_s'

  const fetchHydrologyData = async () => {
    setLoading(true);
    const baseUrl = import.meta.env.VITE_API_URL || 'http://82.117.203.34:8000/api/v1';

    try {
      // 1. Povlačenje najnovijih merenja za stanicu Novi Sad (RHMZ-NS)
      const latestRes = await fetch(`${baseUrl}/hydrology/latest/?station_id=RHMZ-NS`);
      if (latestRes.ok) {
        const data = await latestRes.json();
        if (data) {
          setLatestData({
            station: data?.station?.name || data?.station_id || 'Novi Sad',
            river: data?.station?.river || 'Dunav',
            timestamp: data?.timestamp ? new Date(data.timestamp).toLocaleString('sr-RS') : 'Trenutno',
            water_level_cm: data?.water_level_cm ?? -86,
            water_temperature_c: data?.water_temperature_c ?? 15.8,
            flow_m3_s: data?.flow_m3_s ?? 860.0
          });
        }
      }

      // 2. Povlačenje istorijskih podataka za grafik (7 dana)
      const historyRes = await fetch(`${baseUrl}/hydrology/history/?station_id=RHMZ-NS&period=7d`);
      if (historyRes.ok) {
        const hData = await historyRes.json();
        const results = Array.isArray(hData) ? hData : (hData?.results || []);
        
        if (results.length > 0) {
          const formattedHistory = results.map(item => ({
            timestamp: item?.timestamp ? new Date(item.timestamp).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' }) : '',
            water_level_cm: item?.water_level_cm ?? 0,
            water_temperature_c: item?.water_temperature_c ?? 0,
            flow_m3_s: item?.flow_m3_s ?? 0
          }));
          setHistoryData(formattedHistory);
        }
      }
    } catch (err) {
      console.log('API /hydrology/ nedostupan, koriste se inicijalni podaci.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHydrologyData();
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Zaglavlje */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.25rem' }}>
            Hidrološki podaci -  {latestData.river}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
            Real-time praćenje vodostaja, temperature vode i protoka reke Dunav.
          </p>
        </div>

        <button 
          onClick={fetchHydrologyData}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#fff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            color: '#475569',
            fontWeight: '500'
          }}
        >
          <RefreshCw size={16} />
          {loading ? 'Učitavanje...' : 'Osveži podatke'}
        </button>
      </div>

      {/* Kartice sa trenutnim merenjima */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Vodostaj */}
        <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Vodostaj</span>
            <Waves size={22} color="#0284c7" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a', marginTop: '0.5rem' }}>
            {latestData.water_level_cm !== null ? `${latestData.water_level_cm} cm` : '---'}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
            Ažurirano: {latestData.timestamp}
          </span>
        </div>

        {/* Temperatura vode */}
        <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Temperatura vode</span>
            <Thermometer size={22} color="#e11d48" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a', marginTop: '0.5rem' }}>
            {latestData.water_temperature_c !== null ? `${latestData.water_temperature_c} °C` : '---'}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
            Ažurirano: {latestData.timestamp}
          </span>
        </div>

        {/* Protok */}
        <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Protok reke</span>
            <Wind size={22} color="#059669" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a', marginTop: '0.5rem' }}>
            {latestData.flow_m3_s !== null ? `${latestData.flow_m3_s} m³/s` : '---'}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
            Ažurirano: {latestData.timestamp}
          </span>
        </div>
      </div>

      {/* Grafik istorijskih podataka */}
      <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>
            Istorijski pregled (7 dana)
          </h3>

          {/* Tabovi za izbor parametra na grafiku */}
          <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '8px' }}>
            <button 
              onClick={() => setActiveTab('water_level_cm')}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: activeTab === 'water_level_cm' ? '#fff' : 'transparent',
                color: activeTab === 'water_level_cm' ? '#0284c7' : '#64748b',
                boxShadow: activeTab === 'water_level_cm' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              Vodostaj (cm)
            </button>
            <button 
              onClick={() => setActiveTab('water_temperature_c')}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: activeTab === 'water_temperature_c' ? '#fff' : 'transparent',
                color: activeTab === 'water_temperature_c' ? '#e11d48' : '#64748b',
                boxShadow: activeTab === 'water_temperature_c' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              Temperatura (°C)
            </button>
            <button 
              onClick={() => setActiveTab('flow_m3_s')}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: activeTab === 'flow_m3_s' ? '#fff' : 'transparent',
                color: activeTab === 'flow_m3_s' ? '#059669' : '#64748b',
                boxShadow: activeTab === 'flow_m3_s' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              Protok (m³/s)
            </button>
          </div>
        </div>

        {/* Recharts Grafik */}
        <div style={{ width: '100%', height: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e11d48" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey={activeTab} 
                stroke={activeTab === 'water_level_cm' ? '#0284c7' : activeTab === 'water_temperature_c' ? '#e11d48' : '#059669'} 
                fillOpacity={1} 
                fill={`url(#${activeTab === 'water_level_cm' ? 'colorLevel' : activeTab === 'water_temperature_c' ? 'colorTemp' : 'colorFlow'})`} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}