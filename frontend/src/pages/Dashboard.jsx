
import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Waves, CloudRain, Thermometer, AlertTriangle,
  Leaf, Database, Clock, CheckCircle, Info, ExternalLink, ArrowUpRight, ShieldCheck, Activity, BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchEvents, fetchHydrologyHistory, fetchLatestHydrology, fetchFacilities } from '../services/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_BASE_URL = 'http://82.117.203.34:8000/api/v1';

const createGisMarkerIcon = (colorHex, borderColor = '#ffffff') => {
  return L.divIcon({
    className: 'gis-custom-marker',
    html: `<div style="background-color: ${colorHex}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid ${borderColor}; box-shadow: 0 2px 6px rgba(0,0,0,0.35);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

const mapIcons = {
  station: createGisMarkerIcon('#0284c7', '#e0f2fe'),
  activeEvent: createGisMarkerIcon('#dc2626', '#fee2e2'),
  plannedEvent: createGisMarkerIcon('#d97706', '#fef3c7'),
  facility: createGisMarkerIcon('#9333ea', '#f3e8ff')
};

export default function Dashboard() {
  const context = useOutletContext();
  const lang = context?.lang || 'SR';

  const [backendEvents, setBackendEvents] = useState([]);
  const [facilitiesList, setFacilitiesList] = useState([]);
  const [summary, setSummary] = useState(null);

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

  const [trendPeriod, setTrendPeriod] = useState('7d');
  const [dashboardWaterTrend, setDashboardWaterTrend] = useState([]);

  const [selectedScenario, setSelectedScenario] = useState('normal');
  const [forecastData, setForecastData] = useState([]);
  const [modelInfo, setModelInfo] = useState(null);
  const [isHealthOk, setIsHealthOk] = useState(true);
  const [waterBalanceData, setWaterBalanceData] = useState(null);

  const noviSadCenter = [45.2550, 19.8250];

  useEffect(() => {
    // 1. Provera zdravlja API-ja
    fetch(`${API_BASE_URL}/health/`)
      .then(res => res.json())
      .then(data => {
        if (data && data.status !== 'ok') {
          setIsHealthOk(false);
        }
      })
      .catch(() => setIsHealthOk(false));

    // 2. Događaji sa /api/v1/events/
    fetchEvents()
      .then(data => {
        const rawEvents = Array.isArray(data) ? data : (data?.results || []);
        if (rawEvents.length > 0) setBackendEvents(rawEvents);
      })
      .catch(err => console.error('Events fetch error:', err));

    // 2b. Kritični objekti
    fetchFacilities()
      .then(data => {
        const rawFacs = Array.isArray(data) ? data : (data?.results || []);
        if (rawFacs.length > 0) {
          setFacilitiesList(rawFacs.map((fac, idx) => ({
            id: fac.id || `fac-${idx}`,
            name: fac.name || 'Critical Facility',
            category: fac.category || 'facility',
            lat: fac.latitude || (45.24 + (idx * 0.003)),
            lng: fac.longitude || (19.81 + (idx * 0.003))
          })));
        }
      })
      .catch(() => { });

    // 3. Dashboard Summary
    fetch(`${API_BASE_URL}/dashboard/summary/`)
      .then(res => res.json())
      .then(data => { if (data) setSummary(data); })
      .catch(err => console.error('Summary fetch error:', err));

    // 4. Poslednje merenje hidrologije
    fetchLatestHydrology('RHMZ-NS').then(res => {
      if (res && res.measurements) {
        setLatestData({
          station: res.station_name || 'Novi Sad',
          river: res.river || 'Dunav',
          timestamp: res.measurement_time ? new Date(res.measurement_time).toLocaleString(lang === 'SR' ? 'sr-RS' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleString(lang === 'SR' ? 'sr-RS' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          source: res.source?.name || 'RHMZ',
          water_level_cm: res.measurements.water_level_cm ?? 243,
          water_temp_c: res.measurements.water_temperature_c ?? 16.4,
          trend_24h_cm: res.trends?.water_level_change_24h_cm ?? -2,
          flow_m3_s: res.measurements.flow_m3_s ?? 1910
        });
      }
    }).catch(err => console.error('Latest hydro error:', err));

    // 5. AI Prognoza
    fetch(`${API_BASE_URL}/water-demand/forecast/`)
      .then(res => res.json())
      .then(data => {
        if (data && data.forecast) {
          setModelInfo(data);
        }
      })
      .catch(err => console.error('Greska pri povlacenju prognoze:', err));
  }, [lang]);

  // Istorija vodostaja Dunava
  useEffect(() => {
    fetchHydrologyHistory('RHMZ-NS', trendPeriod).then(res => {
      const rawArray = Array.isArray(res) ? res : (res?.data || []);
      if (rawArray.length > 0) {
        setDashboardWaterTrend(rawArray.map(item => ({
          date: item.timestamp ? new Date(item.timestamp).toLocaleDateString(lang === 'SR' ? 'sr-RS' : 'en-GB', { day: 'numeric', month: 'short' }) : (item.date || '-'),
          level: item.water_level_cm ?? item.level ?? 0
        })));
      }
    }).catch(err => console.error('Dashboard water level history error:', err));
  }, [trendPeriod, lang]);

  // Vodni bilans na osnovu izabranog scenarija
  useEffect(() => {
    const apiScenarioKey = selectedScenario === 'summer' ? 'peak' : selectedScenario === 'stress' ? 'combined' : selectedScenario;
    fetch(`${API_BASE_URL}/water-balance/?scenario=${apiScenarioKey}&period=7d`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setWaterBalanceData(data);
          if (data.daily && Array.isArray(data.daily)) {
            const formattedDemand = data.daily.map((item, idx) => {
              const prodVal = Math.round(item.production_m3 ?? 0);
              const demandVal = Math.round(item.required_m3 ?? item.forecast_m3 ?? 0);
              return {
                day: lang === 'SR' ? `Dan ${idx + 1}` : `Day ${idx + 1}`,
                date: item.date ? item.date.split('-').reverse().join('.') : '',
                iso: item.date,
                short: item.date ? `${item.date.slice(8, 10)}.${item.date.slice(5, 7)}.` : '',
                production: prodVal,
                demand: demandVal
              };
            });
            setForecastData(formattedDemand);
          }
        }
      })
      .catch(err => console.error('Greska pri povlacenju vodnog bilansa:', err));
  }, [selectedScenario, lang]);

  const waterLevel = latestData.water_level_cm;
  const waterChange = latestData.trend_24h_cm;
  const temperature = summary?.weather?.air_temperature_c ?? null;
  const precipitation = summary?.weather?.precipitation_7d_mm ?? null;
  const eventStats = summary?.events;
  const activeEvents = eventStats ? eventStats.ongoing : null;
  const disruptionsSub = eventStats
    ? (lang === 'SR'
      ? `${eventStats.planned} planiranih · ${eventStats.completed} završenih`
      : `${eventStats.planned} planned · ${eventStats.completed} completed`)
    : '—';

  const todayIso = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Belgrade' });
  const todayIdx = forecastData.findIndex(d => d.iso >= todayIso);
  const todayPoint = todayIdx >= 0 ? forecastData[todayIdx] : null;
  const prevPoint = todayIdx > 0 ? forecastData[todayIdx - 1] : null;

  const todayProd = todayPoint ? todayPoint.production : null;
  const todayDemand = todayPoint ? todayPoint.demand : null;
  const todayDiff = todayProd !== null && todayDemand !== null ? todayProd - todayDemand : null;
  const fmtM3 = (v) => (v !== null ? `${v.toLocaleString()} m³` : '—');

  const prevProd = prevPoint ? prevPoint.production : null;
  const prevDemand = prevPoint ? prevPoint.demand : null;
  const prevDiff = prevProd !== null && prevDemand !== null ? prevProd - prevDemand : null;

  const pctText = (cur, prev) => {
    if (cur === null || prev === null || prev === 0) return '—';
    const pct = ((cur - prev) / prev) * 100;
    const arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : '→';
    return `${arrow} ${pct > 0 ? '+' : ''}${pct.toFixed(1)}% ${lang === 'SR' ? 'vs juče' : 'vs yesterday'}`;
  };

  const absText = (cur, prev) => {
    if (cur === null || prev === null) return '—';
    const d = Math.round(cur - prev);
    const arrow = d > 0 ? '↑' : d < 0 ? '↓' : '→';
    return `${arrow} ${d > 0 ? '+' : ''}${d.toLocaleString()} m³ ${lang === 'SR' ? 'vs juče' : 'vs yesterday'}`;
  };

  const balSummary = waterBalanceData?.summary;
  const balInitial = waterBalanceData?.parameters?.initial_storage_m3;
  let balanceLabel = '—';
  let balanceColor = '#64748b';
  if (balSummary && balInitial) {
    if (balSummary.total_unmet_m3 > 0) {
      balanceLabel = lang === 'SR' ? 'Manjak vode' : 'Supply deficit';
      balanceColor = '#dc2626';
    } else if (balSummary.storage_end_m3 < balInitial) {
      balanceLabel = lang === 'SR' ? 'Rezerva opada' : 'Reserve declining';
      balanceColor = '#d97706';
    } else {
      balanceLabel = lang === 'SR' ? 'Stabilno' : 'Stable';
      balanceColor = '#059669';
    }
  }


  const storageEnd = balSummary?.storage_end_m3 ?? null;
  const unmetTotal = balSummary?.total_unmet_m3 ?? null;
  const reservePct = storageEnd !== null && balInitial
    ? Math.round(((storageEnd - balInitial) / balInitial) * 100)
    : null;

  const assumptionText = {
    normal: { SR: 'Osnovni uslovi: potražnja prema modelu, kapacitet 100%.', EN: 'Base conditions: model-predicted demand, 100% capacity.' },
    summer: { SR: 'Potražnja je 15% veća od prognoze, kapacitet 100%.', EN: 'Demand is 15% above the forecast, capacity 100%.' },
    reduced: { SR: 'Potražnja prema modelu, kapacitet smanjen za 20%.', EN: 'Model-predicted demand, capacity reduced by 20%.' },
    stress: { SR: 'Potražnja +15% i kapacitet −20%.', EN: 'Demand +15% and capacity −20%.' }
  }[selectedScenario];

  let explanationText = '—';
  let recommendationText = '—';
  if (storageEnd !== null && balInitial && assumptionText) {
    const isSR = lang === 'SR';
    explanationText = `${assumptionText[lang]} ${isSR ? 'Rezerva nakon 7 dana' : 'Reserve after 7 days'}: ${Math.round(storageEnd).toLocaleString()} m³ (${reservePct >= 0 ? '+' : ''}${reservePct}% ${isSR ? 'u odnosu na početnih' : 'vs initial'} ${balInitial.toLocaleString()} m³). ${isSR ? 'Nezadovoljene potrebe' : 'Unmet demand'}: ${Math.round(unmetTotal).toLocaleString()} m³.`;
    if (unmetTotal > 0) {
      recommendationText = isSR ? 'U ovom scenariju postoji manjak vode u snabdevanju.' : 'This scenario shows a supply deficit.';
    } else if (storageEnd < balInitial) {
      recommendationText = isSR ? 'Rezerva opada tokom perioda, ali nema nezadovoljenih potreba. Pratiti stanje rezerve.' : 'Reserve declines over the period, but no demand is left unmet. Keep monitoring the reserve.';
    } else {
      recommendationText = isSR ? 'Rezerva se održava tokom perioda. Nastaviti praćenje.' : 'Reserve holds over the period. Continue monitoring.';
    }
  }

  const scenarios = {
    normal: { title: lang === 'SR' ? 'Normalan režim' : 'Normal Mode' },
    summer: { title: lang === 'SR' ? 'Letnji maksimum' : 'Summer Peak' },
    reduced: { title: lang === 'SR' ? 'Smanjena proizvodnja' : 'Reduced Production' },
    stress: { title: lang === 'SR' ? 'Kombinovani stres' : 'Combined Stress' }
  };

  const getScenarioColor = () => {
    switch (selectedScenario) {
      case 'summer': return '#d97706';
      case 'reduced': return '#059669';
      case 'stress': return '#dc2626';
      default: return '#0284c7';
    }
  };

  const texts = {
    SR: {
      title: 'Novi Sad – Kontrolna tabla',
      subtitle: 'Pregled hidroloških uslova, vodosnabdevanja, prekida i potencijalne izloženosti',
      demoBadge: 'AI Model – Realni podaci',
      waterLevelTitle: 'Vodostaj Dunava',
      waterLevelSub: 'u odnosu na prethodni dan',
      precipTitle: 'Padavine (7 dana)',
      precipSub: 'u odnosu na prosek',
      tempTitle: 'Temperatura vazduha',
      tempSub: 'u odnosu na prosek',
      weatherSource: 'Open-Meteo (modelski podaci)',
      disruptionsTitle: 'Aktivni prekidi',
      disruptionsSub: '1 planirani rad · 2 neplanirana',
      hydroTitle: 'Pregled hidroloških uslova',
      hydroStatus: 'Najnovija merenja',
      hydroSub: 'Pregledajte vodostaje reke, nedavne trendove i dostupne hidrološke prognoze.',
      hydroCardLink: 'Pogledaj hidrologiju ›',
      dataStatusTitle: 'Status AI modela',
      dataStatusSub: 'API aktivan (200 OK)',
      activeText: 'Aktivan',
      mapTitle: 'Prostorni pregled (Novi Sad)',
      mapSub: 'Lokacije aktivnih i planiranih događaja, kritične infrastrukture i analiza izloženosti',
      supplyTitle: 'Gradsko vodosnabdevanje i AI prognoza',
      supplyBadge: '7-dnevna AI prognoza',
      prodLabel: 'Proizvodnja (danas)',
      demandLabel: 'Potražnja (danas)',
      diffLabel: 'Razlika (danas)',
      balanceStatus: 'Status bilansa',
      optimalStatus: 'Optimalno',
      scenarioLabel: 'Scenario:',
      trendTitle: 'Trend vodostaja Dunava',
      eventsTitle: 'Nedavni događaji',
      allEvents: 'Svi događaji ›',
      hydrologyLink: 'Detalji hidrologije ›',
      aiForecastLink: 'AI simulacija ›',
      mapLink: 'Otvori mapu ›',
      activeStatus: 'Aktivno',
      plannedStatus: 'Planirano',
      legendStation: 'Hidrološka stanica',
      legendActive: 'Aktivni prekid',
      legendPlanned: 'Planirani rad',
      legendCritical: 'Kritična ustanova',
      defaultUnplanned: 'Sanacija havarije',
      defaultPlanned: 'Planirani radovi'
    },
    EN: {
      title: 'Novi Sad – Dashboard',
      subtitle: 'Overview of hydrological conditions, water supply, disruptions, and potential exposure',
      demoBadge: 'AI Model – Real Data',
      waterLevelTitle: 'Danube Water Level',
      waterLevelSub: 'compared to previous day',
      precipTitle: 'Precipitation (7 days)',
      precipSub: 'compared to average',
      tempTitle: 'Air Temperature',
      tempSub: 'compared to average',
      weatherSource: 'Open-Meteo (model data)',
      disruptionsTitle: 'Active Disruptions',
      disruptionsSub: '1 planned work · 2 unplanned',
      hydroTitle: 'Hydrological Conditions',
      hydroStatus: 'Latest Observations',
      hydroSub: 'Explore river levels, recent trends and available hydrological forecasts.',
      hydroCardLink: 'View Hydrology ›',
      dataStatusTitle: 'AI Model Status',
      dataStatusSub: 'API active (200 OK)',
      activeText: 'Active',
      mapTitle: 'Spatial Overview (Novi Sad)',
      mapSub: 'Locations of active and planned events, critical infrastructure, and exposure analysis',
      supplyTitle: 'City Water Supply & AI Forecast',
      supplyBadge: '7-day AI Forecast',
      prodLabel: 'Production (today)',
      demandLabel: 'Water Demand (today)',
      diffLabel: 'Difference (today)',
      balanceStatus: 'Balance Status',
      optimalStatus: 'Optimal',
      scenarioLabel: 'Scenario:',
      trendTitle: 'Danube Water Level Trend',
      eventsTitle: 'Recent Events',
      allEvents: 'All Events ›',
      hydrologyLink: 'Hydrology Details ›',
      aiForecastLink: 'AI Simulation ›',
      mapLink: 'Open Map ›',
      activeStatus: 'Active',
      plannedStatus: 'Planned',
      legendStation: 'Hydrological Station',
      legendActive: 'Active Disruption',
      legendPlanned: 'Planned Work',
      legendCritical: 'Critical Facility',
      defaultUnplanned: 'Accident Repair',
      defaultPlanned: 'Planned Works'
    }
  };

  const tUI = texts[lang] || texts.SR;

  // Proširena funkcija za automatsko prevođenje naziva sa bekenda (uključujući sanaciju, havariju, kvar)
  const translateEventTitle = (title, isPlanned) => {
    if (!title) return isPlanned ? tUI.defaultPlanned : tUI.defaultUnplanned;
    const lower = title.toLowerCase();
    if (lang === 'EN') {
      if (lower.includes('sanacij') || lower.includes('havarij') || lower.includes('kvar') || lower.includes('neplaniran') || lower.includes('unplanned')) {
        return 'Accident Repair';
      }
      if (lower.includes('planiran') || lower.includes('planned') || lower.includes('rad')) {
        return 'Planned Works';
      }
    } else {
      if (lower.includes('repair') || lower.includes('accident') || lower.includes('unplanned') || lower.includes('kvar') || lower.includes('havarij')) {
        return 'Sanacija havarije';
      }
      if (lower.includes('planned') || lower.includes('planiran')) {
        return 'Planirani radovi';
      }
    }
    return title;
  };

  // Nedavni događaji: pravi podaci iz /events/, aktivni prvo, pa najnoviji
  const EVENT_STATUS = {
    ongoing: { SR: 'U toku', EN: 'Ongoing', bg: '#fee2e2', color: '#dc2626', rank: 0 },
    planned: { SR: 'Planirano', EN: 'Planned', bg: '#fef3c7', color: '#b45309', rank: 1 },
    completed: { SR: 'Završeno', EN: 'Completed', bg: '#dcfce7', color: '#166534', rank: 2 },
    cancelled: { SR: 'Otkazano', EN: 'Cancelled', bg: '#f1f5f9', color: '#475569', rank: 3 },
    unknown: { SR: 'Raspored nije potvrđen', EN: 'Schedule Not Confirmed', bg: '#f1f5f9', color: '#475569', rank: 3 }
  };

  const locale = lang === 'SR' ? 'sr-RS' : 'en-GB';
  const fmtD = (iso) => new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'Europe/Belgrade' });
  const fmtT = (iso) => new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Belgrade' });

  const eventTimeText = (ev) => {
    const start = ev.start_time;
    const end = ev.expected_end_time;
    if (start && end) return `${fmtD(start)}, ${fmtT(start)} – ${fmtT(end)}`;
    if (start) return `${fmtD(start)}, ${fmtT(start)}`;
    if (end) return `${fmtD(end)}, ${lang === 'SR' ? 'očekivani kraj' : 'expected end'} ${fmtT(end)}`;
    return lang === 'SR' ? 'Vreme nije poznato' : 'Time unknown';
  };

  const recentEvents = [...backendEvents]
    .sort((a, b) => {
      const ra = (EVENT_STATUS[a.status] || EVENT_STATUS.unknown).rank;
      const rb = (EVENT_STATUS[b.status] || EVENT_STATUS.unknown).rank;
      if (ra !== rb) return ra - rb;
      const ta = new Date(a.start_time || a.expected_end_time || 0).getTime();
      const tb = new Date(b.start_time || b.expected_end_time || 0).getTime();
      return tb - ta;
    })
    .slice(0, 3)
    .map((ev) => {
      const st = EVENT_STATUS[ev.status] || EVENT_STATUS.unknown;
      const isPlanned = ev.event_type === 'planned_maintenance';
      return {
        id: ev.id,
        title: translateEventTitle(ev.title, isPlanned),
        subtitle: ev.location?.address || 'Novi Sad',
        time: eventTimeText(ev),
        statusLabel: st[lang] || st.SR,
        badgeBg: st.bg,
        badgeColor: st.color,
        type: isPlanned ? 'planned' : 'unplanned'
      };
    });

  return (
    <div style={{ padding: '1.25rem 1.5rem', maxWidth: '1650px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>

      <style>{`
        .stat-cards > div { display: flex; flex-direction: column; }
        .stat-cards > div > :last-child { margin-top: auto !important; }
      `}</style>
      {/* ZAGLAVLJE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            {tUI.title}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.2rem 0 0 0' }}>
            {tUI.subtitle}
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

      {/* 6 KARTICA STATISTIKE */}
      <div className="stat-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.85rem', marginBottom: '1.25rem' }}>

        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.75rem', fontWeight: '700' }}>
            <span>{tUI.waterLevelTitle}</span>
            <Waves size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '0.3rem' }}>
            {waterLevel} cm
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
            <div style={{ fontSize: '0.73rem', color: waterChange >= 0 ? '#059669' : '#dc2626', fontWeight: '600' }}>
              {waterChange >= 0 ? `+${waterChange}` : waterChange} cm
            </div>
            <Link to="/hydrology" style={{ color: '#0284c7', fontSize: '0.72rem', fontWeight: '700', textDecoration: 'none' }}>
              {tUI.hydrologyLink}
            </Link>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.75rem', fontWeight: '700' }}>
            <span>{tUI.precipTitle}</span>
            <CloudRain size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '0.3rem' }}>
            {precipitation !== null ? `${precipitation} mm` : '—'}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '0.2rem' }}>
            {tUI.weatherSource}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.75rem', fontWeight: '700' }}>
            <span>{tUI.tempTitle}</span>
            <Thermometer size={18} color="#dc2626" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '0.3rem' }}>
            {temperature !== null ? `${temperature} °C` : '—'}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '0.2rem' }}>
            {tUI.weatherSource}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.75rem', fontWeight: '700' }}>
            <span>{tUI.disruptionsTitle}</span>
            <AlertTriangle size={18} color="#dc2626" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '0.3rem' }}>
            {activeEvents ?? '—'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{disruptionsSub}</span>
            <Link to="/disruptions" style={{ color: '#0284c7', fontSize: '0.72rem', fontWeight: '700', textDecoration: 'none' }}>
              {tUI.allEvents}
            </Link>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.75rem', fontWeight: '700' }}>
            <span>{tUI.hydroTitle}</span>
            <Waves size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginTop: '0.3rem' }}>
            {tUI.hydroStatus}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.3rem', lineHeight: 1.35 }}>
            {tUI.hydroSub}
          </div>
          <Link to="/hydrology" style={{ display: 'inline-block', marginTop: '0.4rem', color: '#0284c7', fontSize: '0.75rem', fontWeight: '700', textDecoration: 'none' }}>
            {tUI.hydroCardLink}
          </Link>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.75rem', fontWeight: '700' }}>
            <span>{tUI.dataStatusTitle}</span>
            <Database size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0284c7', marginTop: '0.3rem' }}>
            {modelInfo?.model_status || '—'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem' }}>
            {modelInfo
              ? `${modelInfo.model_type} · ${modelInfo.trained_on === 'synthetic' ? (lang === 'SR' ? 'sintetički podaci' : 'synthetic data') : modelInfo.trained_on}`
              : '—'}
          </div>
        </div>

      </div>

      {/* MAPA + CITY WATER SUPPLY & AI FORECAST */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

        {/* GIS MAPA SA MARKERIMA */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  {tUI.mapTitle}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.15rem 0 0 0' }}>
                  {tUI.mapSub}
                </p>
              </div>
              <Link to="/map" style={{ color: '#0284c7', fontSize: '0.8rem', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                {tUI.mapLink}
              </Link>
            </div>

            <div style={{ position: 'relative', flex: 1, minHeight: '300px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #cbd5e1', marginBottom: '0.75rem' }}>
              <MapContainer center={noviSadCenter} zoom={12.5} scrollWheelZoom={false} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                <Marker position={[45.2572, 19.8583]} icon={mapIcons.station}>
                  <Popup><b>Novi Sad - Danube</b><br />Water Level: {waterLevel} cm</Popup>
                </Marker>

                {backendEvents.map((ev, index) => {
                  const lat = ev.location?.latitude || (45.2520 + (index * 0.008));
                  const lng = ev.location?.longitude || (19.8250 + (index * 0.008));
                  const isPlanned = ev.status === 'planned' || ev.event_type?.includes('Planski');
                  const iconToUse = isPlanned ? mapIcons.plannedEvent : mapIcons.activeEvent;
                  return (
                    <Marker key={`ev-${ev.id || index}`} position={[lat, lng]} icon={iconToUse}>
                      <Popup>
                        <strong style={{ color: isPlanned ? '#d97706' : '#dc2626' }}>{translateEventTitle(ev.title || ev.name, isPlanned)}</strong><br />
                        {ev.location?.address || 'Novi Sad'}<br />
                        Status: {ev.status || 'Active'}
                      </Popup>
                    </Marker>
                  );
                })}

                {facilitiesList.map((fac, index) => fac.lat && fac.lng && (
                  <Marker key={`fac-${fac.id || index}`} position={[fac.lat, fac.lng]} icon={mapIcons.facility}>
                    <Popup>
                      <strong style={{ color: '#9333ea' }}>{fac.name}</strong><br />
                      Category: {fac.category}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.72rem', color: '#64748b', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0284c7' }}></span> {tUI.legendStation}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#dc2626' }}></span> {tUI.legendActive}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#d97706' }}></span> {tUI.legendPlanned}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#9333ea' }}></span> {tUI.legendCritical}</div>
          </div>
        </div>

        {/* CITY WATER SUPPLY & AI FORECAST */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  {tUI.supplyTitle}
                </h3>
                <Activity size={16} color="#0284c7" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '0.72rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                  {tUI.supplyBadge}
                </span>
                <Link to="/ai-simulation" style={{ color: '#0284c7', fontSize: '0.8rem', fontWeight: '700', textDecoration: 'none' }}>
                  {tUI.aiForecastLink}
                </Link>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>{fmtM3(todayProd)}</div>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{tUI.prodLabel}</div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '600', marginTop: '2px' }}>{pctText(todayProd, prevProd)}</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>{fmtM3(todayDemand)}</div>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{tUI.demandLabel}</div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '600', marginTop: '2px' }}>{pctText(todayDemand, prevDemand)}</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>{fmtM3(todayDiff)}</div>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{tUI.diffLabel}</div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '600', marginTop: '2px' }}>{pctText(todayDiff, prevDiff)}</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#166534', textTransform: 'capitalize' }}>{scenarios[selectedScenario]?.title || selectedScenario}</div>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{tUI.balanceStatus}</div>
                <div style={{ fontSize: '0.65rem', color: balanceColor, fontWeight: '600', marginTop: '2px' }}>{balanceLabel}</div>
              </div>
            </div>

            {/* Selektor scenarija */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{tUI.scenarioLabel}</span>
                <select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
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
                  <option value="normal">{scenarios.normal.title}</option>
                  <option value="summer">{scenarios.summer.title}</option>
                  <option value="reduced">{scenarios.reduced.title}</option>
                  <option value="stress">{scenarios.stress.title}</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ width: '100%', height: '175px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="prodGradAI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={getScenarioColor()} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={getScenarioColor()} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="short" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} domain={['auto', 'auto']} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.date || label}
                  formatter={(v) => `${v.toLocaleString()} m³`}
                />
                <Area type="monotone" dataKey="production" name={lang === 'SR' ? 'Proizvodnja' : 'Production'} stroke={getScenarioColor()} strokeWidth={2} fill="url(#prodGradAI)" />
                <Line type="monotone" dataKey="demand" name={lang === 'SR' ? 'Potražnja' : 'Demand'} stroke="#9333ea" strokeWidth={2} dot={{ r: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
              <Info size={15} color="#0284c7" />
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>
                {lang === 'SR' ? 'Objašnjenje i preporuke' : 'Explanation & Recommendations'}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#334155', marginBottom: '0.5rem', lineHeight: 1.4 }}>
              {explanationText}
            </div>
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.45rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', color: '#334155' }}>
              <strong>{lang === 'SR' ? 'Preporuka: ' : 'Recommendation: '}</strong>{recommendationText}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.4rem' }}>
              {waterBalanceData?.data_type === 'synthetic'
                ? (lang === 'SR' ? 'Sintetički podaci, ilustrativni bilans (nije hidraulička simulacija).' : 'Synthetic data, illustrative mass balance (not a hydraulic simulation).')
                : ''}
            </div>
          </div>
        </div>

      </div>

      {/* TREND VODOSTAJA DUNAVA + NEDAVNI DOGAĐAJI */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'stretch' }}>

        {/* Trend vodostaja */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box', minHeight: '235px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                {tUI.trendTitle}
              </h3>
              <Link to="/hydrology" style={{ color: '#0284c7', fontSize: '0.8rem', fontWeight: '700', textDecoration: 'none' }}>
                {tUI.hydrologyLink}
              </Link>
            </div>

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

          <div style={{ width: '100%', flex: 1, minHeight: '160px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardWaterTrend} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="waterLevelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
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
              {recentEvents.length === 0 && (
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {lang === 'SR' ? 'Nema zabeleženih događaja.' : 'No events recorded.'}
                </div>
              )}
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

                  <span style={{ fontSize: '0.70rem', fontWeight: '700', padding: '0.2rem 0.55rem', borderRadius: '12px', backgroundColor: item.badgeBg, color: item.badgeColor }}>
                    {item.statusLabel}
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