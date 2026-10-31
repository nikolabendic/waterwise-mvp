import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Search, Info, AlertTriangle, Users, Building2, MapPin, Layers, ExternalLink
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { fetchEvents, fetchStations, fetchFacilities } from '../services/api';

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
  active: createColoredIcon('#dc2626'),
  planned: createColoredIcon('#d97706'),
  completed: createColoredIcon('#94a3b8'),
  station: createColoredIcon('#0284c7'),
  facility: createColoredIcon('#9333ea')
};

const EVENT_STATUS = {
  ongoing: { SR: 'Aktivni prekid', EN: 'Active outage', bg: '#fee2e2', color: '#991b1b' },
  planned: { SR: 'Planirani radovi', EN: 'Planned works', bg: '#fef3c7', color: '#b45309' },
  completed: { SR: 'Završeno', EN: 'Completed', bg: '#f1f5f9', color: '#475569' },
  unknown: { SR: 'Raspored nije potvrđen', EN: 'Schedule not confirmed', bg: '#f1f5f9', color: '#475569' }
};

const ACCURACY_LABELS = {
  approximate: { SR: 'Približna lokacija', EN: 'Approximate location' },
  exact: { SR: 'Tačna lokacija', EN: 'Exact location' }
};

const CATEGORY_LABELS = {
  school: { SR: 'Škola', EN: 'School' },
  kindergarten: { SR: 'Vrtić', EN: 'Kindergarten' },
  hospital: { SR: 'Bolnica', EN: 'Hospital' },
  health_center: { SR: 'Dom zdravlja', EN: 'Health center' },
  social_care: { SR: 'Socijalna zaštita', EN: 'Social care' }
};

function MapUpdater({ center }) {
  const map = useMap();
  const lat = center ? center[0] : null;
  const lng = center ? center[1] : null;
  useEffect(() => {
    if (lat !== null && lng !== null) {
      map.flyTo([lat, lng], Math.max(map.getZoom(), 14), { duration: 0.8 });
    }
  }, [lat, lng, map]);
  return null;
}

