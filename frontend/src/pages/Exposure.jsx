
import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
  Calculator, MapPin, Building2, Users, AlertTriangle, 
  FileText, Download, ShieldAlert, ExternalLink, CheckCircle, Info, ChevronDown 
} from 'lucide-react';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const eventsListSR = [
  { id: 1, name: 'Kvar na mreži - Janka Čmelika', fullName: 'Kvar na mreži - Janka Čmelika (Novi Sad)', date: '02.07.2026, 08:00 - 14:00', type: 'Hitna intervencija', basePop: 3200, lat: 45.2630, lng: 19.8170 },
  { id: 2, name: 'Planski radovi - Liman 3', fullName: 'Planski radovi - Liman 3 (Novi Sad)', date: '12.08.2026, 22:00 - 05:00', type: 'Redovno održavanje', basePop: 5400, lat: 45.2390, lng: 19.8350 },
  { id: 3, name: 'Radovi na rezervoaru - Sremska Kamenica', fullName: 'Radovi na rezervoaru - Sremska Kamenica', date: '02.07.2026, 09:00 - 15:00', type: 'Radovi na rezervoaru', basePop: 1800, lat: 45.2230, lng: 19.8430 },
];

const eventsListEN = [
  { id: 1, name: 'Network Accident - Janka Čmelika', fullName: 'Network Accident - Janka Čmelika (Novi Sad)', date: '02.07.2026, 08:00 - 14:00', type: 'Emergency Repair', basePop: 3200, lat: 45.2630, lng: 19.8170 },
  { id: 2, name: 'Planned Works - Liman 3', fullName: 'Planned Works - Liman 3 (Novi Sad)', date: '12.08.2026, 22:00 - 05:00', type: 'Routine Maintenance', basePop: 5400, lat: 45.2390, lng: 19.8350 },
  { id: 3, name: 'Reservoir Works - Sremska Kamenica', fullName: 'Reservoir Works - Sremska Kamenica', date: '02.07.2026, 09:00 - 15:00', type: 'Reservoir Works', basePop: 1800, lat: 45.2230, lng: 19.8430 },
];

const facilitiesInZoneSR = [
  { id: 1, name: 'PU Radosno detinjstvo (Vrtić)', type: 'Predškolska ustanova', distance: '320 m', status: 'U zoni', statusType: 'danger' },
  { id: 2, name: 'OŠ Dositej Obradović', type: 'Osnovna škola', distance: '380 m', status: 'U zoni', statusType: 'danger' },
  { id: 3, name: 'Dom zdravlja Novi Sad - Liman', type: 'Zdravstvena ustanova', distance: '480 m', status: 'Na granici', statusType: 'warning' },
  { id: 4, name: 'OŠ „Jovan Jovanović Zmaj”', type: 'Osnovna škola', distance: '620 m', status: 'Van zone', statusType: 'success' },
  { id: 5, name: 'Centar za socijalni rad Novi Sad', type: 'Socijalna zaštita', distance: '740 m', status: 'Van zone', statusType: 'success' },
];

const facilitiesInZoneEN = [
  { id: 1, name: 'PU Radosno detinjstvo (Kindergarten)', type: 'Kindergarten', distance: '320 m', status: 'In Zone', statusType: 'danger' },
  { id: 2, name: 'OŠ Dositej Obradović', type: 'Primary School', distance: '380 m', status: 'In Zone', statusType: 'danger' },
  { id: 3, name: 'Dom zdravlja Novi Sad - Liman', type: 'Healthcare Facility', distance: '480 m', status: 'On Boundary', statusType: 'warning' },
  { id: 4, name: 'OŠ „Jovan Jovanović Zmaj”', type: 'Primary School', distance: '620 m', status: 'Outside', statusType: 'success' },
  { id: 5, name: 'Center for Social Work Novi Sad', type: 'Social Care', distance: '740 m', status: 'Outside', statusType: 'success' },
];

