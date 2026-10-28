
import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Waves, Thermometer, TrendingDown, Wind, 
  Info, ExternalLink, Calendar 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ReferenceLine 
} from 'recharts';


const initialLatest = {
  station: 'Novi Sad',
  river: 'Dunav',
  timestamp: 'Danas, 27. okt 2026, 18:00',
  source: 'RHMZ',
  water_level_cm: 243,
  water_temp_c: 16.4,
  trend_24h_cm: -2,
  flow_m3_s: 1910
};


const data24h = [
  { date: '00:00', level: 245, forecast: null, confidenceMin: null, confidenceMax: null },
  { date: '04:00', level: 245, forecast: null, confidenceMin: null, confidenceMax: null },
  { date: '08:00', level: 244, forecast: null, confidenceMin: null, confidenceMax: null },
  { date: '12:00', level: 244, forecast: null, confidenceMin: null, confidenceMax: null },
  { date: '16:00', level: 243, forecast: null, confidenceMin: null, confidenceMax: null },
  { date: '18:00', level: 243, forecast: 243, confidenceMin: 243, confidenceMax: 243 },
  { date: '20:00', level: null, forecast: 242, confidenceMin: 239, confidenceMax: 245 },
  { date: '22:00', level: null, forecast: 242, confidenceMin: 238, confidenceMax: 246 }
];

const data7d = [
  { date: '21. okt', level: 265, forecast: null, confidenceMin: null, confidenceMax: null },
  { date: '22. okt', level: 258, forecast: null, confidenceMin: null, confidenceMax: null },
  { date: '23. okt', level: 250, forecast: null, confidenceMin: null, confidenceMax: null },
  { date: '24. okt', level: 247, forecast: null, confidenceMin: null, confidenceMax: null },
  { date: '25. okt', level: 245, forecast: null, confidenceMin: null, confidenceMax: null },
  { date: '26. okt', level: 244, forecast: null, confidenceMin: null, confidenceMax: null },
  { date: '27. okt', level: 243, forecast: 243, confidenceMin: 243, confidenceMax: 243 },
  { date: '28. okt', level: null, forecast: 241, confidenceMin: 232, confidenceMax: 250 },
  { date: '29. okt', level: null, forecast: 239, confidenceMin: 228, confidenceMax: 250 },
  { date: '30. okt', level: null, forecast: 238, confidenceMin: 225, confidenceMax: 251 }
];


const data30d = [
  { date: '1. okt', level: 295, forecast: null, confidenceMin: null, confidenceMax: null },
  { date: '5. okt', level: 282, forecast: null, confidenceMin: null, confidenceMax: null },
  { date: '10. okt', level: 270, forecast: null, confidenceMin: null, confidenceMax: null },
  { date: '15. okt', level: 261, forecast: null, confidenceMin: null, confidenceMax: null },
  { date: '20. okt', level: 253, forecast: null, confidenceMin: null, confidenceMax: null },
  { date: '25. okt', level: 245, forecast: null, confidenceMin: null, confidenceMax: null },
  { date: '27. okt', level: 243, forecast: 243, confidenceMin: 243, confidenceMax: 243 },
  { date: '30. okt', level: null, forecast: 238, confidenceMin: 224, confidenceMax: 252 }
];

