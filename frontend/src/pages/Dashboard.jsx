
import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { 
  Waves, CloudRain, Thermometer, AlertTriangle, 
  Leaf, Database, Clock, CheckCircle, Info 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, LineChart, Line, 
  XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchEvents, fetchHydrologyHistory, fetchLatestHydrology } from '../services/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function Dashboard() {
  const context = useOutletContext();
  const lang = context?.lang || 'SR';

  const [backendEvents, setBackendEvents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [latestHydrologyTime, setLatestHydrologyTime] = useState('');
  
  // Kontrole i podaci
  const [trendPeriod, setTrendPeriod] = useState('7d');
  const [activeScenario, setActiveScenario] = useState('normal');
  const [scenarioData, setScenarioData] = useState(null);
  const [dashboardWaterTrend, setDashboardWaterTrend] = useState([]);

  const noviSadCenter = [45.2550, 19.8250];

  useEffect(() => {
    // 1. Preuzimanje događaja
    fetchEvents()
      .then(data => {
        if (data && Array.isArray(data)) {
          setBackendEvents(data);
        }
      })
      .catch(err => console.error('Events fetch error:', err));

    // 2. Preuzimanje tačnog JSON summary sa bekenda
    fetch('http://82.117.203.34:8000/api/v1/dashboard/summary/')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setSummary(data);
        }
      })
      .catch(err => console.error('Summary fetch error:', err));

    // 3. Preuzimanje tačnog vremena merenja sa hidrologije
    fetchLatestHydrology('RHMZ-NS').then(res => {
      if (res && res.measurement_time) {
        const dateObj = new Date(res.measurement_time);
        const formatted = dateObj.toLocaleDateString(lang === 'SR' ? 'sr-RS' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLatestHydrologyTime(formatted);
      }
    }).catch(err => console.error('Latest hydrology time error:', err));
  }, [lang]);

  // 4. Preuzimanje istorijskih podataka vodostaja na osnovu izabranog trendPeriod-a
  useEffect(() => {
    fetchHydrologyHistory('RHMZ-NS', trendPeriod).then(res => {
      const rawArray = Array.isArray(res) ? res : (res?.data || []);
      if (rawArray.length > 0) {
        const formatted = rawArray.map(item => ({
          date: item.timestamp ? new Date(item.timestamp).toLocaleDateString(lang === 'SR' ? 'sr-RS' : 'en-GB', { day: 'numeric', month: 'short' }) : (item.date || '-'),
          level: item.water_level_cm ?? item.level ?? 0
        }));
        setDashboardWaterTrend(formatted);
      } else {
        setDashboardWaterTrend([
          { date: lang === 'SR' ? '4. jan' : 'Jan 4', level: 255 },
          { date: lang === 'SR' ? '5. jan' : 'Jan 5', level: 253 },
          { date: lang === 'SR' ? '6. jan' : 'Jan 6', level: 248 },
          { date: lang === 'SR' ? '7. jan' : 'Jan 7', level: 245 },
          { date: lang === 'SR' ? '8. jan' : 'Jan 8', level: 243 },
          { date: lang === 'SR' ? '9. jan' : 'Jan 9', level: 231 },
          { date: lang === 'SR' ? '10. jan' : 'Jan 10', level: 243 },
        ]);
      }
    }).catch(err => {
      console.error('Dashboard water level history error:', err);
    });
  }, [trendPeriod, lang]);

  // 5. Preuzimanje bilansa vode
  useEffect(() => {
    fetch(`http://82.117.203.34:8000/api/v1/water-balance/?scenario=${activeScenario}&period=7d`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setScenarioData(data);
        }
      })
      .catch(err => console.error('Water balance fetch error:', err));
  }, [activeScenario]);

  // Ekstrakcija osnovnih podataka
  const waterLevel = summary?.hydrology?.water_level_cm ?? 243;
  const waterChange = summary?.hydrology?.water_level_change_24h_cm ?? -12;
  const temperature = summary?.weather?.air_temperature_c ?? 4.8;
  const precipitation = summary?.weather?.precipitation_7d_mm ?? 12;
  const totalEvents = summary?.events?.total ?? 3;
  const dataMode = summary?.data_status?.overall_mode ?? 'mixed';

  const headerTimestamp = latestHydrologyTime || (summary?.generated_at ? new Date(summary.generated_at).toLocaleString(lang === 'SR' ? 'sr-RS' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : (lang === 'SR' ? '10. jan 2026, 10:30' : 'Jan 10, 2026, 10:30'));

  // Priprema podataka za grafikon vodosnabdevanja
  const chartSupplyData = scenarioData?.daily && Array.isArray(scenarioData.daily)
    ? scenarioData.daily.map(item => ({
        date: item.date ? item.date.split('-').slice(1).reverse().join('.') : (lang === 'SR' ? '4. jan' : 'Jan 4'),
        production: item.production_m3 ?? item.forecast_m3 ?? 110200,
        demand: item.required_m3 ?? item.forecast_m3 ?? 104300
      }))
    : [
        { date: lang === 'SR' ? '4. jan' : 'Jan 4', production: 105000, demand: 98000 },
        { date: lang === 'SR' ? '5. jan' : 'Jan 5', production: 106500, demand: 99500 },
        { date: lang === 'SR' ? '6. jan' : 'Jan 6', production: 108000, demand: 101000 },
        { date: lang === 'SR' ? '7. jan' : 'Jan 7', production: 112000, demand: 106000 },
        { date: lang === 'SR' ? '8. jan' : 'Jan 8', production: 115000, demand: 107500 },
        { date: '9. jan', production: 111000, demand: 103800 },
        { date: lang === 'SR' ? '10. jan' : 'Jan 10', production: 110200, demand: 104300 },
      ];

  const todayProd = chartSupplyData[chartSupplyData.length - 1]?.production ?? 110200;
  const todayDemand = chartSupplyData[chartSupplyData.length - 1]?.demand ?? 104300;
  const todayDiff = todayProd - todayDemand;

  // Prevod tekstova u zavisnosti od izabranog jezika
  const texts = {
    SR: {
      title: 'Novi Sad – Kontrolna tabla',
      subtitle: 'Pregled hidroloških uslova, vodosnabdevanja, prekida i potencijalne izloženosti',
      demoBadge: 'Demo – Sintetički podaci',
      waterLevelTitle: 'Vodostaj Dunava',
      waterLevelSub: 'u odnosu na prethodni dan',
      precipTitle: 'Padavine (7 dana)',
      precipSub: 'u odnosu na prosek',
      tempTitle: 'Temperatura (7 dana)',
      tempSub: 'u odnosu na prosek',
      disruptionsTitle: 'Aktivni prekidi',
      disruptionsSub: '1 planirani rad · 2 neplanirana',
      hydroTitle: 'Pregled hidroloških uslova',
      hydroStatus: 'Pažnja ›',
      hydroSub: 'Sveži i topliji uslovi od uobičajenih',
      dataStatusTitle: 'Status podataka',
      dataStatusSub: 'Kombinacija izmerenih i javnih',
      mapTitle: 'Prostorni pregled (Novi Sad)',
      mapSub: 'Lokacije aktivnih i planiranih događaja, kritične infrastrukture i analiza izloženosti',
      supplyTitle: 'Gradsko vodosnabdevanje (dnevno)',
      supplyBadge: 'Sintetički podaci',
      prodLabel: 'Proizvodnja (danas)',
      demandLabel: 'Potrošnja (danas)',
      diffLabel: 'Razlika (danas)',
      balanceStatus: 'Status bilansa',
      optimalStatus: 'Optimalno',
      scenarioLabel: 'Scenario:',
      scenarios: {
        normal: 'Normalan režim',
        peak: 'Letnji maksimum',
        reduced: 'Smanjena proizvodnja',
        combined: 'Kombinovani stres'
      },
      trendTitle: 'Trend vodostaja Dunava',
      eventsTitle: 'Nedavni događaji',
      allEvents: 'Svi događaji ›',
      activeStatus: 'Aktivno',
      plannedStatus: 'Planirano',
      legendStation: 'Hidrološka stanica',
      legendActive: 'Aktivni prekid',
      legendPlanned: 'Planirani rad',
      legendCritical: 'Kritična ustanova',
      legendBorder: 'Granica grada',
      legendRiver: 'Dunav'
    },
    EN: {
      title: 'Novi Sad – Dashboard',
      subtitle: 'Overview of hydrological conditions, water supply, disruptions, and potential exposure',
      demoBadge: 'Demo – Synthetic Data',
      waterLevelTitle: 'Danube Water Level',
      waterLevelSub: 'compared to previous day',
      precipTitle: 'Precipitation (7 days)',
      precipSub: 'compared to average',
      tempTitle: 'Temperature (7 days)',
      tempSub: 'compared to average',
      disruptionsTitle: 'Active Disruptions',
      disruptionsSub: '1 planned work · 2 unplanned',
      hydroTitle: 'Hydrological Conditions',
      hydroStatus: 'Attention ›',
      hydroSub: 'Fresher and warmer conditions than usual',
      dataStatusTitle: 'Data Status',
      dataStatusSub: 'Combination of observed and public',
      mapTitle: 'Spatial Overview (Novi Sad)',
      mapSub: 'Locations of active and planned events, critical infrastructure, and exposure analysis',
      supplyTitle: 'City Water Supply (Daily)',
      supplyBadge: 'Synthetic Data',
      prodLabel: 'Production (today)',
      demandLabel: 'Consumption (today)',
      diffLabel: 'Difference (today)',
      balanceStatus: 'Balance Status',
      optimalStatus: 'Optimal',
      scenarioLabel: 'Scenario:',
      scenarios: {
        normal: 'Normal Mode',
        peak: 'Summer Peak',
        reduced: 'Reduced Production',
        combined: 'Combined Stress'
      },
      trendTitle: 'Danube Water Level Trend',
      eventsTitle: 'Recent Events',
      allEvents: 'All Events ›',
      activeStatus: 'Active',
      plannedStatus: 'Planned',
      legendStation: 'Hydrological Station',
      legendActive: 'Active Disruption',
      legendPlanned: 'Planned Work',
      legendCritical: 'Critical Facility',
      legendBorder: 'City Border',
      legendRiver: 'Danube'
    }
  };

  const tUI = texts[lang] || texts.SR;

  // Nedavni događaji prilagođeni jeziku
  const recentEvents = backendEvents.length > 0 
    ? backendEvents.slice(0, 2).map((ev, idx) => ({
        id: ev.id || idx + 1,
        title: ev.title || (idx === 0 ? (lang === 'SR' ? 'Neplanirani prekid' : 'Unplanned Disruption') : (lang === 'SR' ? 'Planirani radovi' : 'Planned Works')),
        subtitle: ev.location?.address || (idx === 0 ? 'Petrovaradin' : 'Bulevar Evrope'),
        time: idx === 0 ? (lang === 'SR' ? '10. jan, 08:00 – 16:00' : 'Jan 10, 08:00 – 16:00') : (lang === 'SR' ? '11. jan, 08:00 – 16:00' : 'Jan 11, 08:00 – 16:00'),
        status: idx === 0 ? tUI.activeStatus : tUI.plannedStatus,
        type: idx === 0 ? 'unplanned' : 'planned'
      }))
    : [
        { id: 1, title: lang === 'SR' ? 'Neplanirani prekid' : 'Unplanned Disruption', subtitle: 'Petrovaradin', time: lang === 'SR' ? '10. jan, 08:00 – 16:00' : 'Jan 10, 08:00 – 16:00', status: tUI.activeStatus, type: 'unplanned' },
        { id: 2, title: lang === 'SR' ? 'Planirani radovi' : 'Planned Works', subtitle: 'Bulevar Evrope (segment)', time: lang === 'SR' ? '11. jan, 08:00 – 16:00' : 'Jan 11, 08:00 – 16:00', status: tUI.plannedStatus, type: 'planned' }
      ];

  return (
    <div style={{ padding: '1.25rem 1.5rem', maxWidth: '1650px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      {/* ZAGLAVLJE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            {tUI.title}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.2rem 0 0 0' }}>
            {tUI.subtitle}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#ffedd5', border: '1px solid #fed7aa', color: '#c2410c', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700' }}>
            <span>{tUI.demoBadge}</span>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.8rem', fontWeight: '600' }}>
            <Clock size={15} />
            <span>{headerTimestamp}</span>
          </div>
        </div>
      </div>

      {/* KARTICE STATISTIKE (6 KOMADA) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.85rem', marginBottom: '1.25rem' }}>
        
        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.75rem', fontWeight: '700' }}>
            <span>{tUI.waterLevelTitle}</span>
            <Waves size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '0.3rem' }}>
            {waterLevel} cm
          </div>
          <div style={{ fontSize: '0.73rem', color: waterChange >= 0 ? '#059669' : '#dc2626', fontWeight: '600', marginTop: '0.2rem' }}>
            {waterChange >= 0 ? `+${waterChange}` : waterChange} cm <span style={{ color: '#64748b', fontWeight: 'normal' }}>{tUI.waterLevelSub}</span>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.75rem', fontWeight: '700' }}>
            <span>{tUI.precipTitle}</span>
            <CloudRain size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '0.3rem' }}>
            {precipitation} mm
          </div>
          <div style={{ fontSize: '0.73rem', color: '#059669', fontWeight: '600', marginTop: '0.2rem' }}>
            ↑ +65% <span style={{ color: '#64748b', fontWeight: 'normal' }}>{tUI.precipSub}</span>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.75rem', fontWeight: '700' }}>
            <span>{tUI.tempTitle}</span>
            <Thermometer size={18} color="#dc2626" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '0.3rem' }}>
            {temperature} °C
          </div>
          <div style={{ fontSize: '0.73rem', color: '#059669', fontWeight: '600', marginTop: '0.2rem' }}>
            ↑ +2,1 °C <span style={{ color: '#64748b', fontWeight: 'normal' }}>{tUI.tempSub}</span>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.75rem', fontWeight: '700' }}>
            <span>{tUI.disruptionsTitle}</span>
            <AlertTriangle size={18} color="#dc2626" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '0.3rem' }}>
            {totalEvents}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            {tUI.disruptionsSub}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.75rem', fontWeight: '700' }}>
            <span>{tUI.hydroTitle}</span>
            <Leaf size={18} color="#059669" />
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#b45309', marginTop: '0.3rem' }}>
            {tUI.hydroStatus}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem' }}>
            {tUI.hydroSub}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.75rem', fontWeight: '700' }}>
            <span>{tUI.dataStatusTitle}</span>
            <Database size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1rem', fontWeight: '800', color: '#059669', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <CheckCircle size={15} /> {dataMode}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem' }}>
            {tUI.dataStatusSub}
          </div>
        </div>

      </div>

      {/* MAPA + GRADSKO VODOSNABDEVANJE (DNEVNO) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        
        {/* MAPA */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              {tUI.mapTitle}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.15rem 0 0 0' }}>
              {tUI.mapSub}
            </p>
          </div>

          <div style={{ height: '320px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #cbd5e1', marginBottom: '0.75rem' }}>
            <MapContainer center={noviSadCenter} zoom={12.5} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[45.2572, 19.8583]}>
                <Popup><b>Novi Sad - Dunav</b><br />Vodostaj: {waterLevel} cm</Popup>
              </Marker>
            </MapContainer>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.72rem', color: '#64748b', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }}></span> {tUI.legendStation}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626' }}></span> {tUI.legendActive}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span> {tUI.legendPlanned}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9333ea' }}></span> {tUI.legendCritical}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '12px', height: '2px', background: '#0284c7', borderStyle: 'dashed' }}></span> {tUI.legendBorder}</div>
          </div>
        </div>

        {/* GRADSKO VODOSNABDEVANJE (DNEVNO) */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  {tUI.supplyTitle}
                </h3>
                <Info size={14} color="#64748b" />
              </div>
              <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '0.72rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                {tUI.supplyBadge}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>{todayProd.toLocaleString()} m³</div>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{tUI.prodLabel}</div>
                <div style={{ fontSize: '0.65rem', color: '#059669', fontWeight: '600', marginTop: '2px' }}>↑ +3%</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>{todayDemand.toLocaleString()} m³</div>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{tUI.demandLabel}</div>
                <div style={{ fontSize: '0.65rem', color: '#dc2626', fontWeight: '600', marginTop: '2px' }}>↑ +7%</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>{todayDiff.toLocaleString()} m³</div>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{tUI.diffLabel}</div>
                <div style={{ fontSize: '0.65rem', color: '#059669', fontWeight: '600', marginTop: '2px' }}>↑ +5%</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#166534', textTransform: 'capitalize' }}>{tUI.scenarios[activeScenario] || activeScenario}</div>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{tUI.balanceStatus}</div>
                <div style={{ fontSize: '0.65rem', color: '#059669', fontWeight: '600', marginTop: '2px' }}>{tUI.optimalStatus}</div>
              </div>
            </div>

            {/* Selektor scenarija */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{tUI.scenarioLabel}</span>
                <select
                  value={activeScenario}
                  onChange={(e) => setActiveScenario(e.target.value)}
                  style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#fff',
                    color: '#0f172a',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  <option value="normal">{tUI.scenarios.normal}</option>
                  <option value="peak">{tUI.scenarios.peak}</option>
                  <option value="reduced">{tUI.scenarios.reduced}</option>
                  <option value="combined">{tUI.scenarios.combined}</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ width: '100%', height: '170px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartSupplyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 200000]} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v) => `${v.toLocaleString()} m³`} />
                <Area type="monotone" dataKey="production" name={lang === 'SR' ? 'Proizvodnja' : 'Production'} stroke="#0284c7" strokeWidth={2} fill="url(#prodGrad)" />
                <Line type="monotone" dataKey="demand" name={lang === 'SR' ? 'Potrošnja' : 'Consumption'} stroke="#9333ea" strokeWidth={2} dot={{ r: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* TREND VODOSTAJA DUNAVA + NEDAVNI DOGAĐAJI */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'stretch' }}>
        
        {/* Trend vodostaja */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box', minHeight: '235px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              {tUI.trendTitle}
            </h3>
            
            <div style={{ display: 'flex', gap: '0.2rem', backgroundColor: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
              {['24h', '7d', '30d'].map((tp) => (
                <button
                  key={tp}
                  onClick={() => setTrendPeriod(tp)}
                  style={{
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: trendPeriod === tp ? '#fff' : 'transparent',
                    color: trendPeriod === tp ? '#0f172a' : '#64748b',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: trendPeriod === tp ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  {tp}
                </button>
              ))}
            </div>
          </div>

          <div style={{ width: '100%', height: '140px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardWaterTrend} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="waterLevelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={10} unit="cm" />
                <Tooltip formatter={(value) => [`${value} cm`, lang === 'SR' ? 'Vodostaj' : 'Water Level']} />
                <Area type="monotone" dataKey="level" stroke="#0284c7" strokeWidth={2.5} fill="url(#waterLevelGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Nedavni događaji */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box', minHeight: '235px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                {tUI.eventsTitle}
              </h3>
              <Link to="/disruptions" style={{ color: '#0284c7', fontSize: '0.8rem', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                {tUI.allEvents}
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recentEvents.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ padding: '0.35rem', borderRadius: '50%', backgroundColor: item.type === 'unplanned' ? '#fee2e2' : '#fef3c7', color: item.type === 'unplanned' ? '#dc2626' : '#d97706' }}>
                      <AlertTriangle size={15} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0f172a' }}>{item.title}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{item.subtitle}</div>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{item.time}</div>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '0.2rem 0.55rem', borderRadius: '12px', backgroundColor: item.status === tUI.activeStatus ? '#fee2e2' : '#fef3c7', color: item.status === tUI.activeStatus ? '#dc2626' : '#b45309' }}>
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