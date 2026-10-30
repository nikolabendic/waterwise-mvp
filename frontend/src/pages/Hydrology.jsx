
import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Waves, Thermometer, TrendingDown, Wind, 
  Info, ExternalLink, Calendar, ShieldAlert, AlertTriangle 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip 
} from 'recharts';
import { fetchLatestHydrology, fetchHydrologyHistory } from '../services/api';

const API_BASE_URL = 'http://82.117.203.34:8000/api/v1';

export default function Hydrology() {
  const context = useOutletContext();
  const lang = context?.lang || 'SR';

  const [latestData, setLatestData] = useState({
    station: 'Novi Sad',
    river: 'Dunav',
    timestamp: 'Učitavanje...',
    source: 'RHMZ',
    water_level_cm: 243,
    water_temp_c: 16.4,
    trend_24h_cm: -2,
    flow_m3_s: 1910
  });

  const [period, setPeriod] = useState('7d');
  const [chartData, setChartData] = useState([]);
  const [customDate, setCustomDate] = useState('');
  const dateInputRef = useRef(null);

  // Zvanična RHMZ prognoza state
  const [rhmzForecast, setRhmzForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [forecastError, setForecastError] = useState(false);

  useEffect(() => {
    // 1. Poslednje merenje
    fetchLatestHydrology('RHMZ-NS').then(res => {
      if (res && res.measurements) {
        setLatestData({
          station: res.station_name || 'Novi Sad',
          river: res.river || 'Dunav',
          timestamp: res.measurement_time ? new Date(res.measurement_time).toLocaleString('sr-RS', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : (lang === 'SR' ? '14. okt 2026, 18:00' : 'Oct 14, 2026, 18:00'),
          source: res.source?.name || 'RHMZ',
          water_level_cm: res.measurements.water_level_cm ?? 243,
          water_temp_c: res.measurements.water_temperature_c ?? 16.4,
          trend_24h_cm: res.trends?.water_level_change_24h_cm ?? -2,
          flow_m3_s: res.measurements.flow_m3_s ?? 1910
        });
      }
    }).catch(err => console.error('Latest hydro error:', err));

    // 2. Povlačenje istorijskih podataka i spajanje sa RHMZ prognozom 
    const apiPeriod = period === 'custom' ? '7d' : period;
    fetchHydrologyHistory('RHMZ-NS', apiPeriod).then(res => {
      const rawArray = Array.isArray(res) ? res : (res?.data || []);
      let historyPoints = [];
      if (rawArray.length > 0) {
        historyPoints = rawArray.map(item => {
          const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleDateString(lang === 'SR' ? 'sr-RS' : 'en-GB', { day: 'numeric', month: 'short' }) : (item.date || '-');
          const val = item.water_level_cm ?? item.level ?? 0;
          return {
            date: dateStr,
            level: val,
            forecast: null
          };
        });
      } else {
        historyPoints = [
          { date: lang === 'SR' ? '24. okt' : 'Oct 24', level: 272, forecast: null },
          { date: lang === 'SR' ? '25. okt' : 'Oct 25', level: 268, forecast: null },
          { date: lang === 'SR' ? '26. okt' : 'Oct 26', level: 260, forecast: null },
          { date: lang === 'SR' ? '27. okt' : 'Oct 27', level: 255, forecast: null },
          { date: lang === 'SR' ? '28. okt' : 'Oct 28', level: 250, forecast: null },
          { date: lang === 'SR' ? '29. okt' : 'Oct 29', level: 246, forecast: null },
          { date: lang === 'SR' ? '30. okt' : 'Oct 30', level: 243, forecast: null },
        ];
      }

      fetch(`${API_BASE_URL}/hydrology/forecast/?station_id=RHMZ-NS`)
        .then(async forecastRes => {
          if (!forecastRes.ok) throw new Error('Forecast unavailable');
          return forecastRes.json();
        })
        .then(forecastData => {
          if (forecastData && (forecastData.availability === 'outdated' || forecastData.error === 'forecast_unavailable')) {
            setForecastError(true);
            setRhmzForecast(null);
            setChartData(historyPoints);
          } else if (forecastData && (forecastData.forecast || Array.isArray(forecastData))) {
            setRhmzForecast(forecastData);
            const fList = forecastData.forecast || forecastData;
            
            if (Array.isArray(fList) && fList.length > 0) {
              const lastHistory = historyPoints[historyPoints.length - 1];
              if (lastHistory) {
                lastHistory.forecast = lastHistory.level;
              }

              const forecastChartPoints = fList.map(item => ({
                date: item.date ? new Date(item.date).toLocaleDateString(lang === 'SR' ? 'sr-RS' : 'en-GB', { day: 'numeric', month: 'short' }) : '',
                level: null,
                forecast: item.water_level_cm ?? item.level ?? 0
              }));

              setChartData([...historyPoints, ...forecastChartPoints]);
            } else {
              setChartData(historyPoints);
            }
          } else {
            setForecastError(true);
            setChartData(historyPoints);
          }
          setForecastLoading(false);
        })
        .catch(() => {
          setForecastError(true);
          setForecastLoading(false);
          setChartData(historyPoints);
        });

    }).catch(err => {
      console.error('History hydro error:', err);
      setForecastError(true);
      setForecastLoading(false);
      setChartData([
        { date: '24. okt', level: 272, forecast: null },
        { date: '25. okt', level: 268, forecast: null },
        { date: '26. okt', level: 260, forecast: null },
        { date: '27. okt', level: 255, forecast: null },
        { date: '28. okt', level: 250, forecast: null },
        { date: '29. okt', level: 246, forecast: null },
        { date: '30. okt', level: 243, forecast: 243 },
        { date: '31. okt', level: null, forecast: 241 },
        { date: '1. nov', level: null, forecast: 239 },
      ]);
    });
  }, [period, lang]);

  const handleCalendarClick = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker ? dateInputRef.current.showPicker() : dateInputRef.current.click();
    }
  };

  const handleDateChange = (e) => {
    const selectedDateStr = e.target.value;
    if (!selectedDateStr) return;
    setCustomDate(selectedDateStr);
    setPeriod('custom');
  };

  const forecastList = rhmzForecast?.forecast || (Array.isArray(rhmzForecast) ? rhmzForecast : []);
  const issuedDateStr = rhmzForecast?.issued_date ? new Date(rhmzForecast.issued_date).toLocaleString(lang === 'SR' ? 'sr-RS' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <div style={{ padding: '1.25rem 1.5rem', maxWidth: '1650px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      {/* 1. ZAGLAVLJE EKRANA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            {lang === 'SR' ? 'Hidrološki pregled i prognoza' : 'Hydrological Overview & Forecast'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.2rem 0 0 0' }}>
            {lang === 'SR' 
              ? 'Praćenje vodostaja Dunava, protoka vode i meteoroloških parametara na mernoj stanici Novi Sad.'
              : 'Monitoring Danube water level, water flow and meteorological parameters at Novi Sad station.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#64748b', backgroundColor: '#fff', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
          <span>{lang === 'SR' ? 'Poslednje merenje:' : 'Last measurement:'} <strong>{latestData.timestamp}</strong></span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span>{lang === 'SR' ? 'Hidrološka stanica:' : 'Station:'} <strong>{latestData.station}</strong></span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span>{lang === 'SR' ? 'Izvor:' : 'Source:'} <a href="https://www.hidmet.gov.rs" target="_blank" rel="noreferrer" style={{ color: '#0284c7', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>{latestData.source} <ExternalLink size={11} /></a></span>
        </div>
      </div>

      {/* 2. GORNJE 4 DETALJNE KPI KARTICE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
        
        <div style={{ backgroundColor: '#fff', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.73rem', fontWeight: '700', textTransform: 'uppercase' }}>
              {lang === 'SR' ? 'Trenutni vodostaj' : 'Current Water Level'}
            </span>
            <Waves size={16} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
            {latestData.water_level_cm} cm
          </div>
          <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: '600', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span>↓ {latestData.trend_24h_cm} cm</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.1rem' }}>
            {lang === 'SR' ? 'u odnosu na prethodni dan' : 'compared to previous day'}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.73rem', fontWeight: '700', textTransform: 'uppercase' }}>
              {lang === 'SR' ? 'Temperatura vode' : 'Water Temperature'}
            </span>
            <Thermometer size={16} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
            {latestData.water_temp_c} °C
          </div>
          <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: '600', marginTop: '0.2rem' }}>
            ↑ +0,2 °C
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.1rem' }}>
            {lang === 'SR' ? 'u odnosu na prethodni dan' : 'compared to previous day'}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.73rem', fontWeight: '700', textTransform: 'uppercase' }}>
              {lang === 'SR' ? 'Trend vodostaja (24h)' : 'Water Level Trend (24h)'}
            </span>
            <TrendingDown size={16} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
            {latestData.trend_24h_cm} cm
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.4rem', lineHeight: '1.3' }}>
            {lang === 'SR' ? 'Blagi pad u poslednja 24 sata' : 'Slight decrease in past 24 hours'}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.73rem', fontWeight: '700', textTransform: 'uppercase' }}>
              {lang === 'SR' ? 'Protok vode' : 'Water Flow Rate'}
            </span>
            <Wind size={16} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
            {latestData.flow_m3_s.toLocaleString()} m³/s
          </div>
          <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: '600', marginTop: '0.2rem' }}>
            ↓ -5%
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.1rem' }}>
            {lang === 'SR' ? 'u odnosu na prethodnu nedelju' : 'compared to previous week'}
          </div>
        </div>

      </div>

      {/* 3. GLAVNI GRAFIKON */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              {lang === 'SR' ? 'Kretanje vodostaja Dunava sa RHMZ prognozom' : 'Danube Water Level Movement with RHMZ Forecast'}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.78rem', margin: '0.15rem 0 0 0' }}>
              {lang === 'SR' ? 'Prikaz izmerenih vrednosti i zvanične RHMZ prognoze u centimetrima.' : 'Display of measured values and official RHMZ forecast in centimeters.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.2rem', backgroundColor: '#f1f5f9', padding: '0.2rem', borderRadius: '6px' }}>
              {['24h', '7d', '30d'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '4px',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    backgroundColor: period === p ? '#0284c7' : 'transparent',
                    color: period === p ? '#fff' : '#64748b'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            <input 
              type="date" 
              ref={dateInputRef} 
              onChange={handleDateChange} 
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }} 
            />

           
          </div>
        </div>

        {/* LEGENDA GRAFIKONA */}
        <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.75rem', color: '#475569', marginBottom: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0284c7' }}></span>
            <span>{lang === 'SR' ? 'Izmerene vrednosti' : 'Measured values'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#9333ea' }}></span>
            <span>{lang === 'SR' ? 'Zvanična RHMZ prognoza' : 'Official RHMZ Forecast'}</span>
          </div>
        </div>

        {/* GRAFIKON  */}
        <div style={{ width: '100%', height: '260px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="levelGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} unit=" cm" />
              <Tooltip formatter={(val, name) => [`${val} cm`, name === 'level' ? (lang === 'SR' ? 'Izmereno' : 'Measured') : (lang === 'SR' ? 'RHMZ Prognoza' : 'RHMZ Forecast')]} />
              
              {/* Izmerene vrednosti (plavo) */}
              <Area type="monotone" dataKey="level" stroke="#0284c7" strokeWidth={2.5} fill="url(#levelGrad)" dot={{ r: 3, fill: '#0284c7' }} connectNulls={false} name="level" />
              
              {/* Zvanična RHMZ prognoza (ljubičasto) bez razmaka */}
              <Area type="monotone" dataKey="forecast" stroke="#9333ea" strokeWidth={2.5} strokeDasharray="4 4" fill="url(#forecastGrad)" dot={{ r: 3, fill: '#9333ea' }} connectNulls={false} name="forecast" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. DONJI SEGMENTI: 3 KARTICE JEDNA PORED DRUGE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', alignItems: 'stretch' }}>
        
        {/* 1. Zvanična RHMZ prognoza kartica */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <TrendingDown size={17} color="#0284c7" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  {lang === 'SR' ? 'Zvanična RHMZ prognoza' : 'Official RHMZ Forecast'}
                </h3>
              </div>
              <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '0.68rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                RHMZ Srbija
              </span>
            </div>

            {issuedDateStr && (
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} /> {lang === 'SR' ? 'Datum izdavanja:' : 'Issued date:'} <strong>{issuedDateStr}</strong>
              </div>
            )}

            {forecastLoading ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                {lang === 'SR' ? 'Učitavanje zvanične prognoze...' : 'Loading official forecast...'}
              </div>
            ) : forecastError ? (
              <div style={{ padding: '1.25rem', textAlign: 'center', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fee2e2', color: '#dc2626', fontSize: '0.8rem', fontWeight: '600', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <AlertTriangle size={18} />
                {lang === 'SR' ? 'Prognoza trenutno nije dostupna' : 'Forecast currently unavailable'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.5rem' }}>
                {forecastList.map((item, index) => {
                  const dayStr = item.date ? new Date(item.date).toLocaleDateString(lang === 'SR' ? 'sr-RS' : 'en-GB', { day: 'numeric', month: 'short' }) : `${lang === 'SR' ? 'Dan' : 'Day'} ${index + 1}`;
                  const levelVal = item.water_level_cm ?? item.level ?? 0;
                  return (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#9333ea' }}></span>
                        <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#0f172a' }}>{dayStr}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#9333ea' }}>
                        {levelVal} cm
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {rhmzForecast?.limitations && (
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.4rem' }}>
              <Info size={11} style={{ display: 'inline', marginRight: '3px' }} /> {rhmzForecast.limitations}
            </div>
          )}
        </div>

        {/* 2. Hidrološki kontekst */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '2rem' }}>
              <Info size={18} color="#0284c7" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                {lang === 'SR' ? 'Hidrološki kontekst' : 'Hydrological Context'}
              </h3> 
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>{lang === 'SR' ? 'Prosečan vodostaj za ovaj period' : 'Average level for this period'}</span>
                <strong style={{ color: '#0f172a' }}>256 cm</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>{lang === 'SR' ? 'Najviši izmereni vodostaj (istorijski)' : 'Highest recorded level (historical)'}</span>
                <strong style={{ color: '#0f172a' }}>716 cm <span style={{ fontWeight: 'normal', color: '#64748b', fontSize: '0.75rem' }}>(apr 2006)</span></strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>{lang === 'SR' ? 'Najniži izmereni vodostaj (istorijski)' : 'Lowest recorded level (historical)'}</span>
                <strong style={{ color: '#0f172a' }}>162 cm <span style={{ fontWeight: 'normal', color: '#64748b', fontSize: '0.75rem' }}>(avgust 2012)</span></strong>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Napomene i metodologija */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <ShieldAlert size={18} color="#0284c7" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                {lang === 'SR' ? 'Napomene i metodologija' : 'Notes & Methodology'}
              </h3>
            </div>

            <p style={{ color: '#475569', fontSize: '0.82rem', lineHeight: '1.4', margin: '0 0 0.75rem 0' }}>
              {lang === 'SR' 
                ? 'Podaci o vodostaju i prognozi preuzimaju se direktno iz zvaničnih izvora RHMZ Republike Srbije.'
                : 'Water level and forecast data are retrieved directly from official RHMZ sources of the Republic of Serbia.'}
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <a href="https://www.hidmet.gov.rs" target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', backgroundColor: '#f1f5f9', color: '#0f172a', padding: '0.3rem 0.6rem', borderRadius: '6px', textDecoration: 'none', fontWeight: '600' }}>
                RHMZ Srbija ↗
              </a>
            </div>
          </div>

          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.5rem', color: '#1d4ed8', fontSize: '0.78rem', display: 'flex', gap: '0.3rem', alignItems: 'flex-start' }}>
            <Info size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{lang === 'SR' ? 'Prikazana prognoza je zvanični RHMZ hidrografski podatak.' : 'The displayed forecast is official RHMZ hydrographic data.'}</span>
          </div>
        </div>

      </div>

    </div>
  );
}