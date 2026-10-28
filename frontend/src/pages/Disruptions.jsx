// src/pages/Disruptions.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
  FileText, Clock, Wrench, CheckCircle, Search, 
  MapPin, Calendar, RotateCcw, ChevronRight, X, 
  ExternalLink, Share2, ShieldCheck, AlertTriangle 
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Dvojezični podaci prilagođeni oktobru 2026.
const getInitialEvents = (lang) => [
  { 
    id: 1, 
    title: lang === 'SR' ? 'Prekid vodosnabdevanja' : 'Water Supply Interruption', 
    location: 'Janka Čmelika', 
    fullAddress: 'Janka Čmelika, Novi Sad',
    lat: 45.2630, 
    lng: 19.8170, 
    date: '24.10.2026.', 
    time: '08:00 - 14:00', 
    duration: lang === 'SR' ? '6 sati' : '6 hours',
    status: lang === 'SR' ? 'Završen' : 'Completed', 
    type: lang === 'SR' ? 'Planirani radovi' : 'Planned works', 
    source: 'JKP Vodovod',
    sourcePublish: '23.10.2026, 12:30',
    verification: lang === 'SR' ? 'Potvrđeno javnim izvorom' : 'Confirmed by public source',
    description: lang === 'SR' ? 'Redovni radovi na distributivnoj mreži u ulici Janka Čmelika.' : 'Regular maintenance on the distribution network in Janka Čmelika street.',
    note: lang === 'SR' ? 'Radovi su završeni u planiranom terminu.' : 'Works completed on schedule.'
  },
  { 
    id: 2, 
    title: lang === 'SR' ? 'Havarija na mreži' : 'Network Accident', 
    location: 'Bulevar kneza Miloša', 
    fullAddress: 'Bulevar kneza Miloša, Novi Sad',
    lat: 45.2530, 
    lng: 19.7980, 
    date: '26.10.2026.', 
    time: '11:30 - 18:00', 
    duration: lang === 'SR' ? '6.5 sati' : '6.5 hours',
    status: lang === 'SR' ? 'Završen' : 'Completed', 
    type: lang === 'SR' ? 'Hitna intervencija' : 'Emergency repair', 
    source: 'JKP Vodovod',
    sourcePublish: '26.10.2026, 09:15',
    verification: lang === 'SR' ? 'Potvrđeno javnim izvorom' : 'Confirmed by public source',
    description: lang === 'SR' ? 'Sanacija havarije na magistralnom cevovodu.' : 'Repair of a burst main pipeline.',
    note: lang === 'SR' ? 'Havarija uspešno sanirana.' : 'Accident successfully repaired.'
  },
  { 
    id: 3, 
    title: lang === 'SR' ? 'Prekid vodosnabdevanja' : 'Water Supply Interruption', 
    location: 'Sremska Kamenica', 
    fullAddress: 'Sremska Kamenica, Novi Sad',
    lat: 45.2230, 
    lng: 19.8430, 
    date: '25.10.2026.', 
    time: '09:00 - 15:00', 
    duration: lang === 'SR' ? '6 sati' : '6 hours',
    status: lang === 'SR' ? 'Završen' : 'Completed', 
    type: lang === 'SR' ? 'Radovi na rezervoaru' : 'Reservoir works', 
    source: 'JKP Vodovod',
    sourcePublish: '24.10.2026, 14:10',
    verification: lang === 'SR' ? 'Potvrđeno javnim izvorom' : 'Confirmed by public source',
    description: lang === 'SR' ? 'Ispiranje i dezinfekcija rezervoara Sremska Kamenica.' : 'Flushing and disinfection of Sremska Kamenica reservoir.',
    note: lang === 'SR' ? 'Svi parametri vode u granicama normale.' : 'All water parameters within normal limits.'
  },
  { 
    id: 4, 
    title: lang === 'SR' ? 'Ispiranje vodovodne mreže' : 'Water Network Flushing', 
    location: 'Liman 3', 
    fullAddress: 'MZ Liman 3, Novi Sad',
    lat: 45.2390, 
    lng: 19.8350, 
    date: '28.10.2026.', 
    time: '22:00 - 05:00', 
    duration: lang === 'SR' ? '7 sati' : '7 hours',
    status: lang === 'SR' ? 'Planirano' : 'Planned', 
    type: lang === 'SR' ? 'Redovno održavanje' : 'Routine maintenance', 
    source: 'JKP Vodovod',
    sourcePublish: '27.10.2026, 14:45',
    verification: lang === 'SR' ? 'Najavljeno javnim saopštenjem' : 'Announced via public notice',
    description: lang === 'SR' ? 'Redovno noćno ispiranje mreže na teritoriji MZ Liman 3.' : 'Regular night network flushing in MZ Liman 3.',
    note: lang === 'SR' ? 'Moguć blagi pad pritiska tokom noći.' : 'Possible slight pressure drop during the night.'
  }
];

