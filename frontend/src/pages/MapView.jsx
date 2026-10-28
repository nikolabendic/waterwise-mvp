
import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { 
  Search, Info, AlertTriangle, Users, Building2, MapPin, 
  Layers, ChevronDown 
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapView() {
  const context = useOutletContext();
  const lang = context?.lang || 'EN';
  const t = context?.t || {};

  const noviSadCenter = [45.2520, 19.8250];

  const sampleEvents = [
    { 
      id: 101, 
      title: lang === 'SR' ? 'Havarija – Bulevar oslobođenja' : 'Accident – Bulevar oslobođenja', 
      location: lang === 'SR' ? 'Bulevar oslobođenja (kod Futoške pijace), Novi Sad' : 'Bulevar oslobođenja (near Futoška market), Novi Sad',
      municipality: 'Novi Sad - Podbara / Rotkvarija',
      lat: 45.2520, 
      lng: 19.8360, 
      publishTime: '27. okt 2026, 08:00 – 16:00',
      status: lang === 'SR' ? 'Aktivni prekid' : 'Active outage',
      typeTag: lang === 'SR' ? 'Približna lokacija' : 'Approximate location',
      source: 'JKP Vodovod i kanalizacija',
      description: lang === 'SR' ? 'Zamena ventila na distributivnoj mreži u zoni Futoške pijace.' : 'Valve replacement on the distribution network near Futoška market.',
      radius: 500, 
      popAffected: '5.100',
      hospitals: 1,
      schools: 2,
      social: 0,
      type: 'unplanned'
    },
    { 
      id: 102, 
      title: lang === 'SR' ? 'Prekid – Bulevar Slobodana Jovanovića' : 'Outage – Bulevar Slobodana Jovanovića', 
      location: lang === 'SR' ? 'Bulevar Slobodana Jovanovića (Novo Naselje)' : 'Bulevar Slobodana Jovanovića (Novo Naselje)', 
      municipality: 'Novi Sad - Novo Naselje',
      lat: 45.2538, 
      lng: 19.8020, 
      publishTime: '27. okt 2026, 09:00 – 17:00',
      status: lang === 'SR' ? 'Aktivni prekid' : 'Active outage',
      typeTag: lang === 'SR' ? 'Približna lokacija' : 'Approximate location',
      source: 'JKP Vodovod i kanalizacija',
      description: lang === 'SR' ? 'Hitna sanacija distributivnog cevovoda usled pucanja magistrale.' : 'Emergency repair of the main distribution pipe due to a burst pipe.',
      radius: 400, 
      popAffected: '4.500',
      hospitals: 1,
      schools: 3,
      social: 1,
      type: 'unplanned'
    },
    { 
      id: 103, 
      title: lang === 'SR' ? 'Planirani radovi – Bulevar Evrope' : 'Planned Work – Bulevar Evrope', 
      location: lang === 'SR' ? 'Bulevar Evrope (segment kod Detelinare)' : 'Bulevar Evrope (Detelinara segment)', 
      municipality: 'Novi Sad - Detelinara',
      lat: 45.2588, 
      lng: 19.8130, 
      publishTime: '28. okt 2026, 08:00 – 18:00',
      status: lang === 'SR' ? 'Planirani radovi' : 'Planned maintenance',
      typeTag: lang === 'SR' ? 'Planirano' : 'Planned',
      source: 'JKP Vodovod i kanalizacija',
      description: lang === 'SR' ? 'Priključak novih korisnika na vodovodnu mrežu.' : 'Connecting new consumers to the water supply network.',
      radius: 350, 
      popAffected: '3.200',
      hospitals: 0,
      schools: 2,
      social: 0,
      type: 'planned'
    }
  ];

  const [selectedEventId, setSelectedEventId] = useState(101);
  const selectedEvent = sampleEvents.find(e => e.id === selectedEventId) || sampleEvents[0];
  const [analysisRadius, setAnalysisRadius] = useState(selectedEvent.radius || 500);
  const [searchQuery, setSearchQuery] = useState('');

  const [layers, setLayers] = useState({
    activeDisruptions: true,
    plannedWorks: true,
    stations: true,
    criticalFacilities: true,
    populationGrid: false,
    cityLimit: false
  });

  const toggleLayer = (layerKey) => {
    setLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const handleSelectEvent = (ev) => {
    setSelectedEventId(ev.id);
    setAnalysisRadius(ev.radius || 500);
  };

  return (
    <div style={{ padding: '1.25rem 1.75rem', maxWidth: '1600px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      {}
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

      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 390px', gap: '1.25rem', height: '700px' }}>
        
        {}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          
          {}
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

          {}
          <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 1000, backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', padding: '0.6rem 0.8rem', width: '200px', fontSize: '0.75rem' }}>
            <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{lang === 'SR' ? 'Slojevi mape' : 'Map Layers'}</span>
              <Layers size={13} color="#0284c7" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label onClick={() => toggleLayer('activeDisruptions')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: '#334155' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#dc2626' }}></span>
                {lang === 'SR' ? 'Aktivni prekidi (3)' : 'Active outages (3)'}
              </label>

              <label onClick={() => toggleLayer('plannedWorks')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: '#334155' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d97706' }}></span>
                {lang === 'SR' ? 'Planirani radovi (2)' : 'Planned works (2)'}
              </label>

              <label onClick={() => toggleLayer('stations')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: '#334155' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284c7' }}></span>
                {lang === 'SR' ? 'Hidrološke stanice (4)' : 'Hydro stations (4)'}
              </label>

              <label onClick={() => toggleLayer('criticalFacilities')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: '#334155' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#9333ea' }}></span>
                {lang === 'SR' ? 'Kritične ustanove (6)' : 'Critical facilities (6)'}
              </label>
            </div>
          </div>

          {}
          <div style={{ flex: 1, width: '100%', position: 'relative' }}>
            <MapContainer center={noviSadCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {selectedEvent && (
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

              {sampleEvents.map((ev) => (
                <Marker 
                  key={ev.id} 
                  position={[ev.lat, ev.lng]} 
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
            </MapContainer>
          </div>

          {}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ border: '1px dashed #ef4444', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '1px 5px', borderRadius: '4px' }}></span>
              {lang === 'SR' ? 'Zona analize' : 'Analysis zone'}
            </div>
          </div>

        </div>

        {}
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
                  <span style={{ backgroundColor: '#fef3c7', color: '#b45309', fontSize: '0.72rem', fontWeight: '600', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                    {selectedEvent.typeTag}
                  </span>
                  <span style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                    {lang === 'SR' ? 'Izvor: JKP Vodovod' : 'Source: Public Waterworks'}
                  </span>
                </div>

                <div style={{ fontSize: '0.82rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div><strong>{lang === 'SR' ? 'Datum i vreme objave:' : 'Date & time:'}</strong> {selectedEvent.publishTime}</div>
                  <div><strong>{lang === 'SR' ? 'Opis:' : 'Description:'}</strong> {selectedEvent.description}</div>
                </div>

                {}
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

                {}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Users size={16} color="#0284c7" />
                    <span>{lang === 'SR' ? 'Stanovništvo u zoni analize' : 'Population in analysis zone'}</span>
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
                    {selectedEvent.popAffected} <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#64748b' }}>{lang === 'SR' ? 'stanovnika' : 'residents'}</span>
                  </div>
                </div>

                {}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.5rem' }}>
                    <Building2 size={16} color="#0284c7" />
                    <span>{lang === 'SR' ? 'Kritične ustanove' : 'Critical facilities'}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    <div style={{ backgroundColor: '#f8fafc', padding: '0.5rem', borderRadius: '6px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#dc2626' }}>{selectedEvent.hospitals}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{lang === 'SR' ? 'Zdravstvo' : 'Health'}</div>
                    </div>

                    <div style={{ backgroundColor: '#eff6ff', padding: '0.5rem', borderRadius: '6px', textAlign: 'center', border: '1px solid #dbeafe' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1d4ed8' }}>{selectedEvent.schools}</div>
                      <div style={{ fontSize: '0.68rem', color: '#1e40af' }}>{lang === 'SR' ? 'Škole/Vrtići' : 'Schools'}</div>
                    </div>

                    <div style={{ backgroundColor: '#f8fafc', padding: '0.5rem', borderRadius: '6px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#9333ea' }}>{selectedEvent.social}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{lang === 'SR' ? 'Soc. zaštita' : 'Social'}</div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.75rem', fontSize: '0.73rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem 0.5rem', color: '#475569' }}>
              <div><strong>{lang === 'SR' ? 'Ulica:' : 'Street:'}</strong></div>
              <div>{selectedEvent?.location?.split('(')[0] || 'Bulevar oslobođenja'}</div>

              <div><strong>{lang === 'SR' ? 'Opština:' : 'Municipality:'}</strong></div>
              <div>Novi Sad</div>

              <div><strong>{lang === 'SR' ? 'Izvor:' : 'Source:'}</strong></div>
              <div>JKP Vodovod i kanalizacija</div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}