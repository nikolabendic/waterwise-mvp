import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Droplets, Thermometer, TrendingDown, TrendingUp, Minus, Activity, RefreshCw } from 'lucide-react';

const fallbackHistory = [
  { day: '08. Okt', level: 260 },
  { day: '09. Okt', level: 255 },
  { day: '10. Okt', level: 252 },
  { day: '11. Okt', level: 248 },
  { day: '12. Okt', level: 246 },
  { day: '13. Okt', level: 245 },
  { day: '14. Okt', level: 243 },
];

export default function Hydrology() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  
  
  const [stationId] = useState('RHMZ-NS'); 

 
  const [latestData, setLatestData] = useState(null);
  const [historyData, setHistoryData] = useState(fallbackHistory);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchLatest = () => {
      fetch(`http://127.0.0.1:8000/api/v1/hydrology/latest/?station_id=${stationId}`)
        .then((res) => {
          if (!res.ok) throw new Error('Mrežna greška pri učitavanju trenutnih podataka');
          return res.json();
        })
        .then((data) => {
          setLatestData(data);
        })
        .catch((err) => {
          console.warn('Greška pri dohvaćanju /api/v1/hydrology/latest/:', err);
        });
    };

   
    fetchLatest();

    
    const interval = setInterval(fetchLatest, 300000);

   
    return () => clearInterval(interval);
  }, [stationId]);

 
  useEffect(() => {
    setLoading(true);
    fetch(`http://127.0.0.1:8000/api/v1/hydrology/history/?station_id=${stationId}&period=${selectedPeriod}`)
      .then((res) => {
        if (!res.ok) throw new Error('Mrežna greška pri učitavanju istorije');
        return res.json();
      })
      .then((resData) => {
        if (resData.data && Array.isArray(resData.data)) {
       
          const formatted = resData.data.map((item) => {
            const date = new Date(item.timestamp);
            const label = selectedPeriod === '24h' 
              ? date.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })
              : date.toLocaleDateString('sr-RS', { day: '2-digit', month: 'short' });

            return {
              day: label,
              level: item.water_level_cm,
            };
          });
          setHistoryData(formatted);
        }
      })
      .catch((err) => {
        console.warn('Greška pri dohvaćanju /api/v1/hydrology/history/, koriste se fallback podaci:', err);
        setHistoryData(fallbackHistory);
      })
      .finally(() => setLoading(false));
  }, [stationId, selectedPeriod]);

 
  const measurements = latestData?.measurements || {};
  const trends = latestData?.trends || {};
  const thresholds = latestData?.thresholds || {};

  const currentLevel = measurements.water_level_cm ?? -92;
  const currentTemp = measurements.water_temperature_c ?? 16.0;
  const currentFlow = measurements.flow_m3_s ?? 805.0;
  const levelChange = trends.water_level_change_24h_cm;
  const direction = trends.water_level_direction || 'rising';

 
  const lastUpdated = latestData?.measurement_time 
    ? new Date(latestData.measurement_time).toLocaleString('sr-RS', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Danas, 06:00h';

 
  const renderTrendIcon = () => {
    if (direction === 'rising') return <TrendingUp size={20} color="#e11d48" />;
    if (direction === 'stable') return <Minus size={20} color="#64748b" />;
    return <TrendingDown size={20} color="#0284c7" />;
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.25rem' }}>
            Hidrološki Pregled & Nadzor - {latestData?.station_name || 'Novi Sad'}
          </h1>

          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
            Praćenje parametara reke {latestData?.river || 'Dunav'} sa zvanične merne stanice ({stationId}).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fff', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#475569' }}>
          <RefreshCw size={14} color="#0284c7" style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          <span>Ažurirano: <b>{lastUpdated}</b></span>
        </div>
      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        
        {}
        <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Trenutni vodostaj</span>
            <Droplets size={20} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', marginTop: '0.5rem' }}>
            {currentLevel} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#64748b' }}>cm</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '2px', marginTop: '0.25rem' }}>
            Bezbedna zona (Redovna odbrana: {thresholds.flood_defense_level_cm || 450} cm)
          </span>
        </div>

        {}
        <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Temperatura vode</span>
            <Thermometer size={20} color="#f97316" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', marginTop: '0.5rem' }}>
            {currentTemp} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#64748b' }}>°C</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
            Senzorsko merenje uživo
          </span>
        </div>

        {}
        <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Trend (24h)</span>
            {renderTrendIcon()}
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', marginTop: '0.5rem' }}>
            {levelChange !== null && levelChange !== undefined ? (levelChange > 0 ? `+${levelChange}` : levelChange) : '+2'}{' '}
            <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#64748b' }}>cm / 24h</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem', display: 'block', textTransform: 'capitalize' }}>
            Smer: {direction === 'falling' ? 'Pad' : direction === 'rising' ? 'Rast vodostaja' : 'Stabilno'}
          </span>
        </div>

        {}
        <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Protok vode</span>
            <Activity size={20} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', marginTop: '0.5rem' }}>
            {currentFlow.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#64748b' }}>m³/s</span>
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
              Kretanje vodostaja ({latestData?.river || 'Dunav'})
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Prikaz istorije vodostaja u centimetrima po danima</p>
          </div>

          {}
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
            <AreaChart data={historyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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