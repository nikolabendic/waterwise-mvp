
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { 
  Search, Info, AlertTriangle, Users, Building2, MapPin, 
  Layers, ChevronDown 
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { fetchEvents, fetchStations, fetchFacilities } from '../services/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createColoredIcon = (colorHex) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${colorHex}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

const icons = {
  unplanned: createColoredIcon('#dc2626'),
  planned: createColoredIcon('#d97706'),
  station: createColoredIcon('#0284c7'),
  facility: createColoredIcon('#9333ea')
};

export default function MapView() {
  const context = useOutletContext();
  const lang = context?.lang || 'EN';
  const t = context?.t || {};

  const noviSadCenter = [45.2520, 19.8250];

  const [events, setEvents] = useState([]);
  const [stations, setStations] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [analysisRadius, setAnalysisRadius] = useState(500);
  const [searchQuery, setSearchQuery] = useState('');

  const [layers, setLayers] = useState({
    activeDisruptions: true,
    plannedWorks: true,
    stations: true,
    criticalFacilities: true,
    populationGrid: false,
    cityLimit: false
  });

  useEffect(() => {
    fetchEvents().then(data => {
      if (data && data.length > 0) {
        const mappedEvents = data.map((ev, index) => ({
          id: ev.id || index,
          title: ev.title || 'Događaj',
          location: ev.location?.address ? `${ev.location.address}, ${ev.location.municipality || 'Novi Sad'}` : 'Novi Sad',
          municipality: ev.location?.municipality || 'Novi Sad',
          lat: ev.location?.latitude || (45.2520 + (index * 0.005)),
          lng: ev.location?.longitude || (19.8250 + (index * 0.005)),
          publishTime: ev.source?.published_at ? `${ev.source.published_at}` : (lang === 'SR' ? '28. okt 2026' : 'Oct 28, 2026'),
          status: ev.status === 'ongoing' ? (lang === 'SR' ? 'Aktivni prekid' : 'Active outage') : (lang === 'SR' ? 'Planirani radovi' : 'Planned maintenance'),
          typeTag: ev.location?.location_accuracy || 'Približna lokacija',
          source: ev.source?.name || 'JKP Vodovod i kanalizacija',
          description: ev.description || ev.title,
          radius: 500,
          basePopulation: 4500, // Osnovna baza stanovnika za 500m
          type: ev.event_type?.includes('planned') ? 'planned' : 'unplanned'
        }));
        setEvents(mappedEvents);
        setSelectedEventId(mappedEvents[0].id);
        setAnalysisRadius(mappedEvents[0].radius || 500);
      } else {
        setEvents([
          {
            id: 101,
            title: lang === 'SR' ? 'Havarija – Bulevar oslobođenja' : 'Accident – Bulevar oslobođenja',
            location: 'Bulevar oslobođenja, Novi Sad',
            lat: 45.2520,
            lng: 19.8360,
            status: lang === 'SR' ? 'Aktivni prekid' : 'Active outage',
            description: lang === 'SR' ? 'Zamena ventila na distributivnoj mreži.' : 'Valve replacement.',
            radius: 500,
            basePopulation: 5100,
            type: 'unplanned'
          }
        ]);
        setSelectedEventId(101);
        setAnalysisRadius(500);
      }
    });

    fetchStations().then(data => {
      if (data) setStations(data);
    });

    fetchFacilities().then(data => {
      const rawFacs = Array.isArray(data) ? data : (data?.results || []);
      if (rawFacs.length > 0) {
        const mappedFacs = rawFacs.map((fac, idx) => ({
          id: fac.id || `fac-${idx}`,
          name: fac.name || (lang === 'SR' ? 'Kritična ustanova' : 'Critical Facility'),
          category: fac.category || 'facility',
          address: fac.address || 'Novi Sad',
          lat: fac.latitude || (45.24 + (idx * 0.003)),
          lng: fac.longitude || (19.81 + (idx * 0.003))
        }));
        setFacilities(mappedFacs);
      } else {
        setFacilities([
          { id: 'f1', name: 'Klinički centar Vojvodine (KCV)', category: 'hospital', address: 'Hajduk Veljkova 1-9', lat: 45.2530, lng: 19.8315 },
          { id: 'f2', name: 'Osnovna škola "Đura Jakšić"', category: 'school', address: 'Trg mladenaca 5', lat: 45.2505, lng: 19.8450 }
        ]);
      }
    }).catch(err => {
      console.error('Facilities fetch error:', err);
      setFacilities([
        { id: 'f1', name: 'Klinički centar Vojvodine (KCV)', category: 'hospital', address: 'Hajduk Veljkova 1-9', lat: 45.2530, lng: 19.8315 },
        { id: 'f2', name: 'Osnovna škola "Đura Jakšić"', category: 'school', address: 'Trg mladenaca 5', lat: 45.2505, lng: 19.8450 }
      ]);
    });
  }, [lang]);

  const selectedEvent = events.find(e => e.id === selectedEventId) || events[0];

  // Dinamički izračunat broj stanovnika na osnovu odnosa radijusa i bazne vrednosti
  const calculatedPopulation = selectedEvent 
    ? Math.round((selectedEvent.basePopulation || 4500) * Math.pow(analysisRadius / 500, 2)).toLocaleString('sr-RS')
    : '0';

  const toggleLayer = (layerKey) => {
    setLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const handleSelectEvent = (ev) => {
    setSelectedEventId(ev.id);
    setAnalysisRadius(ev.radius || 500);
  };

  return (
    <div style={{ padding: '1.25rem 1.75rem', maxWidth: '1600px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
          {lang === 'SR' ? 'GIS prostorni pregled – Novi Sad' : 'GIS Spatial Overview – Novi Sad'}
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.2rem 0 0 0' }}>
          {lang === 'SR' 
            ? 'Pregled aktivnih i planiranih događaja, kritične infrastrukture i prostorne analize potencijalne izloženosti.'
            : 'Overview of active and planned events, critical infrastructure, and spatial exposure analysis.'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 390px', gap: '1.25rem', height: '700px' }}>
        
        {/* LEVA STRANA: MAPA */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          
          <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 1000, width: '310px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', padding: '0.45rem 0.75rem' }}>
            <Search size={16} color="#64748b" style={{ marginRight: '0.5rem' }} />
            <input 
              type="text" 
              placeholder={lang === 'SR' ? "Pretraga lokacije, adrese..." : "Search location, address..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.82rem', color: '#0f172a' }}
            />
          </div>

          <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 1000, backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', padding: '0.6rem 0.8rem', width: '200px', fontSize: '0.75rem' }}>
            <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{lang === 'SR' ? 'Slojevi mape' : 'Map Layers'}</span>
              <Layers size={13} color="#0284c7" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label onClick={() => toggleLayer('activeDisruptions')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: '#334155' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#dc2626' }}></span>
                {lang === 'SR' ? 'Aktivni prekidi' : 'Active outages'}
              </label>

              <label onClick={() => toggleLayer('plannedWorks')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: '#334155' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d97706' }}></span>
                {lang === 'SR' ? 'Planirani radovi' : 'Planned works'}
              </label>

              <label onClick={() => toggleLayer('stations')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: '#334155' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284c7' }}></span>
                {lang === 'SR' ? 'Hidrološke stanice' : 'Hydro stations'}
              </label>

              <label onClick={() => toggleLayer('criticalFacilities')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: '#334155' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#9333ea' }}></span>
                {lang === 'SR' ? 'Kritične ustanove' : 'Critical facilities'}
              </label>
            </div>
          </div>

          <div style={{ flex: 1, width: '100%', position: 'relative' }}>
            <MapContainer center={noviSadCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {selectedEvent && selectedEvent.lat && selectedEvent.lng && (
                <Circle
                  center={[selectedEvent.lat, selectedEvent.lng]}
                  radius={analysisRadius}
                  pathOptions={{ 
                    color: '#dc2626', 
                    fillColor: '#ef4444', 
                    fillOpacity: 0.2, 
                    weight: 1.5, 
                    dashArray: '4, 4' 
                  }}
                />
              )}

              {layers.activeDisruptions && events.filter(e => e.type === 'unplanned').map((ev) => ev.lat && ev.lng && (
                <Marker 
                  key={`unplanned-${ev.id}`} 
                  position={[ev.lat, ev.lng]} 
                  icon={icons.unplanned}
                  eventHandlers={{ click: () => handleSelectEvent(ev) }}
                >
                  <Popup>
                    <div style={{ padding: '0.2rem' }}>
                      <strong style={{ color: '#dc2626', fontSize: '0.85rem' }}>{ev.title}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>{ev.location}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {layers.plannedWorks && events.filter(e => e.type === 'planned').map((ev) => ev.lat && ev.lng && (
                <Marker 
                  key={`planned-${ev.id}`} 
                  position={[ev.lat, ev.lng]} 
                  icon={icons.planned}
                  eventHandlers={{ click: () => handleSelectEvent(ev) }}
                >
                  <Popup>
                    <div style={{ padding: '0.2rem' }}>
                      <strong style={{ color: '#d97706', fontSize: '0.85rem' }}>{ev.title}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>{ev.location}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {layers.stations && stations.map((st, idx) => st.latitude && st.longitude && (
                <Marker
                  key={`station-${st.station_id || idx}`}
                  position={[st.latitude, st.longitude]}
                  icon={icons.station}
                >
                  <Popup>
                    <div style={{ padding: '0.2rem' }}>
                      <strong style={{ color: '#0284c7', fontSize: '0.85rem' }}>{st.name || 'RHMZ stanica'}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Reka: {st.river || 'Dunav'}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {layers.criticalFacilities && facilities.map((fac, idx) => fac.lat && fac.lng && (
                <Marker
                  key={`facility-${fac.id || idx}`}
                  position={[fac.lat, fac.lng]}
                  icon={icons.facility}
                >
                  <Popup>
                    <div style={{ padding: '0.2rem' }}>
                      <strong style={{ color: '#9333ea', fontSize: '0.85rem' }}>{fac.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Kategorija: {fac.category}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{fac.address}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}

            </MapContainer>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: '0.6rem 1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.72rem', color: '#475569', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#dc2626' }}></span>
              {lang === 'SR' ? 'Aktivni prekid' : 'Active outage'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#d97706' }}></span>
              {lang === 'SR' ? 'Planirani radovi' : 'Planned works'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#0284c7' }}></span>
              {lang === 'SR' ? 'Hidrološka stanica' : 'Hydro station'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#9333ea' }}></span>
              {lang === 'SR' ? 'Kritična ustanova' : 'Critical facility'}
            </div>
          </div>

        </div>

        {/* DESNA STRANA: ANALIZA IZABRANE LOKACIJE */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.35rem 1.45rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflowY: 'auto' }}>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={18} color="#0284c7" />
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  {lang === 'SR' ? 'Analiza izabrane lokacije' : 'Selected Location Analysis'}
                </h3>
              </div>
              <ChevronDown size={16} color="#94a3b8" />
            </div>

            {selectedEvent && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>
                    {lang === 'SR' ? 'IZABRANI DOGAĐAJ' : 'SELECTED EVENT'}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginTop: '0.15rem' }}>
                    {selectedEvent.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                    {selectedEvent.location}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.72rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                    {selectedEvent.status}
                  </span>
                  <span style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                    {selectedEvent.source}
                  </span>
                </div>

                <div style={{ fontSize: '0.82rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div><strong>{lang === 'SR' ? 'Datum i vreme objave:' : 'Date & time:'}</strong> {selectedEvent.publishTime}</div>
                  <div><strong>{lang === 'SR' ? 'Opis:' : 'Description:'}</strong> {selectedEvent.description}</div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span>{lang === 'SR' ? 'Zona prostorne analize' : 'Spatial analysis zone'}</span>
                      <Info size={14} color="#94a3b8" />
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

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Users size={16} color="#0284c7" />
                    <span>{lang === 'SR' ? 'Stanovništvo u zoni analize' : 'Population in analysis zone'}</span>
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
                    {calculatedPopulation} <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#64748b' }}>{lang === 'SR' ? 'stanovnika' : 'residents'}</span>
                  </div>
                </div>

              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.75rem', fontSize: '0.73rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem 0.5rem', color: '#475569' }}>
              <div><strong>{lang === 'SR' ? 'Opština:' : 'Municipality:'}</strong></div>
              <div>{selectedEvent?.municipality || 'Novi Sad'}</div>

              <div><strong>{lang === 'SR' ? 'Izvor:' : 'Source:'}</strong></div>
              <div>{selectedEvent?.source || 'JKP Vodovod'}</div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}