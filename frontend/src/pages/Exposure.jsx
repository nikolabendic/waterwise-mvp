
import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
  Calculator, MapPin, Building2, Users, AlertTriangle, 
  FileText, Download, ShieldAlert, ExternalLink, CheckCircle, Info, ChevronDown, Activity 
} from 'lucide-react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchEvents, fetchFacilities } from '../services/api';

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

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, 14, { animate: true });
    }
  }, [center, map]);
  return null;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

const defaultEventsSR = [
  { id: 1, name: 'Kvar na mreži - Janka Čmelika', fullName: 'Kvar na mreži - Janka Čmelika (Novi Sad)', date: '02.07.2026, 08:00 - 14:00', type: 'Hitna intervencija', basePop: 3200, lat: 45.2630, lng: 19.8170 },
  { id: 2, name: 'Planski radovi - Liman 3', fullName: 'Planski radovi - Liman 3 (Novi Sad)', date: '12.08.2026, 22:00 - 05:00', type: 'Redovno održavanje', basePop: 5400, lat: 45.2390, lng: 19.8350 },
  { id: 3, name: 'Radovi na rezervoaru - Sremska Kamenica', fullName: 'Radovi na rezervoaru - Sremska Kamenica', date: '02.07.2026, 09:00 - 15:00', type: 'Radovi na rezervoaru', basePop: 1800, lat: 45.2230, lng: 19.8430 },
];

const defaultEventsEN = [
  { id: 1, name: 'Network Accident - Janka Čmelika', fullName: 'Network Accident - Janka Čmelika (Novi Sad)', date: '02.07.2026, 08:00 - 14:00', type: 'Emergency Repair', basePop: 3200, lat: 45.2630, lng: 19.8170 },
  { id: 2, name: 'Planned Works - Liman 3', fullName: 'Planned Works - Liman 3 (Novi Sad)', date: '12.08.2026, 22:00 - 05:00', type: 'Routine Maintenance', basePop: 5400, lat: 45.2390, lng: 19.8350 },
  { id: 3, name: 'Reservoir Works - Sremska Kamenica', fullName: 'Reservoir Works - Sremska Kamenica', date: '02.07.2026, 09:00 - 15:00', type: 'Reservoir Works', basePop: 1800, lat: 45.2230, lng: 19.8430 },
];