export default function MapView() {
  const context = useOutletContext();
  const lang = context?.lang || 'EN';
  const locale = lang === 'SR' ? 'sr-Latn-RS' : 'en-GB';

  const noviSadCenter = [45.2520, 19.8250];

  const [events, setEvents] = useState([]);
  const [stations, setStations] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [analysisRadius, setAnalysisRadius] = useState(500);
  const [searchQuery, setSearchQuery] = useState('');

  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(false);

  const [layers, setLayers] = useState({
    activeDisruptions: true,
    plannedWorks: true,
    completedEvents: true,
    stations: true,
    criticalFacilities: true
  });

  // 1. Podaci iz API-ja
  useEffect(() => {
    fetchEvents().then(data => {
      const raw = Array.isArray(data) ? data : (data?.results || data?.events || []);
      const mapped = raw.map(ev => ({
        id: ev.id,
        title: ev.title,
        address: ev.location?.address || '',
        municipality: ev.location?.municipality || '',
        lat: ev.location?.latitude ?? null,
        lng: ev.location?.longitude ?? null,
        accuracy: ev.location?.location_accuracy || null,
        status: ev.status || 'unknown',
        start: ev.start_time,
        end: ev.expected_end_time,
        published: ev.source?.published_at || null,
        source: ev.source?.name || '',
        sourceUrl: ev.source?.url || null,
        description: ev.description || ''
      }));
      setEvents(mapped);
      const preferred = mapped.find(e => e.status === 'ongoing' && e.lat !== null) || mapped.find(e => e.lat !== null) || mapped[0];
      if (preferred) setSelectedEventId(preferred.id);
    }).catch(err => console.error('Events error:', err));

    fetchStations().then(data => {
      const raw = Array.isArray(data) ? data : (data?.results || []);
      setStations(raw);
    }).catch(err => console.error('Stations error:', err));

    fetchFacilities().then(data => {
      const raw = Array.isArray(data) ? data : (data?.results || []);
      setFacilities(raw.filter(f => f.latitude !== null && f.longitude !== null));
    }).catch(err => console.error('Facilities error:', err));
  }, []);

  const selectedEvent = events.find(e => String(e.id) === String(selectedEventId)) || null;
  const hasLocation = !!selectedEvent && selectedEvent.lat !== null && selectedEvent.lng !== null;
  const stationsWithCoords = stations.filter(s => s.latitude !== null && s.latitude !== undefined && s.longitude !== null && s.longitude !== undefined);

  // 2. Analiza izloženosti sa servera za izabrani događaj
  useEffect(() => {
    if (!hasLocation) { setAnalysis(null); return; }
    const controller = new AbortController();
    setAnalysisLoading(true);
    setAnalysisError(false);
    const timer = setTimeout(() => {
      fetch(`${API_BASE_URL}/exposure/analyze/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: String(selectedEvent.id), radius_m: Number(analysisRadius) }),
        signal: controller.signal
      })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
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
  }, [selectedEventId, analysisRadius, hasLocation]);

  const toggleLayer = (layerKey) => {
    setLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const handleSelectEvent = (ev) => {
    setSelectedEventId(ev.id);
    setSearchQuery('');
  };

  const fmtDateTime = (iso) => iso
    ? new Date(iso).toLocaleString(locale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;
  const fmtDate = (iso) => iso
    ? new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const activeEvents = events.filter(e => e.status === 'ongoing');
  const plannedEvents = events.filter(e => e.status === 'planned');
  const completedEvents = events.filter(e => e.status !== 'ongoing' && e.status !== 'planned');

  const q = searchQuery.trim().toLowerCase();
  const searchResults = q.length >= 2
    ? events.filter(e => `${e.title} ${e.address} ${e.municipality}`.toLowerCase().includes(q)).slice(0, 5)
    : [];

  const statusInfo = selectedEvent ? (EVENT_STATUS[selectedEvent.status] || EVENT_STATUS.unknown) : null;
    const eventTime = selectedEvent
    ? (selectedEvent.start && selectedEvent.end
        ? `${fmtDateTime(selectedEvent.start)} – ${fmtDateTime(selectedEvent.end)}`
        : selectedEvent.end
          ? `${lang === 'SR' ? 'najavljeni završetak' : 'announced end'}: ${fmtDateTime(selectedEvent.end)}`
          : (selectedEvent.start ? `${lang === 'SR' ? 'početak' : 'start'}: ${fmtDateTime(selectedEvent.start)}` : ''))
    : '';
  const population = analysis?.population?.estimated_total ?? null;
  const facilitiesInZone = analysis?.facilities?.total_in_zone ?? null;
  const center = hasLocation ? [selectedEvent.lat, selectedEvent.lng] : null;

  const renderEventMarkers = (list, icon, color) => list.map((ev) => ev.lat !== null && ev.lng !== null && (
    <Marker
      key={`event-${ev.id}`}
      position={[ev.lat, ev.lng]}
      icon={icon}
      eventHandlers={{ click: () => handleSelectEvent(ev) }}
    >
      <Popup>
        <div style={{ padding: '0.2rem' }}>
          <strong style={{ color, fontSize: '0.85rem' }}>{ev.title}</strong>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
            {[ev.address, ev.municipality].filter(Boolean).join(', ')}
          </div>
        </div>
      </Popup>
    </Marker>
  ));

  const layerRow = (key, color, label, count) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: '#334155' }}>
      <input type="checkbox" checked={layers[key]} onChange={() => toggleLayer(key)} style={{ margin: 0, accentColor: color }} />
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }}></span>
      <span>{label} <span style={{ color: '#94a3b8' }}>({count})</span></span>
    </label>
  );

  return (
    <div style={{ padding: '1.25rem 1.75rem', maxWidth: '1600px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>

      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
          {lang === 'SR' ? 'GIS prostorni pregled – Novi Sad' : 'GIS Spatial Overview – Novi Sad'}
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.2rem 0 0 0' }}>
          {lang === 'SR'
            ? 'Pregled događaja, kritične infrastrukture i prostorne analize potencijalne izloženosti.'
            : 'Overview of events, critical infrastructure, and spatial exposure analysis.'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 390px', gap: '1.25rem', height: '700px' }}>

        {/* LEVA STRANA: MAPA */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

          {/* Pretraga događaja */}
          <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 1000, width: '310px' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', padding: '0.45rem 0.75rem' }}>
              <Search size={16} color="#64748b" style={{ marginRight: '0.5rem' }} />
              <input
                type="text"
                placeholder={lang === 'SR' ? 'Pretraga događaja, adrese...' : 'Search events, address...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.82rem', color: '#0f172a' }}
              />
            </div>
            {q.length >= 2 && (
              <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', marginTop: '4px', overflow: 'hidden' }}>
                {searchResults.length === 0 ? (
                  <div style={{ padding: '0.55rem 0.75rem', fontSize: '0.78rem', color: '#94a3b8' }}>
                    {lang === 'SR' ? 'Nema rezultata' : 'No results'}
                  </div>
                ) : searchResults.map(ev => (
                  <div
                    key={ev.id}
                    onClick={() => handleSelectEvent(ev)}
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.78rem', color: '#0f172a', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                  >
                    <div style={{ fontWeight: '600' }}>{ev.title}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{[ev.address, ev.municipality].filter(Boolean).join(', ')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Slojevi */}
          <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 1000, backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', padding: '0.6rem 0.8rem', width: '230px', fontSize: '0.75rem' }}>
            <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{lang === 'SR' ? 'Slojevi mape' : 'Map Layers'}</span>
              <Layers size={13} color="#0284c7" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {layerRow('activeDisruptions', '#dc2626', lang === 'SR' ? 'Aktivni prekidi' : 'Active outages', activeEvents.length)}
              {layerRow('plannedWorks', '#d97706', lang === 'SR' ? 'Planirani radovi' : 'Planned works', plannedEvents.length)}
              {layerRow('completedEvents', '#94a3b8', lang === 'SR' ? 'Završeni događaji' : 'Completed events', completedEvents.length)}
              {layerRow('criticalFacilities', '#9333ea', lang === 'SR' ? 'Kritične ustanove' : 'Critical facilities', facilities.length)}
              {layerRow('stations', '#0284c7', lang === 'SR' ? 'Hidrološke stanice' : 'Hydro stations', stationsWithCoords.length)}
            </div>
            {stations.length > 0 && stationsWithCoords.length === 0 && (
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.4rem', lineHeight: '1.3' }}>
                {lang === 'SR' ? 'Koordinate stanice RHMZ nisu potvrđene, pa se stanica ne prikazuje.' : 'RHMZ station coordinates are not verified, so the station is not shown.'}
              </div>
            )}
          </div>

          <div style={{ flex: 1, width: '100%', position: 'relative' }}>
            <MapContainer center={noviSadCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapUpdater center={center} />

              {hasLocation && (
                <Circle
                  center={center}
                  radius={analysisRadius}
                  pathOptions={{ color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.2, weight: 1.5, dashArray: '4, 4' }}
                />
              )}

              {layers.completedEvents && renderEventMarkers(completedEvents, icons.completed, '#475569')}
              {layers.plannedWorks && renderEventMarkers(plannedEvents, icons.planned, '#d97706')}
              {layers.activeDisruptions && renderEventMarkers(activeEvents, icons.active, '#dc2626')}

              {layers.stations && stationsWithCoords.map((st, idx) => (
                <Marker key={`station-${st.id || idx}`} position={[st.latitude, st.longitude]} icon={icons.station}>
                  <Popup>
                    <div style={{ padding: '0.2rem' }}>
                      <strong style={{ color: '#0284c7', fontSize: '0.85rem' }}>{st.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>{lang === 'SR' ? 'Reka' : 'River'}: {st.river}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {layers.criticalFacilities && facilities.map((fac, idx) => (
                <Marker key={`facility-${fac.id || idx}`} position={[fac.latitude, fac.longitude]} icon={icons.facility}>
                  <Popup>
                    <div style={{ padding: '0.2rem' }}>
                      <strong style={{ color: '#9333ea', fontSize: '0.85rem' }}>
                        {fac.name || (lang === 'SR' ? 'Bez naziva (OpenStreetMap)' : 'Unnamed (OpenStreetMap)')}
                      </strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                        {CATEGORY_LABELS[fac.category]?.[lang] || fac.category}
                      </div>
                      {fac.address && <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{fac.address}</div>}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: '0.6rem 1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.72rem', color: '#475569', flexWrap: 'wrap', gap: '0.5rem' }}>
            {[
              ['#dc2626', lang === 'SR' ? 'Aktivni prekid' : 'Active outage'],
              ['#d97706', lang === 'SR' ? 'Planirani radovi' : 'Planned works'],
              ['#94a3b8', lang === 'SR' ? 'Završen događaj' : 'Completed event'],
              ['#9333ea', lang === 'SR' ? 'Kritična ustanova' : 'Critical facility'],
              ['#0284c7', lang === 'SR' ? 'Hidrološka stanica' : 'Hydro station']
            ].map(([color, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: color }}></span>
                {label}
              </div>
            ))}
          </div>

        </div>

        {/* DESNA STRANA: ANALIZA IZABRANE LOKACIJE */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.35rem 1.45rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflowY: 'auto' }}>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <MapPin size={18} color="#0284c7" />
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                {lang === 'SR' ? 'Analiza izabrane lokacije' : 'Selected Location Analysis'}
              </h3>
            </div>

            {!selectedEvent ? (
              <div style={{ padding: '1.5rem 0', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                {lang === 'SR' ? 'Izaberite događaj na mapi.' : 'Select an event on the map.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>

                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>
                    {lang === 'SR' ? 'Izabrani događaj' : 'Selected event'}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginTop: '0.15rem' }}>
                    {selectedEvent.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                    {[selectedEvent.address, selectedEvent.municipality].filter(Boolean).join(', ') || '—'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ backgroundColor: statusInfo.bg, color: statusInfo.color, fontSize: '0.72rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                    {statusInfo[lang]}
                  </span>
                  {selectedEvent.accuracy && (
                    <span style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                      {ACCURACY_LABELS[selectedEvent.accuracy]?.[lang] || selectedEvent.accuracy}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.82rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div>
                    <strong>{lang === 'SR' ? 'Vreme radova:' : 'Event time:'}</strong>{' '}
                    {eventTime || (lang === 'SR' ? 'nije navedeno' : 'not specified')}
                  </div>
                  {selectedEvent.published && (
                    <div>
                      <strong>{lang === 'SR' ? 'Objavljeno:' : 'Published:'}</strong> {fmtDate(selectedEvent.published)}
                    </div>
                  )}
                  {selectedEvent.description && selectedEvent.description.trim() !== selectedEvent.title.trim() && (
                    <div><strong>{lang === 'SR' ? 'Opis:' : 'Description:'}</strong> {selectedEvent.description}</div>
                  )}
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span>{lang === 'SR' ? 'Zona prostorne analize' : 'Spatial analysis zone'}</span>
                      <span title={lang === 'SR' ? 'Krug oko događaja, nije potvrđena zona prekida.' : 'A circle around the event, not a confirmed outage zone.'} style={{ display: 'inline-flex' }}>
                        <Info size={14} color="#94a3b8" />
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0284c7' }}>
                      {analysisRadius} m
                    </span>
                  </div>

                  <input
                    type="range"
                    min="200"
                    max="1000"
                    step="50"
                    value={analysisRadius}
                    onChange={(e) => setAnalysisRadius(Number(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer', accentColor: '#0284c7' }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                    <span>200 m</span>
                    <span>500 m</span>
                    <span>750 m</span>
                    <span>1.000 m</span>
                  </div>
                </div>

                {!hasLocation ? (
                  <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', borderRadius: '8px', padding: '0.6rem 0.75rem', fontSize: '0.78rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <AlertTriangle size={14} />
                    {lang === 'SR' ? 'Lokacija događaja nije poznata.' : 'The event location is unknown.'}
                  </div>
                ) : analysisError ? (
                  <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', borderRadius: '8px', padding: '0.6rem 0.75rem', fontSize: '0.78rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <AlertTriangle size={14} />
                    {lang === 'SR' ? 'Analiza trenutno nije dostupna.' : 'Analysis currently unavailable.'}
                  </div>
                ) : (
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Users size={16} color="#0284c7" />
                        <span>{lang === 'SR' ? 'Stanovništvo u zoni analize' : 'Population in analysis zone'}</span>
                      </div>
                      <div style={{ fontSize: '1.35rem', fontWeight: '800', color: population === null ? '#94a3b8' : '#0f172a', marginTop: '0.2rem' }}>
                        {population === null ? '—' : `~${population.toLocaleString(locale)}`}{' '}
                        {population !== null && <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#64748b' }}>{lang === 'SR' ? 'stanovnika' : 'residents'}</span>}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                        {analysisLoading
                          ? (lang === 'SR' ? 'Računanje...' : 'Calculating...')
                          : (lang === 'SR' ? 'WorldPop 2021, modelovana procena' : 'WorldPop 2021, modelled estimate')}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Building2 size={16} color="#0284c7" />
                        <span>{lang === 'SR' ? 'Kritične ustanove u zoni' : 'Critical facilities in zone'}</span>
                      </div>
                      <div style={{ fontSize: '1.35rem', fontWeight: '800', color: facilitiesInZone === null ? '#94a3b8' : '#0f172a', marginTop: '0.2rem' }}>
                        {facilitiesInZone === null ? '—' : facilitiesInZone}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.75rem', fontSize: '0.73rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem 0.5rem', color: '#475569' }}>
              <div><strong>{lang === 'SR' ? 'Opština:' : 'Municipality:'}</strong></div>
              <div>{selectedEvent?.municipality || '—'}</div>

              <div><strong>{lang === 'SR' ? 'Izvor:' : 'Source:'}</strong></div>
              <div>
                {selectedEvent?.source
                  ? (selectedEvent.sourceUrl
                      ? <a href={selectedEvent.sourceUrl} target="_blank" rel="noreferrer" style={{ color: '#0284c7', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>{selectedEvent.source} <ExternalLink size={11} /></a>
                      : selectedEvent.source)
                  : '—'}
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