const radiusComparisonSR = [
  { radius: '250 m', pop: '~1.100', kindergartens: 1, schools: 1, health: 0, social: 0 },
  { radius: '400 m', pop: '~3.200', kindergartens: 1, schools: 1, health: 1, social: 0 },
  { radius: '800 m', pop: '~8.500', kindergartens: 2, schools: 3, health: 2, social: 1 },
];

const radiusComparisonEN = [
  { radius: '250 m', pop: '~1,100', kindergartens: 1, schools: 1, health: 0, social: 0 },
  { radius: '400 m', pop: '~3,200', kindergartens: 1, schools: 1, health: 1, social: 0 },
  { radius: '800 m', pop: '~8,500', kindergartens: 2, schools: 3, health: 2, social: 1 },
];

export default function Exposure() {
  const context = useOutletContext();
  const lang = context?.lang || 'SR';
  const navigate = useNavigate();

  const [selectedEventId, setSelectedEventId] = useState(1);
  const [customRadius, setCustomRadius] = useState(400);

  const eventsList = lang === 'SR' ? eventsListSR : eventsListEN;
  const facilitiesInZone = lang === 'SR' ? facilitiesInZoneSR : facilitiesInZoneEN;
  const radiusComparison = lang === 'SR' ? radiusComparisonSR : radiusComparisonEN;

  const currentEvent = eventsList.find(e => e.id === Number(selectedEventId)) || eventsList[0];
  const calculatedPopulation = Math.round(currentEvent.basePop * (customRadius / 400));

  const handleDownloadPDF = () => {
    alert(lang === 'SR' ? 'Generisanje PDF izveštaja o izloženosti...' : 'Generating exposure PDF report...');
  };

  return (
    <div style={{ padding: '1.25rem 1.5rem', maxWidth: '1700px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      {}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            {lang === 'SR' ? 'Prostorna analiza izloženosti' : 'Spatial Exposure Analysis'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.2rem 0 0 0' }}>
            {lang === 'SR' 
              ? 'Procena potencijalne izloženosti stanovništva i kritične infrastrukture unutar izabrane zone prekida.'
              : 'Assessment of potential population exposure and critical infrastructure within the selected outage zone.'}
          </p>
        </div>

        {}
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
            <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span>{currentEvent.date} | <span style={{ color: '#0284c7', fontWeight: '600' }}>{currentEvent.type}</span></span>
              <span style={{ color: '#0284c7', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                {lang === 'SR' ? 'Promeni događaj' : 'Change event'} <ChevronDown size={11} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {}
      <div style={{ backgroundColor: '#fff', padding: '1.25rem 1.5rem', borderRadius: '12px', border: '1px solid #0284c7', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.06)', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', marginBottom: '0.85rem' }}>
          <Calculator size={18} />
          <h2 style={{ fontSize: '0.98rem', fontWeight: '700', margin: 0 }}>
            {lang === 'SR' ? 'Interaktivni simulator uticaja događaja' : 'Potential Exposure Impact Simulator'}
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1.2fr) minmax(280px, 1.4fr) minmax(240px, 1fr)', gap: '1.25rem', alignItems: 'center' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
              {lang === 'SR' ? 'Izaberite događaj / lokaciju prekida:' : 'Select Event / Outage Location:'}
            </label>
            <select 
              value={selectedEventId} 
              onChange={(e) => setSelectedEventId(Number(e.target.value))}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.15rem' }}>
              <span>100 m</span>
              <span>250 m</span>
              <span>500 m</span>
              <span>750 m</span>
              <span>1.000 m</span>
            </div>
          </div>

          <div style={{ backgroundColor: '#f0f9ff', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #bae6fd' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#0369a1', fontWeight: '700', textTransform: 'uppercase' }}>
                {lang === 'SR' ? 'Stanovništvo u zoni analize' : 'Population in Analysis Zone'}
              </span>
              <Users size={15} color="#0284c7" />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0c4a6e', marginTop: '0.1rem' }}>
              ~{calculatedPopulation.toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>{lang === 'SR' ? 'stanovnika' : 'residents'}</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#0284c7', marginTop: '0.05rem' }}>
              {lang === 'SR' ? 'Procena na osnovu Popisa / WorldPop (2021)' : 'Estimate based on Population Grid (2021)'}
            </div>
          </div>

        </div>
      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1.2fr) 340px', gap: '1.25rem', marginBottom: '1.25rem', alignItems: 'stretch' }}>
        
        {}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <MapPin size={18} color="#0284c7" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              {lang === 'SR' ? 'Prikaz zone na GIS mapi' : 'Analysis Zone on GIS Map'}
            </h3>
          </div>

          <div style={{ flex: 1, minHeight: '340px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', position: 'relative' }}>
            <MapContainer 
              center={[currentEvent.lat, currentEvent.lng]} 
              zoom={14} 
              scrollWheelZoom={false} 
              style={{ height: '100%', width: '100%' }}
              key={currentEvent.id}
            >
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              
              <Circle 
                center={[currentEvent.lat, currentEvent.lng]} 
                radius={customRadius} 
                pathOptions={{ fillColor: '#ef4444', fillOpacity: 0.15, color: '#dc2626', weight: 2 }} 
              />
              <Circle 
                center={[currentEvent.lat, currentEvent.lng]} 
                radius={800} 
                pathOptions={{ fillColor: '#f97316', fillOpacity: 0.05, color: '#f97316', weight: 1, dashArray: '4,4' }} 
              />

              <Marker position={[currentEvent.lat, currentEvent.lng]}>
                <Popup>
                  <strong>{currentEvent.name}</strong><br />
                  {lang === 'SR' ? 'Radijus' : 'Radius'}: {customRadius}m
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>

        {}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Building2 size={18} color="#0284c7" />
              <h3 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                {lang === 'SR' ? 'Kritične ustanove u zoni analize' : 'Critical Facilities in Zone'}
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', backgroundColor: '#f1f5f9', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
              {lang === 'SR' ? 'Ukupno: 5' : 'Total: 5'}
            </span>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: '700', fontSize: '0.72rem' }}>
                  <th style={{ padding: '0.6rem' }}>{lang === 'SR' ? 'Naziv ustanove' : 'Facility Name'}</th>
                  <th style={{ padding: '0.6rem' }}>{lang === 'SR' ? 'Tip' : 'Type'}</th>
                  <th style={{ padding: '0.6rem' }}>{lang === 'SR' ? 'Udaljenost' : 'Distance'}</th>
                  <th style={{ padding: '0.6rem' }}>{lang === 'SR' ? 'Status' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                {facilitiesInZone.map((fac) => (
                  <tr key={fac.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.6rem', fontWeight: '600', color: '#0f172a' }}>{fac.name}</td>
                    <td style={{ padding: '0.6rem', color: '#475569' }}>{fac.type}</td>
                    <td style={{ padding: '0.6rem', color: '#334155', fontWeight: '600' }}>{fac.distance}</td>
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

        {}
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
                <span style={{ color: '#64748b' }}>{lang === 'SR' ? 'Domaćinstva (procena)' : 'Households (estimated)'}</span>
                <strong style={{ color: '#0f172a' }}>~1.200</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.45rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>{lang === 'SR' ? 'Deca (0–17 godina)' : 'Children (0–17 years)'}</span>
                <strong style={{ color: '#0f172a' }}>~520</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>{lang === 'SR' ? 'Stariji (65+ godina)' : 'Elderly (65+ years)'}</span>
                <strong style={{ color: '#0f172a' }}>~450</strong>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.5rem', color: '#166534', fontSize: '0.7rem', marginTop: '0.75rem', display: 'flex', gap: '0.3rem', alignItems: 'flex-start' }}>
            <CheckCircle size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              {lang === 'SR' ? 'Demografska struktura izvedena iz prostorne distribucije popisa.' : 'Demographic breakdown derived from high-resolution spatial census distributions.'}
            </span>
          </div>
        </div>

      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', alignItems: 'stretch' }}>
        
        {/* 1. RADIUS COMPARISON */}
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
                <th style={{ padding: '0.45rem' }}>{lang === 'SR' ? 'Vrtići' : 'Kinderg.'}</th>
                <th style={{ padding: '0.45rem' }}>{lang === 'SR' ? 'Škole' : 'Schools'}</th>
                <th style={{ padding: '0.45rem' }}>{lang === 'SR' ? 'Zdravlje' : 'Health'}</th>
              </tr>
            </thead>
            <tbody>
              {radiusComparison.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.45rem', fontWeight: '700', color: '#0f172a' }}>{row.radius}</td>
                  <td style={{ padding: '0.45rem', color: '#334155' }}>{row.pop}</td>
                  <td style={{ padding: '0.45rem', color: '#475569' }}>{row.kindergartens}</td>
                  <td style={{ padding: '0.45rem', color: '#475569' }}>{row.schools}</td>
                  <td style={{ padding: '0.45rem', color: '#475569' }}>{row.health}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <FileText size={18} color="#0284c7" />
              <h3 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                {lang === 'SR' ? 'Metodologija i izvori' : 'Methodology & Sources'}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.75rem', color: '#475569', lineHeight: '1.4' }}>
              <div>
                <strong style={{ color: '#0f172a' }}>{lang === 'SR' ? 'Stanovništvo:' : 'Population:'}</strong><br />
                WorldPop Population Grid (2021) <ExternalLink size={10} style={{ display: 'inline', color: '#0284c7' }} />
              </div>
              <div>
                <strong style={{ color: '#0f172a' }}>{lang === 'SR' ? 'Kritični objekti:' : 'Critical Facilities:'}</strong><br />
                {lang === 'SR' ? 'Zvanični registri i javni podaci' : 'Official registers & public data'}
              </div>
              <div>
                <strong style={{ color: '#0f172a' }}>{lang === 'SR' ? 'Prostorna analiza:' : 'Spatial Analysis:'}</strong><br />
                {lang === 'SR' ? 'Zona uticaja oko lokacije događaja' : 'Buffer zone around event location'}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.5rem', color: '#1d4ed8', fontSize: '0.7rem', marginTop: '0.75rem', display: 'flex', gap: '0.3rem', alignItems: 'flex-start' }}>
            <Info size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              {lang === 'SR' ? 'Rezultati predstavljaju potencijalnu izloženost i ne potvrđuju stvarni prekid.' : 'Results represent potential spatial exposure and do not confirm an actual outage.'}
            </span>
          </div>
        </div>

        {}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <Building2 size={18} color="#0284c7" />
              <h3 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                {lang === 'SR' ? 'Dalje akcije' : 'Further Actions'}
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', justifyContent: 'center', flex: 1 }}>
            <button 
              onClick={() => navigate('/map')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.45rem 0.65rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', justifyContent: 'center', width: '100%' }}
            >
              <MapPin size={13} />
              <span>{lang === 'SR' ? 'Prikaži zonu na GIS mapi' : 'Show zone on GIS map'}</span>
            </button>

            <button 
              onClick={() => navigate('/disruptions')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '0.45rem 0.65rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', justifyContent: 'center', width: '100%' }}
            >
              <AlertTriangle size={13} />
              <span>{lang === 'SR' ? 'Analiziraj ranjivost' : 'Analyze vulnerability'}</span>
            </button>

            <button 
              onClick={handleDownloadPDF}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#fff', color: '#475569', border: '1px solid #cbd5e1', padding: '0.45rem 0.65rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', justifyContent: 'center', width: '100%' }}
            >
              <Download size={13} />
              <span>{lang === 'SR' ? 'Preuzmi rezultate (PDF)' : 'Download results (PDF)'}</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}