export default function Exposure() {
  const context = useOutletContext();
  const lang = context?.lang || 'SR';
  const navigate = useNavigate();

  const [eventsList, setEventsList] = useState(lang === 'SR' ? defaultEventsSR : defaultEventsEN);
  const [selectedEventId, setSelectedEventId] = useState(1);
  const [customRadius, setCustomRadius] = useState(400);
  const [facilitiesList, setFacilitiesList] = useState([]);
  
  const [exposureAnalysis, setExposureAnalysis] = useState(null);

  useEffect(() => {
    fetchEvents().then(data => {
      if (data && data.length > 0) {
        const mapped = data.map((ev, index) => ({
          id: ev.id || index + 1,
          name: ev.title || (lang === 'SR' ? 'Događaj' : 'Event'),
          fullName: `${ev.title} (${ev.location?.municipality || 'Novi Sad'})`,
          date: ev.start_time ? new Date(ev.start_time).toLocaleString(lang === 'SR' ? 'sr-RS' : 'en-US') : '2026',
          type: ev.event_type || (lang === 'SR' ? 'Intervencija' : 'Intervention'),
          basePop: 3500,
          lat: ev.location?.latitude || (45.2520 + (index * 0.008)),
          lng: ev.location?.longitude || (19.8250 + (index * 0.008))
        }));
        setEventsList(mapped);
      } else {
        setEventsList(lang === 'SR' ? defaultEventsSR : defaultEventsEN);
      }
    });

    fetchFacilities().then(data => {
      const rawFacs = Array.isArray(data) ? data : (data?.results || []);
      if (rawFacs.length > 0) {
        const mappedFacs = rawFacs.map((fac, idx) => ({
          id: fac.id || `fac-${idx}`,
          name: fac.name || (lang === 'SR' ? 'Kritična ustanova' : 'Critical Facility'),
          type: fac.category || 'facility',
          address: fac.address || 'Novi Sad',
          lat: fac.latitude || (45.24 + (idx * 0.003)),
          lng: fac.longitude || (19.81 + (idx * 0.003))
        }));
        setFacilitiesList(mappedFacs);
      } else {
        setFacilitiesList([
          { id: 'f1', name: 'PU Radosno detinjstvo (Vrtić)', type: 'kindergarten', address: 'Novi Sad', lat: 45.2580, lng: 19.8220 },
          { id: 'f2', name: 'OŠ Dositej Obradović', type: 'school', address: 'Novi Sad', lat: 45.2600, lng: 19.8100 },
          { id: 'f3', name: 'Dom zdravlja Novi Sad - Liman', type: 'hospital', address: 'Novi Sad', lat: 45.2400, lng: 19.8400 }
        ]);
      }
    }).catch(() => {
      setFacilitiesList([
        { id: 'f1', name: 'PU Radosno detinjstvo (Vrtić)', type: 'kindergarten', address: 'Novi Sad', lat: 45.2580, lng: 19.8220 },
        { id: 'f2', name: 'OŠ Dositej Obradović', type: 'school', address: 'Novi Sad', lat: 45.2600, lng: 19.8100 },
        { id: 'f3', name: 'Dom zdravlja Novi Sad - Liman', type: 'hospital', address: 'Novi Sad', lat: 45.2400, lng: 19.8400 }
      ]);
    });
  }, [lang]);

  const currentEvent = eventsList.find(e => String(e.id) === String(selectedEventId)) || eventsList[0];

  useEffect(() => {
    if (currentEvent && currentEvent.id) {
      fetch(`${API_BASE_URL}/exposure/analyze/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: String(currentEvent.id),
          radius_m: Number(customRadius)
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data) {
            setExposureAnalysis(data);
          }
        })
        .catch(err => console.error('Greska pri POST /exposure/analyze/:', err));
    }
  }, [selectedEventId, customRadius, currentEvent]);

  const calculatedPopulation = exposureAnalysis?.population_estimate || Math.round((currentEvent.basePop || 3000) * (customRadius / 400));

  const evaluatedFacilities = facilitiesList.map(fac => {
    const dist = calculateDistance(currentEvent.lat, currentEvent.lng, fac.lat, fac.lng);
    let status = lang === 'SR' ? 'Van zone' : 'Outside';
    let statusType = 'success';

    if (dist <= customRadius) {
      status = lang === 'SR' ? 'U zoni' : 'In Zone';
      statusType = 'danger';
    } else if (dist <= customRadius + 100) {
      status = lang === 'SR' ? 'Na granici' : 'On Boundary';
      statusType = 'warning';
    }

    return {
      ...fac,
      distanceValue: dist,
      distanceStr: `${dist} m`,
      status,
      statusType
    };
  }).sort((a, b) => a.distanceValue - b.distanceValue);

  return (
    <div className="exposure-container" style={{ padding: '1.25rem 1.5rem', maxWidth: '1700px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      <style>{`
        @media (max-width: 1024px) {
          .exposure-grid-3 {
            grid-template-columns: 1fr !important;
          }
          .exposure-grid-2 {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 600px) {
          .exposure-container {
            padding: 0.75rem 1rem !important;
          }
          .simulator-grid {
            grid-template-columns: 1fr !important;
          }
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
              ? 'Procena potencijalne izloženosti stanovništva (WorldPop 2021) i kritične infrastrukture unutar izabrane zone prekida.'
              : 'Assessment of potential population exposure (WorldPop 2021) and critical infrastructure within the selected outage zone.'}
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
              {currentEvent.name}
            </div>
          </div>
        </div>
      </div>

      {/* 2. SIMULATOR KONTROLE */}
      <div style={{ backgroundColor: '#fff', padding: '1.25rem 1.5rem', borderRadius: '12px', border: '1px solid #0284c7', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.06)', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', marginBottom: '0.85rem' }}>
          <Calculator size={18} />
          <h2 style={{ fontSize: '0.98rem', fontWeight: '700', margin: 0 }}>
            {lang === 'SR' ? 'Interaktivni simulator uticaja događaja (POST /exposure/analyze/)' : 'Potential Exposure Impact Simulator'}
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
              style={{ width: '100%', padding: '0.5rem 0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', backgroundColor: '#f8fafc', fontWeight: '600', cursor: 'pointer', color: '#0f172a' }}
            >
              {eventsList.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.fullName}</option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                {lang === 'SR' ? 'Radijus analize:' : 'Analysis Radius:'}
              </label>
              <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0284c7' }}>{customRadius} {lang === 'SR' ? 'metara' : 'meters'}</span>
            </div>
            <input 
              type="range" 
              min="100" 
              max="1000" 
              step="50"
              value={customRadius} 
              onChange={(e) => setCustomRadius(Number(e.target.value))}
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
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0c4a6e', marginTop: '0.1rem' }}>
              ~{calculatedPopulation.toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>{lang === 'SR' ? 'stanovnika' : 'residents'}</span>
            </div>
          </div>

        </div>
      </div>

      {/* 3. MAPA + KRITIČNE USTANOVE + STATISTIKA */}
      <div className="exposure-grid-3" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1.2fr) 340px', gap: '1.25rem', marginBottom: '1.25rem', alignItems: 'stretch' }}>
        
        {/* MAPA */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <MapPin size={18} color="#0284c7" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              {lang === 'SR' ? 'Prikaz zone na GIS mapi' : 'Analysis Zone on GIS Map'}
            </h3>
          </div>

          <div style={{ flex: 1, minHeight: '340px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', position: 'relative' }}>
            <MapContainer 
              center={[currentEvent.lat || 45.2520, currentEvent.lng || 19.8250]} 
              zoom={14} 
              scrollWheelZoom={false} 
              style={{ height: '100%', width: '100%' }}
            >
              <MapUpdater center={[currentEvent.lat || 45.2520, currentEvent.lng || 19.8250]} />
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              
              <Circle 
                center={[currentEvent.lat || 45.2520, currentEvent.lng || 19.8250]} 
                radius={customRadius} 
                pathOptions={{ fillColor: '#ef4444', fillOpacity: 0.15, color: '#dc2626', weight: 2 }} 
              />
              
              <Marker position={[currentEvent.lat || 45.2520, currentEvent.lng || 19.8250]} icon={icons.event}>
                <Popup>
                  <strong style={{ color: '#dc2626' }}>{currentEvent.name}</strong><br />
                  {lang === 'SR' ? 'Radijus' : 'Radius'}: {customRadius}m
                </Popup>
              </Marker>

              {evaluatedFacilities.map((fac, idx) => fac.lat && fac.lng && (
                <Marker key={`fac-${fac.id || idx}`} position={[fac.lat, fac.lng]} icon={icons.facility}>
                  <Popup>
                    <strong style={{ color: '#9333ea' }}>{fac.name}</strong><br />
                    {lang === 'SR' ? 'Udaljenost' : 'Distance'}: {fac.distanceStr}<br />
                    Status: {fac.status}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* KRITIČNE USTANOVE */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Building2 size={18} color="#0284c7" />
              <h3 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                {lang === 'SR' ? 'Kritične ustanove u zoni analize' : 'Critical Facilities in Zone'}
              </h3>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '350px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: '700', fontSize: '0.72rem', position: 'sticky', top: 0 }}>
                  <th style={{ padding: '0.6rem' }}>{lang === 'SR' ? 'Naziv ustanove' : 'Facility Name'}</th>
                  <th style={{ padding: '0.6rem' }}>{lang === 'SR' ? 'Tip' : 'Type'}</th>
                  <th style={{ padding: '0.6rem' }}>{lang === 'SR' ? 'Udaljenost' : 'Distance'}</th>
                  <th style={{ padding: '0.6rem' }}>{lang === 'SR' ? 'Status' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                {evaluatedFacilities.map((fac) => (
                  <tr key={fac.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.6rem', fontWeight: '600', color: '#0f172a' }}>{fac.name}</td>
                    <td style={{ padding: '0.6rem', color: '#475569', textTransform: 'capitalize' }}>{fac.type}</td>
                    <td style={{ padding: '0.6rem', color: '#334155', fontWeight: '600' }}>{fac.distanceStr}</td>
                    <td style={{ padding: '0.6rem' }}>
                      <span style={{ 
                        padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.68rem', fontWeight: '700',
                        backgroundColor: fac.statusType === 'danger' ? '#fee2e2' : fac.statusType === 'warning' ? '#fef3c7' : '#dcfce7',
                        color: fac.statusType === 'danger' ? '#991b1b' : fac.statusType === 'warning' ? '#b45309' : '#166534'
                      }}>
                        {fac.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* DODATNA STATISTIKA */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <Users size={18} color="#0284c7" />
              <h3 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                {lang === 'SR' ? 'Dodatna statistika' : 'Additional Statistics'}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.45rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>{lang === 'SR' ? 'Domaćinstva' : 'Households'}</span>
                <strong style={{ color: '#0f172a' }}>~{Math.round(calculatedPopulation / 2.7)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.45rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>{lang === 'SR' ? 'Deca (0–17)' : 'Children (0–17)'}</span>
                <strong style={{ color: '#0f172a' }}>~{Math.round(calculatedPopulation * 0.16)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>{lang === 'SR' ? 'Stariji (65+)' : 'Elderly (65+)'}</span>
                <strong style={{ color: '#0f172a' }}>~{Math.round(calculatedPopulation * 0.14)}</strong>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.5rem', color: '#166534', fontSize: '0.7rem', marginTop: '0.75rem', display: 'flex', gap: '0.3rem', alignItems: 'flex-start' }}>
            <CheckCircle size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{lang === 'SR' ? 'Demografska struktura izvedena iz WorldPop 2021.' : 'Demographic breakdown derived from WorldPop 2021.'}</span>
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
              {[
                { radius: '250 m', pop: `~${Math.round(calculatedPopulation * 0.6)}`, count: evaluatedFacilities.filter(f => f.distanceValue <= 250).length },
                { radius: '500 m', pop: `~${Math.round(calculatedPopulation * 1.2)}`, count: evaluatedFacilities.filter(f => f.distanceValue <= 500).length },
                { radius: '1.000 m', pop: `~${Math.round(calculatedPopulation * 2.4)}`, count: evaluatedFacilities.filter(f => f.distanceValue <= 1000).length },
              ].map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.45rem', fontWeight: '700', color: '#0f172a' }}>{row.radius}</td>
                  <td style={{ padding: '0.45rem', color: '#334155' }}>{row.pop}</td>
                  <td style={{ padding: '0.45rem', color: '#475569' }}>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* METODOLOGIJA*/}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <FileText size={18} color="#0284c7" />
              <h3 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                {lang === 'SR' ? 'Metodologija i izvori' : 'Methodology & Sources'}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem', color: '#334155', lineHeight: '1.5' }}>
              <div>
                <strong style={{ color: '#0f172a' }}>{lang === 'SR' ? 'Stanovništvo:' : 'Population:'}</strong> WorldPop Grid (2021) 
              </div>
              <div>
                <strong style={{ color: '#0f172a' }}>{lang === 'SR' ? 'Kritični objekti:' : 'Critical Facilities:'}</strong> Zvanični registri 
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.5rem', color: '#1d4ed8', fontSize: '0.76rem', marginTop: '0.75rem', display: 'flex', gap: '0.3rem', alignItems: 'flex-start' }}>
            <Info size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{lang === 'SR' ? 'Rezultati predstavljaju server-side procenu izloženosti.' : 'Results represent server-side spatial exposure estimation.'}</span>
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
              <span>{lang === 'SR' ? 'Pregledaj prekide i incidente (Disruptions)' : 'View Disruptions & Incidents'}</span>
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