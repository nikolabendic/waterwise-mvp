import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Calculator, MapPin, Building2, Users, FileText, ShieldAlert, Info, Activity, AlertTriangle
} from 'lucide-react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchEvents } from '../services/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_BASE_URL = 'http://82.117.203.34:8000/api/v1';

const createColoredIcon = (colorHex) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${colorHex}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

const icons = {
  event: createColoredIcon('#dc2626'),
  facility: createColoredIcon('#9333ea')
};

const CATEGORY_LABELS = {
  school: { SR: 'Škola', EN: 'School' },
  kindergarten: { SR: 'Vrtić', EN: 'Kindergarten' },
  hospital: { SR: 'Bolnica', EN: 'Hospital' },
  health_center: { SR: 'Dom zdravlja', EN: 'Health center' },
  social_care: { SR: 'Socijalna zaštita', EN: 'Social care' }
};
const CATEGORY_ORDER = ['school', 'kindergarten', 'hospital', 'health_center', 'social_care'];

const EVENT_STATUS_LABELS = {
  ongoing: { SR: 'U toku', EN: 'Ongoing' },
  completed: { SR: 'Završen', EN: 'Completed' },
  planned: { SR: 'Planiran', EN: 'Planned' },
  unknown: { SR: 'Raspored nije potvrđen', EN: 'Schedule not confirmed' }
};

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, 14, { animate: true });
    }
  }, [center, map]);
  return null;
}

