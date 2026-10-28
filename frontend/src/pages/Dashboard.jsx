
import React, { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { 
  Waves, CloudRain, Thermometer, AlertTriangle, 
  Leaf, Database, ArrowRight, Info, Clock, CheckCircle 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, LineChart, Line, 
  XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});


const supplyData1d = [
  { date: '04:00', production: 4200, demand: 3900 },
  { date: '08:00', production: 5800, demand: 5500 },
  { date: '12:00', production: 6100, demand: 5900 },
  { date: '16:00', production: 5900, demand: 5600 },
  { date: '20:00', production: 5300, demand: 5000 },
];

const supplyData7d = [
  { date: '21. okt', production: 105000, demand: 98000 },
  { date: '22. okt', production: 106500, demand: 99500 },
  { date: '23. okt', production: 108000, demand: 101000 },
  { date: '24. okt', production: 112000, demand: 106000 },
  { date: '25. okt', production: 115000, demand: 107500 },
  { date: '26. okt', production: 111000, demand: 103800 },
  { date: '27. okt', production: 110200, demand: 104300 },
];

const supplyData30d = [
  { date: '1. okt', production: 102000, demand: 95000 },
  { date: '5. okt', production: 104000, demand: 97000 },
  { date: '10. okt', production: 107000, demand: 100000 },
  { date: '15. okt', production: 110000, demand: 103000 },
  { date: '20. okt', production: 113000, demand: 106000 },
  { date: '25. okt', production: 115000, demand: 107500 },
  { date: '27. okt', production: 110200, demand: 104300 },
];


const waterLevelData24h = [
  { date: '00:00', level: 245 },
  { date: '04:00', level: 245 },
  { date: '08:00', level: 244 },
  { date: '12:00', level: 244 },
  { date: '16:00', level: 243 },
  { date: '20:00', level: 243 },
];

const waterLevelData7d = [
  { date: '21. okt', level: 265 },
  { date: '22. okt', level: 258 },
  { date: '23. okt', level: 250 },
  { date: '24. okt', level: 247 },
  { date: '25. okt', level: 245 },
  { date: '26. okt', level: 244 },
  { date: '27. okt', level: 243 },
];

const waterLevelData30d = [
  { date: '1. okt', level: 295 },
  { date: '5. okt', level: 282 },
  { date: '10. okt', level: 270 },
  { date: '15. okt', level: 261 },
  { date: '20. okt', level: 253 },
  { date: '25. okt', level: 245 },
  { date: '27. okt', level: 243 },
];