export default function Hydrology() {
  const context = useOutletContext();
  const lang = context?.lang || 'SR';
  const t = context?.t || {};

  const [latestData, setLatestData] = useState(initialLatest);
  const [period, setPeriod] = useState('7d');
  const [customDate, setCustomDate] = useState('');
  const [customChartData, setCustomChartData] = useState(null);
  const dateInputRef = useRef(null);

 
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

    const selectedDate = new Date(selectedDateStr);
    const day = selectedDate.getDate();
    const month = selectedDate.toLocaleString(lang === 'SR' ? 'sr-RS' : 'en-US', { month: 'short' });

    
    const generatedData = [
      { date: `${day - 3}. ${month}`, level: 255, forecast: null, confidenceMin: null, confidenceMax: null },
      { date: `${day - 2}. ${month}`, level: 250, forecast: null, confidenceMin: null, confidenceMax: null },
      { date: `${day - 1}. ${month}`, level: 246, forecast: null, confidenceMin: null, confidenceMax: null },
      { date: `${day}. ${month}`, level: 243, forecast: 243, confidenceMin: 243, confidenceMax: 243 },
      { date: `${day + 1}. ${month}`, level: null, forecast: 241, confidenceMin: 232, confidenceMax: 250 },
      { date: `${day + 2}. ${month}`, level: null, forecast: 239, confidenceMin: 228, confidenceMax: 250 },
      { date: `${day + 3}. ${month}`, level: null, forecast: 237, confidenceMin: 224, confidenceMax: 251 }
    ];

    setCustomChartData(generatedData);
  };

 
  let currentChartData = data7d;
  let referenceXPoint = '27. okt';

  if (period === '24h') {
    currentChartData = data24h;
    referenceXPoint = '18:00';
  } else if (period === '30d') {
    currentChartData = data30d;
    referenceXPoint = '27. okt';
  } else if (period === 'custom' && customChartData) {
    currentChartData = customChartData;
    referenceXPoint = customChartData[3]?.date || '';
  }

  return (
    <div style={{ padding: '1.25rem 1.5rem', maxWidth: '1650px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      {}
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
          <span>{lang === 'SR' ? 'Izvor:' : 'Source:'} <strong style={{ color: '#0284c7' }}>{latestData.source} <ExternalLink size={12} style={{ display: 'inline' }} /></strong></span>
        </div>
      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
        
        {}
        <div style={{ backgroundColor: '#fff', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.73rem', fontWeight: '700', textTransform: 'uppercase' }}>
              {lang === 'SR' ? 'Trenutni vodostaj' : 'Current Water Level'}
            </span>
            <Waves size={16} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', marginTop: '0.15rem' }}>
            {latestData.water_level_cm} cm
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: '600' }}>
              ↓ -12 cm <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>{lang === 'SR' ? 'u odnosu na juče' : 'vs yesterday'}</span>
            </span>
            <span style={{ backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.62rem', fontWeight: '700', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
              {lang === 'SR' ? 'Redovan nivo' : 'Normal level'}
            </span>
          </div>
        </div>

        {}
        <div style={{ backgroundColor: '#fff', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.73rem', fontWeight: '700', textTransform: 'uppercase' }}>
              {lang === 'SR' ? 'Temperatura vode' : 'Water Temperature'}
            </span>
            <Thermometer size={16} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', marginTop: '0.15rem' }}>
            {latestData.water_temp_c} °C
          </div>
          <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: '600', marginTop: '0.2rem' }}>
            ↑ +0,2 °C <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>{lang === 'SR' ? 'u odnosu na juče' : 'vs yesterday'}</span>
          </div>
        </div>

        {}
        <div style={{ backgroundColor: '#fff', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.73rem', fontWeight: '700', textTransform: 'uppercase' }}>
              {lang === 'SR' ? 'Trend vodostaja (24h)' : 'Water Level Trend (24h)'}
            </span>
            <TrendingDown size={16} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', marginTop: '0.15rem' }}>
            {latestData.trend_24h_cm} cm
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
            {lang === 'SR' ? 'Blagi pad u poslednja 24h' : 'Slight decrease in last 24h'}
          </div>
        </div>

        {}
        <div style={{ backgroundColor: '#fff', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.73rem', fontWeight: '700', textTransform: 'uppercase' }}>
              {lang === 'SR' ? 'Protok vode' : 'Water Flow Rate'}
            </span>
            <Wind size={16} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', marginTop: '0.15rem' }}>
            {latestData.flow_m3_s.toLocaleString('sr-RS')} m³/s
          </div>
          <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: '600', marginTop: '0.2rem' }}>
            ↓ -5% <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>{lang === 'SR' ? 'u odnosu na prošlu nedelju' : 'vs last week'}</span>
          </div>
        </div>

      </div>

      {}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', marginBottom: '1.25rem' }}>
        
        {}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              {lang === 'SR' ? 'Kretanje vodostaja Dunava (Novi Sad)' : 'Danube Water Level Movement (Novi Sad)'}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.15rem 0 0 0' }}>
              {lang === 'SR' ? 'Prikaz izmerenih i prognoziranih vrednosti vodostaja u centimetrima.' : 'Display of measured and forecasted water level values in centimeters.'}
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
                    color: period === p ? '#fff' : '#64748b',
                    transition: 'all 0.15s ease-in-out'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            {}
            <input 
              type="date" 
              ref={dateInputRef} 
              onChange={handleDateChange} 
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }} 
            />

            {}
            <button 
              onClick={handleCalendarClick}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.3rem', 
                backgroundColor: period === 'custom' ? '#eff6ff' : '#fff', 
                border: period === 'custom' ? '1px solid #0284c7' : '1px solid #cbd5e1', 
                padding: '0.25rem 0.6rem', 
                borderRadius: '6px', 
                fontSize: '0.75rem', 
                color: period === 'custom' ? '#0284c7' : '#475569', 
                cursor: 'pointer', 
                fontWeight: '600' 
              }}
            >
              <Calendar size={13} color={period === 'custom' ? '#0284c7' : '#475569'} />
              <span>
                {period === 'custom' && customDate 
                  ? customDate 
                  : (lang === 'SR' ? 'Izaberi period' : 'Select period')}
              </span>
            </button>
          </div>
        </div>

        {}
        <div style={{ width: '100%', height: '280px', position: 'relative' }}>
          
          <div style={{ position: 'absolute', right: '10%', top: '10px', fontSize: '0.72rem', color: '#9333ea', fontWeight: '600', zIndex: 10 }}>
            {lang === 'SR' ? 'Prognoza' : 'Forecast'}
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={currentChartData} margin={{ top: 20, right: 20, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c084fc" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#c084fc" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
              <YAxis domain={[200, 310]} stroke="#94a3b8" fontSize={11} unit=" cm" />
              <Tooltip formatter={(val, name) => [`${val} cm`, name === 'level' ? (lang === 'SR' ? 'Izmereno' : 'Measured') : (lang === 'SR' ? 'Prognoza' : 'Forecast')]} />
              
              <ReferenceLine x={referenceXPoint} stroke="#cbd5e1" strokeDasharray="3 3" />

              <Area type="monotone" dataKey="confidenceMax" stroke="none" fill="url(#confidenceGrad)" />
              <Area type="monotone" dataKey="confidenceMin" stroke="none" fill="#fff" />

              <Area type="monotone" dataKey="level" stroke="#0284c7" strokeWidth={3} fill="none" dot={{ r: 4, fill: '#0284c7' }} />

              <Area type="monotone" dataKey="forecast" stroke="#9333ea" strokeWidth={2.5} strokeDasharray="5 5" fill="none" dot={{ r: 4, fill: '#9333ea' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.75rem', color: '#475569' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0284c7' }}></span>
            <span>{lang === 'SR' ? 'Izmerene vrednosti' : 'Measured values'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#9333ea' }}></span>
            <span>{lang === 'SR' ? 'Prognozirane vrednosti (model)' : 'Forecasted values (model)'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '12px', height: '10px', backgroundColor: '#e9d5ff', borderRadius: '2px' }}></span>
            <span>{lang === 'SR' ? 'Interval pouzdanosti (±)' : 'Confidence interval (±)'}</span>
          </div>
        </div>

      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
        
        {}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem' }}>
            <TrendingDown size={16} color="#0284c7" />
            <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              {lang === 'SR' ? 'Prognoza vodostaja – naredna 72 sata' : 'Water Level Forecast – Next 72h'}
            </h3>
            <Info size={14} color="#94a3b8" />
          </div>

          <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '0 0 0.85rem 0' }}>
            {lang === 'SR' ? 'Prognoza je eksperimentalna i zasnovana na istorijskim podacima i meteorološkim parametrima.' : 'Forecast is experimental based on historical & meteorological data.'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{lang === 'SR' ? 'Za 24h (28. okt)' : 'In 24h (Oct 28)'}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginTop: '0.1rem' }}>241 cm</div>
              <div style={{ fontSize: '0.68rem', color: '#059669', fontWeight: '600' }}>↓ -2 cm</div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{lang === 'SR' ? 'u odnosu na danas' : 'vs today'}</div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{lang === 'SR' ? 'Za 48h (29. okt)' : 'In 48h (Oct 29)'}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginTop: '0.1rem' }}>239 cm</div>
              <div style={{ fontSize: '0.68rem', color: '#059669', fontWeight: '600' }}>↓ -4 cm</div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{lang === 'SR' ? 'u odnosu na danas' : 'vs today'}</div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{lang === 'SR' ? 'Za 72h (30. okt)' : 'In 72h (Oct 30)'}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginTop: '0.1rem' }}>238 cm</div>
              <div style={{ fontSize: '0.68rem', color: '#059669', fontWeight: '600' }}>↓ -5 cm</div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{lang === 'SR' ? 'u odnosu na danas' : 'vs today'}</div>
            </div>
          </div>
        </div>

        {}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
            <Waves size={16} color="#0284c7" />
            <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              {lang === 'SR' ? 'Hidrološki kontekst' : 'Hydrological Context'}
            </h3>
            <Info size={14} color="#94a3b8" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b' }}>{lang === 'SR' ? 'Prosečan vodostaj za ovaj period' : 'Average water level for period'}</span>
              <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>256 cm</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b' }}>{lang === 'SR' ? 'Najviši izmereni vodostaj (istorijski)' : 'Highest recorded level (historical)'}</span>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>716 cm</strong>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>({lang === 'SR' ? 'april 2006' : 'April 2006'})</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b' }}>{lang === 'SR' ? 'Najniži izmereni vodostaj (istorijski)' : 'Lowest recorded level (historical)'}</span>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>162 cm</strong>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>({lang === 'SR' ? 'avgust 2012' : 'August 2012'})</div>
              </div>
            </div>
          </div>
        </div>

        {}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
              <Info size={16} color="#0284c7" />
              <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                {lang === 'SR' ? 'Napomene i metodologija' : 'Notes & Methodology'}
              </h3>
            </div>

            <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '0 0 0.6rem 0', lineHeight: '1.4' }}>
              {lang === 'SR' 
                ? 'Podaci o vodostaju i protoku preuzimaju se iz javno dostupnih podataka RHMZ. Prognoza je bazirana na statističkom modelu koji koristi istorijske hidrološke podatke i meteorološku prognozu.'
                : 'Water level and flow data are retrieved from public RHMZ data. The forecast is based on a statistical model using historical hydrological data and weather forecasts.'}
            </p>

            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.72rem', fontWeight: '600' }}>
              <a href="#" style={{ color: '#0284c7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}>
                {lang === 'SR' ? 'RHMZ - hidrološki podaci' : 'RHMZ - hydrological data'} <ExternalLink size={12} />
              </a>
              <a href="#" style={{ color: '#0284c7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}>
                {lang === 'SR' ? 'Više o metodologiji prognoze' : 'More about forecast methodology'} <ExternalLink size={12} />
              </a>
            </div>
          </div>

          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.5rem 0.65rem', fontSize: '0.7rem', color: '#1d4ed8', display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.75rem' }}>
            <Info size={15} style={{ flexShrink: 0 }} />
            <div>
              {lang === 'SR'
                ? 'Prognozirane vrednosti su eksperimentalne i ne predstavljaju zvaničnu prognozu RHMZ.'
                : 'Forecasted values are experimental and do not represent official RHMZ forecasts.'}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}