export default function Disruptions() {
  const context = useOutletContext();
  const lang = context?.lang || 'SR';
  const t = context?.t || {};
  const navigate = useNavigate();

  const [events, setEvents] = useState(getInitialEvents(lang));
  const [selectedEvent, setSelectedEvent] = useState(events[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('Svi tipovi');
  const [statusFilter, setStatusFilter] = useState('Svi statusi');
  const [customDate, setCustomDate] = useState('');
  const dateInputRef = useRef(null);

  useEffect(() => {
    const updatedEvents = getInitialEvents(lang);
    setEvents(updatedEvents);
    setSelectedEvent(updatedEvents[0]);
  }, [lang]);

  const handleCardClick = (filterValue) => {
    if (statusFilter === filterValue) {
      setStatusFilter(lang === 'SR' ? 'Svi statusi' : 'All statuses');
    } else {
      setStatusFilter(filterValue);
    }
  };

  const filteredEvents = (events || []).filter(event => {
    const loc = String(event?.location || '').toLowerCase();
    const title = String(event?.title || '').toLowerCase();
    const type = String(event?.type || '').toLowerCase();
    const search = String(searchTerm || '').toLowerCase();

    const matchesSearch = loc.includes(search) || title.includes(search) || type.includes(search);
    
    const isAllStatus = statusFilter === 'Svi statusi' || statusFilter === 'All statuses';
    const matchesStatus = isAllStatus || event?.status === statusFilter;
    
    const isAllType = typeFilter === 'Svi tipovi' || typeFilter === 'All types';
    const matchesType = isAllType || event?.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter(lang === 'SR' ? 'Svi tipovi' : 'All types');
    setStatusFilter(lang === 'SR' ? 'Svi statusi' : 'All statuses');
    setCustomDate('');
  };

  const copyLocation = (text) => {
    navigator.clipboard.writeText(text);
    alert(lang === 'SR' ? 'Lokacija kopirana u klipbord!' : 'Location copied to clipboard!');
  };

  const plannedLabel = lang === 'SR' ? 'Planirano' : 'Planned';
  const ongoingLabel = lang === 'SR' ? 'U toku' : 'Ongoing';
  const completedLabel = lang === 'SR' ? 'Završen' : 'Completed';

  return (
    <div style={{ padding: '1.25rem 1.5rem', maxWidth: '1750px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      {/* 1. ZAGLAVLJE EKRANA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            {lang === 'SR' ? 'Događaji i Prekidi Vodosnabdevanja' : 'Events & Water Outages'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.2rem 0 0 0' }}>
            {lang === 'SR' 
              ? 'Evidencija planiranih radova, havarija i istorijskih prekida vodosnabdevanja na teritoriji Novog Sada.'
              : 'Records of planned works, accidents, and historical water supply interruptions in Novi Sad.'}
          </p>
        </div>

        {/* Indikator ažurnosti postavljen na aktuelni datum 27. oktobar 2026. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#64748b', backgroundColor: '#fff', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
          <span>{lang === 'SR' ? 'Poslednje ažuriranje:' : 'Last update:'} <strong>{lang === 'SR' ? 'danas, 27. okt 2026, 18:00' : 'today, Oct 27, 2026, 18:00'}</strong></span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span>{lang === 'SR' ? 'Izvor:' : 'Source:'} <strong style={{ color: '#0284c7' }}>JKP Vodovod i kanalizacija <ExternalLink size={12} style={{ display: 'inline' }} /></strong></span>
        </div>
      </div>

      {/* 2. GORNJE 4 KPI KARTICE (KLIKABILNE) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
        
        <div 
          onClick={() => setStatusFilter(lang === 'SR' ? 'Svi statusi' : 'All statuses')}
          style={{ 
            backgroundColor: '#fff', padding: '1rem 1.25rem', borderRadius: '12px', 
            border: (statusFilter === 'Svi statusi' || statusFilter === 'All statuses') ? '2px solid #0284c7' : '1px solid #e2e8f0', 
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)', cursor: 'pointer', transition: 'all 0.15s ease' 
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '700' }}>
              {lang === 'SR' ? 'Ukupno zabeleženo' : 'Total Recorded'}
            </span>
            <FileText size={20} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '0.25rem' }}>
            {events.length}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '0.15rem' }}>
            {lang === 'SR' ? 'u izabranom periodu' : 'in selected period'}
          </div>
        </div>

        <div 
          onClick={() => handleCardClick(plannedLabel)}
          style={{ 
            backgroundColor: '#fff', padding: '1rem 1.25rem', borderRadius: '12px', 
            border: statusFilter === plannedLabel ? '2px solid #0284c7' : '1px solid #e2e8f0', 
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)', cursor: 'pointer', transition: 'all 0.15s ease' 
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '700' }}>
              {lang === 'SR' ? 'Planirane aktivnosti' : 'Planned Activities'}
            </span>
            <Clock size={20} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '0.25rem' }}>
            {events.filter(e => e.status === plannedLabel).length}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '0.15rem' }}>
            {lang === 'SR' ? 'u narednih 7 dana' : 'in next 7 days'}
          </div>
        </div>

        <div 
          onClick={() => handleCardClick(ongoingLabel)}
          style={{ 
            backgroundColor: '#fff', padding: '1rem 1.25rem', borderRadius: '12px', 
            border: statusFilter === ongoingLabel ? '2px solid #0284c7' : '1px solid #e2e8f0', 
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)', cursor: 'pointer', transition: 'all 0.15s ease' 
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '700' }}>
              {lang === 'SR' ? 'U toku' : 'Ongoing'}
            </span>
            <Wrench size={20} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '0.25rem' }}>
            {events.filter(e => e.status === ongoingLabel).length}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '0.15rem' }}>
            {lang === 'SR' ? 'trenutno aktivnih događaja' : 'currently active events'}
          </div>
        </div>

        <div 
          onClick={() => handleCardClick(completedLabel)}
          style={{ 
            backgroundColor: '#fff', padding: '1rem 1.25rem', borderRadius: '12px', 
            border: statusFilter === completedLabel ? '2px solid #0284c7' : '1px solid #e2e8f0', 
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)', cursor: 'pointer', transition: 'all 0.15s ease' 
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '700' }}>
              {lang === 'SR' ? 'Završeni događaji' : 'Completed Events'}
            </span>
            <CheckCircle size={20} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '0.25rem' }}>
            {events.filter(e => e.status === completedLabel).length}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '0.15rem' }}>
            {lang === 'SR' ? 'u izabranom periodu' : 'in selected period'}
          </div>
        </div>

      </div>

      {/* 3. FILTER TRAKA */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        
        <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder={lang === 'SR' ? "Pretraži po lokaciji, nazivu ili tipu događaja..." : "Search by location, title or event type..."} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.6rem 0.55rem 2.4rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', backgroundColor: '#fff' }}
          />
        </div>

        <select 
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ padding: '0.55rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff', cursor: 'pointer', color: '#334155' }}
        >
          <option value={lang === 'SR' ? 'Svi tipovi' : 'All types'}>{lang === 'SR' ? 'Svi tipovi' : 'All types'}</option>
          <option value={lang === 'SR' ? 'Planirani radovi' : 'Planned works'}>{lang === 'SR' ? 'Planirani radovi' : 'Planned works'}</option>
          <option value={lang === 'SR' ? 'Hitna intervencija' : 'Emergency repair'}>{lang === 'SR' ? 'Hitna intervencija' : 'Emergency repair'}</option>
          <option value={lang === 'SR' ? 'Radovi na rezervoaru' : 'Reservoir works'}>{lang === 'SR' ? 'Radovi na rezervoaru' : 'Reservoir works'}</option>
          <option value={lang === 'SR' ? 'Redovno održavanje' : 'Routine maintenance'}>{lang === 'SR' ? 'Redovno održavanje' : 'Routine maintenance'}</option>
        </select>

        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '0.55rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff', cursor: 'pointer', color: '#334155' }}
        >
          <option value={lang === 'SR' ? 'Svi statusi' : 'All statuses'}>{lang === 'SR' ? 'Svi statusi' : 'All statuses'}</option>
          <option value={lang === 'SR' ? 'Završen' : 'Completed'}>{lang === 'SR' ? 'Završen' : 'Completed'}</option>
          <option value={lang === 'SR' ? 'Planirano' : 'Planned'}>{lang === 'SR' ? 'Planirano' : 'Planned'}</option>
          <option value={lang === 'SR' ? 'U toku' : 'Ongoing'}>{lang === 'SR' ? 'U toku' : 'Ongoing'}</option>
        </select>

        <input 
          type="date" 
          ref={dateInputRef} 
          onChange={(e) => setCustomDate(e.target.value)} 
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }} 
        />

        <button 
          onClick={() => dateInputRef.current?.showPicker ? dateInputRef.current.showPicker() : dateInputRef.current?.click()}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: customDate ? '#eff6ff' : '#fff', border: customDate ? '1px solid #0284c7' : '1px solid #cbd5e1', padding: '0.55rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', color: customDate ? '#0284c7' : '#475569', cursor: 'pointer', fontWeight: '500' }}
        >
          <Calendar size={15} color={customDate ? '#0284c7' : '#64748b'} />
          <span>{customDate || (lang === 'SR' ? 'Izaberi period' : 'Select period')}</span>
        </button>

        <button 
          onClick={resetFilters}
          style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'transparent', border: 'none', color: '#0284c7', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', padding: '0.4rem 0.6rem' }}
        >
          <RotateCcw size={14} />
          <span>{lang === 'SR' ? 'Resetuj filtre' : 'Reset filters'}</span>
        </button>

      </div>

      {/* 4. GLAVNI CONTAINER: TABELA + ZNATNO ŠIRI DESNI PANEL (620px) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 620px', gap: '1.25rem', alignItems: 'start' }}>
        
        {/* TABELA */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: '700', fontSize: '0.78rem' }}>
                <th style={{ padding: '0.85rem 1rem' }}>{lang === 'SR' ? 'Događaj' : 'Event'}</th>
                <th style={{ padding: '0.85rem 1rem' }}>{lang === 'SR' ? 'Lokacija' : 'Location'}</th>
                <th style={{ padding: '0.85rem 1rem' }}>{lang === 'SR' ? 'Datum & Vreme' : 'Date & Time'}</th>
                <th style={{ padding: '0.85rem 1rem' }}>{lang === 'SR' ? 'Tip' : 'Type'}</th>
                <th style={{ padding: '0.85rem 1rem' }}>{lang === 'SR' ? 'Status' : 'Status'}</th>
                <th style={{ padding: '0.85rem 1rem' }}>{lang === 'SR' ? 'Izvor' : 'Source'}</th>
                <th style={{ padding: '0.85rem 0.5rem' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => {
                const isSelected = selectedEvent?.id === event.id;
                const isCompleted = event.status === 'Završen' || event.status === 'Completed';
                const isOngoing = event.status === 'U toku' || event.status === 'Ongoing';
                
                return (
                  <tr 
                    key={event.id} 
                    onClick={() => setSelectedEvent(event)}
                    style={{ 
                      borderBottom: '1px solid #f1f5f9', 
                      backgroundColor: isSelected ? '#f0f9ff' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {event.type.includes('Hitna') || event.type.includes('Emergency') ? (
                          <AlertTriangle size={16} color="#dc2626" />
                        ) : event.type.includes('Redovno') || event.type.includes('Routine') ? (
                          <Clock size={16} color="#d97706" />
                        ) : (
                          <Wrench size={16} color="#0284c7" />
                        )}
                        <span>{event.title}</span>
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} color="#64748b" /> {event.location}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '600', color: '#0f172a' }}>{event.date}</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{event.time}</span>
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>{event.type}</td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ 
                        padding: '0.2rem 0.55rem', 
                        borderRadius: '6px', 
                        fontSize: '0.72rem', 
                        fontWeight: '700',
                        backgroundColor: isCompleted ? '#dcfce7' : isOngoing ? '#fee2e2' : '#fef3c7',
                        color: isCompleted ? '#166534' : isOngoing ? '#991b1b' : '#b45309'
                      }}>
                        {event.status}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: '#64748b' }}>
                      <div>{event.source}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{event.sourcePublish}</div>
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                      <ChevronRight size={16} color={isSelected ? '#0284c7' : '#cbd5e1'} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ZNATNO ŠIRI DESNI PANEL (620px) */}
        {selectedEvent && (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={18} color="#0284c7" />
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  {lang === 'SR' ? 'Detalji događaja' : 'Event Details'}
                </h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  {selectedEvent.title}
                </h4>
                <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '0.7rem', fontWeight: '600', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                    {selectedEvent.type}
                  </span>
                  <span style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.7rem', fontWeight: '600', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                    {selectedEvent.verification}
                  </span>
                </div>
              </div>

              <span style={{ backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.72rem', fontWeight: '700', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                {selectedEvent.status}
              </span>
            </div>

            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
              {selectedEvent.description}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.78rem', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <MapPin size={14} color="#64748b" style={{ flexShrink: 0 }} />
                <strong style={{ color: '#475569', minWidth: '95px' }}>{lang === 'SR' ? 'Lokacija' : 'Location'}:</strong>
                <span style={{ color: '#0f172a' }}>{selectedEvent.fullAddress}</span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Calendar size={14} color="#64748b" style={{ flexShrink: 0 }} />
                <strong style={{ color: '#475569', minWidth: '95px' }}>{lang === 'SR' ? 'Datum i vreme' : 'Date & time'}:</strong>
                <span style={{ color: '#0f172a' }}>{selectedEvent.date}, {selectedEvent.time}</span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Clock size={14} color="#64748b" style={{ flexShrink: 0 }} />
                <strong style={{ color: '#475569', minWidth: '95px' }}>{lang === 'SR' ? 'Trajanje' : 'Duration'}:</strong>
                <span style={{ color: '#0f172a' }}>{selectedEvent.duration}</span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <ExternalLink size={14} color="#64748b" style={{ flexShrink: 0 }} />
                <strong style={{ color: '#475569', minWidth: '95px' }}>{lang === 'SR' ? 'Izvor' : 'Source'}:</strong>
                <a href="#" style={{ color: '#0284c7', textDecoration: 'none' }}>{selectedEvent.source} – {lang === 'SR' ? 'saopštenje' : 'notice'} <ExternalLink size={10} style={{ display: 'inline' }} /></a>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Clock size={14} color="#64748b" style={{ flexShrink: 0 }} />
                <strong style={{ color: '#475569', minWidth: '95px' }}>{lang === 'SR' ? 'Objavljeno' : 'Published'}:</strong>
                <span style={{ color: '#64748b' }}>{selectedEvent.sourcePublish}</span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <CheckCircle size={14} color="#16a34a" style={{ flexShrink: 0 }} />
                <strong style={{ color: '#475569', minWidth: '95px' }}>{lang === 'SR' ? 'Status' : 'Status'}:</strong>
                <span style={{ color: '#166534', fontWeight: '700' }}>{selectedEvent.status}</span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginTop: '0.2rem' }}>
                <ShieldCheck size={14} color="#64748b" style={{ flexShrink: 0, marginTop: '2px' }} />
                <strong style={{ color: '#475569', minWidth: '95px' }}>{lang === 'SR' ? 'Napomena' : 'Note'}:</strong>
                <span style={{ color: '#64748b' }}>{selectedEvent.note}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button 
                onClick={() => navigate('/map')}
                style={{ flex: 1, minWidth: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
              >
                <MapPin size={13} />
                <span>{lang === 'SR' ? 'Prikaži na GIS mapi' : 'Show on GIS map'}</span>
              </button>

              <button 
                onClick={() => navigate('/exposure')}
                style={{ flex: 1, minWidth: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '0.5rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
              >
                <FileText size={13} />
                <span>{lang === 'SR' ? 'Analiziraj izloženost' : 'Analyze exposure'}</span>
              </button>

              <button 
                onClick={() => copyLocation(selectedEvent.fullAddress)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', backgroundColor: '#fff', color: '#475569', border: '1px solid #cbd5e1', padding: '0.5rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '600', cursor: 'pointer' }}
              >
                <Share2 size={13} />
                <span>{lang === 'SR' ? 'Kopiraj lokaciju' : 'Copy location'}</span>
              </button>
            </div>

            <div style={{ height: '200px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative' }}>
              <MapContainer 
                center={[selectedEvent.lat, selectedEvent.lng]} 
                zoom={14} 
                scrollWheelZoom={false} 
                style={{ height: '100%', width: '100%' }}
                key={selectedEvent.id}
              >
                <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[selectedEvent.lat, selectedEvent.lng]}>
                  <Popup>
                    <strong>{selectedEvent.location}</strong><br />
                    {selectedEvent.title} ({selectedEvent.date})
                  </Popup>
                </Marker>
              </MapContainer>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}