export default function Dashboard() {
  const context = useOutletContext();
  const lang = context?.lang || 'SR';
  const t = context?.t || {};

  const [supplyPeriod, setSupplyPeriod] = useState('7d');
  const [trendPeriod, setTrendPeriod] = useState('7d');

  const noviSadCenter = [45.2550, 19.8250];

 
  const currentSupplyData = supplyPeriod === '1d' ? supplyData1d : supplyPeriod === '30d' ? supplyData30d : supplyData7d;

 
  const currentWaterLevelData = trendPeriod === '24h' ? waterLevelData24h : trendPeriod === '30d' ? waterLevelData30d : waterLevelData7d;

  const recentEvents = [
    {
      id: 1,
      title: lang === 'SR' ? 'Neplanirani prekid' : 'Unplanned Outage',
      subtitle: 'Petrovaradin',
      time: '27. okt 2026, 08:00 – 16:00',
      status: t?.ongoing || (lang === 'SR' ? 'Aktivno' : 'Active'),
      type: 'unplanned'
    },
    {
      id: 2,
      title: lang === 'SR' ? 'Planirani radovi' : 'Planned Maintenance',
      subtitle: 'Bulevar Evrope',
      time: '28. okt 2026, 08:00 – 18:00',
      status: t?.planned || (lang === 'SR' ? 'Planirano' : 'Planned'),
      type: 'planned'
    },
    {
      id: 3,
      title: lang === 'SR' ? 'Planirani radovi' : 'Planned Maintenance',
      subtitle: 'Adice',
      time: '29. okt 2026, 08:00 – 15:00',
      status: t?.planned || (lang === 'SR' ? 'Planirano' : 'Planned'),
      type: 'planned'
    }
  ];

  return (
    <div style={{ padding: '1.25rem 1.5rem', maxWidth: '1650px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      {}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            {t?.dashboard_title || (lang === 'SR' ? 'Novi Sad – Kontrolna tabla' : 'Novi Sad – Dashboard')}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.2rem 0 0 0' }}>
            {t?.dashboard_subtitle || (lang === 'SR' ? 'Pregled hidroloških uslova, vodosnabdevanja, prekida i potencijalne izloženosti' : 'Overview of hydrological conditions, water supply, outages, and potential exposure')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#ffedd5', border: '1px solid #fed7aa', color: '#c2410c', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700' }}>
            <Info size={15} />
            <span>{t?.demo_data || (lang === 'SR' ? 'Demo – Sintetički podaci' : 'Demo – Synthetic Data')}</span>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.8rem', fontWeight: '500' }}>
            <Clock size={15} />
            <span>{t?.last_updated || (lang === 'SR' ? 'Poslednje ažuriranje: 27. okt 2026, 10:30' : 'Last updated: Oct 27, 2026, 10:30')}</span>
          </div>
        </div>
      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.85rem', marginBottom: '1.25rem' }}>
        
        {}
        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.75rem', fontWeight: '700' }}>
            <span>{t?.water_level || (lang === 'SR' ? 'Vodostaj Dunava' : 'Danube Water Level')}</span>
            <Waves size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '0.3rem' }}>
            243 cm
          </div>
          <div style={{ fontSize: '0.73rem', color: '#059669', fontWeight: '600', marginTop: '0.2rem' }}>
            ↓ -12 cm <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>{t?.vs_yesterday || (lang === 'SR' ? 'u odnosu na juče' : 'compared to yesterday')}</span>
          </div>
        </div>

        {}
        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.75rem', fontWeight: '700' }}>
            <span>{t?.precipitation || (lang === 'SR' ? 'Padavine (7 dana)' : 'Precipitation (7 days)')}</span>
            <CloudRain size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '0.3rem' }}>
            12 mm
          </div>
          <div style={{ fontSize: '0.73rem', color: '#dc2626', fontWeight: '600', marginTop: '0.2rem' }}>
            ↑ +65% <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>{t?.vs_oct_avg || (lang === 'SR' ? 'u odnosu na prosečni oktobar' : 'compared to October average')}</span>
          </div>
        </div>

        {}
        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.75rem', fontWeight: '700' }}>
            <span>{t?.air_temp || (lang === 'SR' ? 'Temperatura (7 dana)' : 'Temperature (7 days)')}</span>
            <Thermometer size={18} color="#dc2626" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '0.3rem' }}>
            14,8 °C
          </div>
          <div style={{ fontSize: '0.73rem', color: '#dc2626', fontWeight: '600', marginTop: '0.2rem' }}>
            ↑ +2,1 °C <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>{t?.vs_oct_avg || (lang === 'SR' ? 'u odnosu na prosečni oktobar' : 'compared to October average')}</span>
          </div>
        </div>

        {}
        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.75rem', fontWeight: '700' }}>
            <span>{t?.active_disruptions || (lang === 'SR' ? 'Aktivni prekidi' : 'Active Outages')}</span>
            <AlertTriangle size={18} color="#dc2626" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '0.3rem' }}>
            3
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            {t?.planned_unplanned || (lang === 'SR' ? '1 planirani rad / 2 neprijavljena' : '1 planned work / 2 unreported')}
          </div>
        </div>

        {}
        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.75rem', fontWeight: '700' }}>
            <span>{t?.hydro_overview || (lang === 'SR' ? 'Pregled hidroloških uslova' : 'Hydrological Overview')}</span>
            <Leaf size={18} color="#059669" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem' }}>
            <span style={{ backgroundColor: '#fef3c7', color: '#b45309', fontSize: '0.75rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
              {t?.attention || (lang === 'SR' ? 'Pažnja' : 'Attention')}
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem' }}>
            {t?.drier_warmer || (lang === 'SR' ? 'Suvlji i topliji uslovi od uobičajenih za oktobar' : 'Drier and warmer conditions than usual for October')}
          </div>
        </div>

        {}
        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.75rem', fontWeight: '700' }}>
            <span>{t?.data_status || (lang === 'SR' ? 'Status podataka' : 'Data Status')}</span>
            <Database size={18} color="#0284c7" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#059669', fontSize: '0.8rem', fontWeight: '700', marginTop: '0.3rem' }}>
            <CheckCircle size={14} /> {t?.demo_data || (lang === 'SR' ? 'Demo podaci' : 'Demo data')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem' }}>
            {t?.comb_synthetic_public || (lang === 'SR' ? 'Kombinacija sintetičkih i javnih podataka' : 'Combination of synthetic and public data')}
          </div>
        </div>

      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        
        {}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              {t?.spatial_overview || (lang === 'SR' ? 'Prostorni pregled (Novi Sad)' : 'Spatial Overview (Novi Sad)')}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.15rem 0 0 0' }}>
              {t?.spatial_subtitle || (lang === 'SR' ? 'Lokacije aktivnih i planiranih događaja, kritične infrastrukture i analiza izloženosti' : 'Locations of active and planned events, critical infrastructure, and exposure analysis')}
            </p>
          </div>

          <div style={{ height: '300px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #cbd5e1', marginBottom: '0.75rem' }}>
            <MapContainer center={noviSadCenter} zoom={12.5} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[45.2572, 19.8583]}>
                <Popup><b>Novi Sad - Dunav</b><br />Vodostaj: 243 cm</Popup>
              </Marker>
            </MapContainer>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9', fontSize: '0.72rem', color: '#475569', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0284c7' }}></span> {lang === 'SR' ? 'Hidrološka stanica' : 'Hydro station'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#dc2626' }}></span> {lang === 'SR' ? 'Aktivni prekid' : 'Active outage'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#d97706' }}></span> {lang === 'SR' ? 'Planirani rad' : 'Planned work'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#9333ea' }}></span> {lang === 'SR' ? 'Kritična ustanova' : 'Critical facility'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ border: '1px dashed #64748b', padding: '1px 4px', borderRadius: '2px' }}></span> {lang === 'SR' ? 'Granica grada' : 'City limit'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '12px', height: '8px', backgroundColor: '#bfdbfe', borderRadius: '2px' }}></span> Dunav
            </div>
          </div>
        </div>

        {}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  {t?.city_supply || (lang === 'SR' ? 'Gradsko vodosnabdevanje' : 'City Water Supply')} <small style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal' }}>({supplyPeriod === '1d' ? (lang === 'SR' ? 'dan' : 'day') : supplyPeriod === '30d' ? (lang === 'SR' ? '30 dana' : '30 days') : (lang === 'SR' ? '7 dana' : '7 days')})</small>
                </h3>
                <Info size={15} color="#94a3b8" />
              </div>

              <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '0.72rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                {t?.demo_data || (lang === 'SR' ? 'Simulirani podaci' : 'Simulated data')}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>{supplyPeriod === '1d' ? '6.100 m³' : supplyPeriod === '30d' ? '115.000 m³' : '110.200 m³'}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{t?.production_today || (lang === 'SR' ? 'Proizvodnja' : 'Production')}</div>
                <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: '600', marginTop: '0.15rem' }}>
                  +3% <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>{lang === 'SR' ? 'u odnosu na prosek' : 'vs average'}</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>{supplyPeriod === '1d' ? '5.900 m³' : supplyPeriod === '30d' ? '107.500 m³' : '104.300 m³'}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{t?.consumption_today || (lang === 'SR' ? 'Potrošnja' : 'Consumption')}</div>
                <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: '600', marginTop: '0.15rem' }}>+7%</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9', position: 'relative' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>{supplyPeriod === '1d' ? '200 m³' : supplyPeriod === '30d' ? '7.500 m³' : '5.900 m³'}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{t?.diff_today || (lang === 'SR' ? 'Razlika' : 'Difference')}</div>
                <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: '600', marginTop: '0.15rem' }}>+5%</div>
                <span style={{ position: 'absolute', right: '8px', top: '8px', backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.68rem', fontWeight: '700', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                  {t?.normal_mode || (lang === 'SR' ? 'Normalan režim' : 'Normal mode')}
                </span>
              </div>
            </div>

            {}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#f1f5f9', padding: '0.2rem', borderRadius: '6px' }}>
                {[
                  { id: '1d', label: lang === 'SR' ? '1 dan' : '1 day' },
                  { id: '7d', label: lang === 'SR' ? '7 dana' : '7 days' },
                  { id: '30d', label: lang === 'SR' ? '30 dana' : '30 days' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSupplyPeriod(item.id)}
                    style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      backgroundColor: supplyPeriod === item.id ? '#0284c7' : 'transparent',
                      color: supplyPeriod === item.id ? '#fff' : '#64748b',
                      transition: 'all 0.15s ease-in-out'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#64748b' }}>
                <span>{t?.scenario || (lang === 'SR' ? 'Scenario:' : 'Scenario:')}</span>
                <select style={{ padding: '0.2rem 0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.75rem', backgroundColor: '#fff' }}>
                  <option>{t?.normal_mode || 'Normalan režim'}</option>
                  <option>{t?.summer_max || 'Letnji maksimum'}</option>
                  <option>{t?.reduced_prod || 'Smanjena proizvodnja'}</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ width: '100%', height: '180px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentSupplyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} domain={[0, supplyPeriod === '1d' ? 10000 : 200000]} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v) => `${v.toLocaleString(lang === 'SR' ? 'sr-RS' : 'en-US')} m³`} />
                <Line type="monotone" dataKey="production" name={lang === 'SR' ? 'Proizvodnja' : 'Production'} stroke="#0284c7" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="demand" name={lang === 'SR' ? 'Potrošnja' : 'Consumption'} stroke="#9333ea" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>

      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        
        {}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              {t?.water_level_trend || (lang === 'SR' ? 'Trend vodostaja Dunava' : 'Danube Water Level Trend')}
            </h3>

            <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#f1f5f9', padding: '0.2rem', borderRadius: '6px' }}>
              {['24h', '7d', '30d'].map((tp) => (
                <button
                  key={tp}
                  onClick={() => setTrendPeriod(tp)}
                  style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '4px',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    backgroundColor: trendPeriod === tp ? '#0284c7' : 'transparent',
                    color: trendPeriod === tp ? '#fff' : '#64748b',
                    transition: 'all 0.15s ease-in-out'
                  }}
                >
                  {tp}
                </button>
              ))}
            </div>
          </div>

          <div style={{ width: '100%', height: '140px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentWaterLevelData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="waterLevelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                <YAxis domain={['dataMin - 10', 'dataMax + 10']} stroke="#94a3b8" fontSize={10} unit="cm" />
                <Tooltip formatter={(value) => [`${value} cm`, t?.water_level || (lang === 'SR' ? 'Vodostaj' : 'Water level')]} />
                <Area type="monotone" dataKey="level" stroke="#0284c7" strokeWidth={2.5} fill="url(#waterLevelGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                {t?.recent_events || (lang === 'SR' ? 'Nedavni događaji' : 'Recent Events')}
              </h3>
              <Link to="/disruptions" style={{ color: '#0284c7', fontSize: '0.8rem', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                {t?.all_events || (lang === 'SR' ? 'Svi događaji' : 'All events')} <ArrowRight size={14} />
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {recentEvents.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ padding: '0.4rem', borderRadius: '50%', backgroundColor: item.type === 'unplanned' ? '#fee2e2' : '#fef3c7', color: item.type === 'unplanned' ? '#dc2626' : '#b45309' }}>
                      <AlertTriangle size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.825rem', fontWeight: '700', color: '#0f172a' }}>{item.title}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.subtitle}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.time}</div>
                    </div>
                  </div>

                  <span style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: '700', 
                    padding: '0.2rem 0.55rem', 
                    borderRadius: '12px',
                    backgroundColor: item.type === 'unplanned' ? '#fee2e2' : '#fef3c7',
                    color: item.type === 'unplanned' ? '#991b1b' : '#b45309'
                  }}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}