const analyzeExposure = (eventId, radiusM, signal) =>
  fetch(`${API_BASE_URL}/exposure/analyze/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_id: String(eventId), radius_m: Number(radiusM) }),
    signal
  }).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });

export default function Exposure() {
  const context = useOutletContext();
  const lang = context?.lang || 'SR';
  const navigate = useNavigate();
  const locale = lang === 'SR' ? 'sr-Latn-RS' : 'en-GB';

  const [eventsList, setEventsList] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [radius, setRadius] = useState(400);

  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(false);
  const [compare, setCompare] = useState([]);

  // 1. Događaji iz API-ja
  useEffect(() => {
    fetchEvents()
      .then(data => {
        const raw = Array.isArray(data) ? data : (data?.results || data?.events || []);
        const mapped = raw.map(ev => ({
          id: ev.id,
          title: ev.title,
          municipality: ev.location?.municipality || '',
          status: ev.status || 'unknown',
          start: ev.start_time,
          end: ev.expected_end_time,
          lat: ev.location?.latitude ?? null,
          lng: ev.location?.longitude ?? null
        }));
        setEventsList(mapped);
        const preferred = mapped.find(e => e.status === 'ongoing' && e.lat !== null) || mapped.find(e => e.lat !== null) || mapped[0];
        if (preferred) setSelectedEventId(preferred.id);
      })
      .catch(err => console.error('Events error:', err))
      .finally(() => setEventsLoading(false));
  }, []);

  const currentEvent = eventsList.find(e => String(e.id) === String(selectedEventId)) || null;
  const hasLocation = !!currentEvent && currentEvent.lat !== null && currentEvent.lng !== null;

  // 2. Analiza izloženosti za izabrani događaj i radijus (server računa sve)
  useEffect(() => {
    if (!hasLocation) { setAnalysis(null); return; }
    const controller = new AbortController();
    setAnalysisLoading(true);
    setAnalysisError(false);
    const timer = setTimeout(() => {
      analyzeExposure(currentEvent.id, radius, controller.signal)
        .then(data => { setAnalysis(data); setAnalysisLoading(false); })
        .catch(err => {
          if (err.name === 'AbortError') return;
          console.error('Exposure error:', err);
          setAnalysis(null);
          setAnalysisError(true);
          setAnalysisLoading(false);
        });
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [selectedEventId, radius, hasLocation]);

  // 3. Poređenje radijusa (250 / 500 / 1000 m) - takođe iz API-ja
  useEffect(() => {
    if (!hasLocation) { setCompare([]); return; }
    let cancelled = false;
    Promise.all([250, 500, 1000].map(r =>
      analyzeExposure(currentEvent.id, r)
        .then(d => ({ radius: r, pop: d.population?.estimated_total ?? null, count: d.facilities?.total_in_zone ?? null }))
        .catch(() => ({ radius: r, pop: null, count: null }))
    )).then(rows => { if (!cancelled) setCompare(rows); });
    return () => { cancelled = true; };
  }, [selectedEventId, hasLocation]);

  const fmtNum = (v) => (v === null || v === undefined) ? '—' : Number(v).toLocaleString(locale);
  const fmtDateTime = (iso) => iso
    ? new Date(iso).toLocaleString(locale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  const population = analysis?.population?.estimated_total ?? null;
  const facilityItems = (analysis?.facilities?.items || []).slice().sort((a, b) => a.distance_m - b.distance_m);
  const byCategory = analysis?.facilities?.by_category || {};
  const center = analysis?.center
    ? [analysis.center.latitude, analysis.center.longitude]
    : (hasLocation ? [currentEvent.lat, currentEvent.lng] : [45.2520, 19.8250]);
  const statusLabel = currentEvent ? (EVENT_STATUS_LABELS[currentEvent.status]?.[lang] || currentEvent.status) : '';
    const eventTime = currentEvent
    ? (currentEvent.start && currentEvent.end
        ? `${fmtDateTime(currentEvent.start)} – ${fmtDateTime(currentEvent.end)}`
        : currentEvent.end
          ? `${lang === 'SR' ? 'najavljeni završetak' : 'announced end'}: ${fmtDateTime(currentEvent.end)}`
          : (currentEvent.start ? `${lang === 'SR' ? 'početak' : 'start'}: ${fmtDateTime(currentEvent.start)}` : ''))
    : '';

  const limitations = lang === 'SR'
    ? [
        'Krug nije potvrđena zona prekida vodosnabdevanja.',
        'Broj stanovnika je modelovana procena (alpha skup podataka), a ne popis.',
        'Ćelija mreže od 100 m se računa u celosti ako joj je centar unutar kruga.',
        'Procena je zaokružena na 10 stanovnika.'
      ]
    : [
        'The circle is not a confirmed water outage zone.',
        'Population is a modelled estimate (alpha dataset), not a census count.',
        'A 100 m grid cell is counted fully if its centre lies inside the circle.',
        'The estimate is rounded to the nearest 10 persons.'
      ];

  return (
    <div className="exposure-container" style={{ padding: '1.25rem 1.5rem', maxWidth: '1700px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>

      <style>{`
        @media (max-width: 1024px) {
          .exposure-grid-3 { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .exposure-container { padding: 0.75rem 1rem !important; }
          .simulator-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* 1. ZAGLAVLJE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            {lang === 'SR' ? 'Prostorna analiza izloženosti' : 'Spatial Exposure Analysis'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.2rem 0 0 0' }}>
            {lang === 'SR'
              ? 'Procena potencijalne izloženosti stanovništva (WorldPop 2021) i kritične infrastrukture unutar kruga oko izabranog događaja.'
              : 'Assessment of potential population exposure (WorldPop 2021) and critical infrastructure within a circle around the selected event.'}
          </p>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '0.5rem 0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.65rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', flexShrink: 0 }}>
            <ShieldAlert size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
              {lang === 'SR' ? 'Izabrani događaj' : 'Selected Event'}
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0f172a' }}>
              {currentEvent ? currentEvent.title : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. KONTROLE */}
      <div style={{ backgroundColor: '#fff', padding: '1.25rem 1.5rem', borderRadius: '12px', border: '1px solid #0284c7', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.06)', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', marginBottom: '0.85rem' }}>
          <Calculator size={18} />
          <h2 style={{ fontSize: '0.98rem', fontWeight: '700', margin: 0 }}>
            {lang === 'SR' ? 'Simulator potencijalne izloženosti' : 'Potential Exposure Impact Simulator'}
          </h2>
        </div>

        <div className="simulator-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1.2fr) minmax(280px, 1.4fr) minmax(240px, 1fr)', gap: '1.25rem', alignItems: 'center' }}>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
              {lang === 'SR' ? 'Izaberite događaj / lokaciju prekida:' : 'Select Event / Outage Location:'}
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              disabled={eventsList.length === 0}
              style={{ width: '100%', padding: '0.5rem 0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', backgroundColor: '#f8fafc', fontWeight: '600', cursor: 'pointer', color: '#0f172a' }}
            >
              {eventsList.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}{ev.municipality ? ` (${ev.municipality})` : ''}
                </option>
              ))}
            </select>
            {currentEvent && (
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.3rem' }}>
                {statusLabel}{eventTime ? ` · ${eventTime}` : ''}
              </div>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                {lang === 'SR' ? 'Radijus analize:' : 'Analysis Radius:'}
              </label>
              <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0284c7' }}>{radius} {lang === 'SR' ? 'metara' : 'meters'}</span>
            </div>
            <input
              type="range"
              min="100"
              max="1000"
              step="50"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#0284c7', cursor: 'pointer' }}
            />
          </div>

          <div style={{ backgroundColor: '#f0f9ff', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #bae6fd' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#0369a1', fontWeight: '700', textTransform: 'uppercase' }}>
                {lang === 'SR' ? 'Stanovništvo (WorldPop 2021)' : 'Population (WorldPop 2021)'}
              </span>
              <Users size={15} color="#0284c7" />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: population === null ? '#94a3b8' : '#0c4a6e', marginTop: '0.1rem' }}>
              {population === null ? '—' : `~${fmtNum(population)}`}
              {population !== null && <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}> {lang === 'SR' ? 'stanovnika' : 'residents'}</span>}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#0369a1', marginTop: '0.1rem' }}>
              {analysisLoading
                ? (lang === 'SR' ? 'Računanje...' : 'Calculating...')
                : (lang === 'SR' ? 'Modelovana procena, ne popis' : 'Modelled estimate, not a census')}
            </div>
          </div>

        </div>
      </div>

      {/* Upozorenja: nema događaja / lokacije / greška */}
      {!eventsLoading && eventsList.length === 0 && (
        <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.82rem', marginBottom: '1.25rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <AlertTriangle size={15} />
          {lang === 'SR' ? 'Nema dostupnih događaja.' : 'No events available.'}
        </div>
      )}
      {currentEvent && !hasLocation && (
        <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.82rem', marginBottom: '1.25rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <AlertTriangle size={15} />
          {lang === 'SR' ? 'Za ovaj događaj lokacija nije poznata, pa analiza izloženosti nije moguća.' : 'The location of this event is unknown, so exposure analysis is not possible.'}
        </div>
      )}
      {analysisError && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.82rem', marginBottom: '1.25rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <AlertTriangle size={15} />
          {lang === 'SR' ? 'Analiza trenutno nije dostupna.' : 'Analysis currently unavailable.'}
        </div>
      )}

      {/* 3. MAPA + USTANOVE + STATISTIKA */}
      <div className="exposure-grid-3" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1.2fr) 340px', gap: '1.25rem', marginBottom: '1.25rem', alignItems: 'stretch' }}>

        {/* MAPA */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <MapPin size={18} color="#0284c7" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              {lang === 'SR' ? 'Prikaz zone na mapi' : 'Analysis Zone on Map'}
            </h3>
          </div>

          <div style={{ flex: 1, minHeight: '340px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', position: 'relative' }}>
            <MapContainer center={center} zoom={14} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
              <MapUpdater center={center} />
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {hasLocation && (
                <>
                  <Circle
                    center={center}
                    radius={radius}
                    pathOptions={{ fillColor: '#ef4444', fillOpacity: 0.15, color: '#dc2626', weight: 2 }}
                  />
                  <Marker position={center} icon={icons.event}>
                    <Popup>
                      <strong style={{ color: '#dc2626' }}>{currentEvent.title}</strong><br />
                      {lang === 'SR' ? 'Radijus' : 'Radius'}: {radius} m
                    </Popup>
                  </Marker>
                </>
              )}

              {facilityItems.map((fac) => (
                <Marker key={fac.id} position={[fac.latitude, fac.longitude]} icon={icons.facility}>
                  <Popup>
                    <strong style={{ color: '#9333ea' }}>{fac.name || (lang === 'SR' ? 'Bez naziva' : 'Unnamed')}</strong><br />
                    {CATEGORY_LABELS[fac.category]?.[lang] || fac.category}<br />
                    {lang === 'SR' ? 'Udaljenost' : 'Distance'}: {fac.distance_m} m
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* KRITIČNE USTANOVE U ZONI */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Building2 size={18} color="#0284c7" />
              <h3 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                {lang === 'SR' ? 'Kritične ustanove u zoni analize' : 'Critical Facilities in Zone'}
              </h3>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700' }}>
              {analysis ? fmtNum(analysis.facilities?.total_in_zone) : '—'}
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '350px' }}>
            {facilityItems.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
                {!analysis
                  ? (lang === 'SR' ? 'Nema podataka.' : 'No data.')
                  : (lang === 'SR' ? 'Nema kritičnih ustanova u ovoj zoni.' : 'No critical facilities in this zone.')}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: '700', fontSize: '0.72rem', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '0.6rem' }}>{lang === 'SR' ? 'Naziv ustanove' : 'Facility Name'}</th>
                    <th style={{ padding: '0.6rem' }}>{lang === 'SR' ? 'Tip' : 'Type'}</th>
                    <th style={{ padding: '0.6rem' }}>{lang === 'SR' ? 'Udaljenost' : 'Distance'}</th>
                  </tr>
                </thead>
                <tbody>
                  {facilityItems.map((fac) => (
                    <tr key={fac.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.6rem', fontWeight: '600', color: fac.name ? '#0f172a' : '#94a3b8' }}>
                        {fac.name || (lang === 'SR' ? 'Bez naziva (OpenStreetMap)' : 'Unnamed (OpenStreetMap)')}
                      </td>
                      <td style={{ padding: '0.6rem', color: '#475569' }}>{CATEGORY_LABELS[fac.category]?.[lang] || fac.category}</td>
                      <td style={{ padding: '0.6rem', color: '#334155', fontWeight: '600' }}>{fac.distance_m} m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* USTANOVE PO KATEGORIJI */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <Users size={18} color="#0284c7" />
              <h3 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                {lang === 'SR' ? 'Ustanove po kategoriji' : 'Facilities by Category'}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8rem' }}>
              {CATEGORY_ORDER.map((cat, i) => (
                <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: i < CATEGORY_ORDER.length - 1 ? '0.45rem' : 0, borderBottom: i < CATEGORY_ORDER.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <span style={{ color: '#64748b' }}>{CATEGORY_LABELS[cat][lang]}</span>
                  <strong style={{ color: analysis ? '#0f172a' : '#94a3b8' }}>{analysis ? fmtNum(byCategory[cat] ?? 0) : '—'}</strong>
                </div>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.5rem', color: '#1d4ed8', fontSize: '0.7rem', marginTop: '0.75rem', display: 'flex', gap: '0.3rem', alignItems: 'flex-start' }}>
            <Info size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{lang === 'SR' ? 'Ustanove su iz OpenStreetMap-a i mogu biti nepotpune.' : 'Facilities come from OpenStreetMap and may be incomplete.'}</span>
          </div>
        </div>

      </div>

      {/* 4. DONJI RED */}
      <div className="exposure-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', alignItems: 'stretch' }}>

        {/* POREĐENJE RADIJUSA */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <Calculator size={18} color="#0284c7" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              {lang === 'SR' ? 'Poređenje radijusa' : 'Radius Comparison'}
            </h3>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: '700' }}>
                <th style={{ padding: '0.45rem' }}>{lang === 'SR' ? 'Radijus' : 'Radius'}</th>
                <th style={{ padding: '0.45rem' }}>{lang === 'SR' ? 'Stanovništvo' : 'Population'}</th>
                <th style={{ padding: '0.45rem' }}>{lang === 'SR' ? 'Ustanove u zoni' : 'Facilities in Zone'}</th>
              </tr>
            </thead>
            <tbody>
              {[250, 500, 1000].map((r) => {
                const row = compare.find(c => c.radius === r);
                return (
                  <tr key={r} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.45rem', fontWeight: '700', color: '#0f172a' }}>{fmtNum(r)} m</td>
                    <td style={{ padding: '0.45rem', color: row?.pop == null ? '#94a3b8' : '#334155' }}>{row?.pop == null ? '—' : `~${fmtNum(row.pop)}`}</td>
                    <td style={{ padding: '0.45rem', color: row?.count == null ? '#94a3b8' : '#475569' }}>{fmtNum(row?.count)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* METODOLOGIJA */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <FileText size={18} color="#0284c7" />
              <h3 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                {lang === 'SR' ? 'Metodologija i izvori' : 'Methodology & Sources'}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.82rem', color: '#334155', lineHeight: '1.45' }}>
              <div>
                <strong style={{ color: '#0f172a' }}>{lang === 'SR' ? 'Stanovništvo:' : 'Population:'}</strong>{' '}
                {analysis?.population?.source?.name || 'WorldPop, Constrained estimates 2021'}
                {analysis?.population?.source?.license ? ` (${analysis.population.source.license})` : ''}
              </div>
              <div>
                <strong style={{ color: '#0f172a' }}>{lang === 'SR' ? 'Kritični objekti:' : 'Critical Facilities:'}</strong>{' '}
                {analysis?.facilities?.source || 'OpenStreetMap contributors (ODbL)'}
              </div>
              <div>
                <strong style={{ color: '#0f172a' }}>{lang === 'SR' ? 'Ograničenja:' : 'Limitations:'}</strong>
                <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.1rem', fontSize: '0.76rem', color: '#475569' }}>
                  {limitations.map((l, i) => <li key={i}>{l}</li>)}
                </ul>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.5rem', color: '#1d4ed8', fontSize: '0.76rem', marginTop: '0.75rem', display: 'flex', gap: '0.3rem', alignItems: 'flex-start' }}>
            <Info size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{lang === 'SR' ? 'Rezultate računa server (POST /exposure/analyze/).' : 'Results are calculated server-side (POST /exposure/analyze/).'}</span>
          </div>
        </div>

        {/* DALJE AKCIJE */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <Building2 size={18} color="#0284c7" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              {lang === 'SR' ? 'Dalje akcije' : 'Further Actions'}
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center', flex: 1 }}>
            <button
              onClick={() => navigate('/disruptions')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 0.65rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', justifyContent: 'center', width: '100%' }}
            >
              <Activity size={14} />
              <span>{lang === 'SR' ? 'Pregledaj prekide i incidente' : 'View Disruptions & Incidents'}</span>
            </button>

            <button
              onClick={() => navigate('/map')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', justifyContent: 'center', width: '100%' }}
            >
              <MapPin size={14} />
              <span>{lang === 'SR' ? 'Prikaži zonu na GIS mapi' : 'Show zone on GIS map'}</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
