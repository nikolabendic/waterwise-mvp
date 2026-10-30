import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  FileText, Clock, Wrench, CheckCircle, Search,
  MapPin, Calendar, RotateCcw, ChevronRight, X,
  ExternalLink, Share2, ShieldCheck, AlertTriangle, CalendarClock
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchEvents } from '../services/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, 14, { animate: true });
    }
  }, [center, map]);
  return null;
}

/* ------------------------------------------------------------------ */
/*  Rečnici: ključevi su vrednosti iz API-ja, tekst zavisi od jezika   */
/* ------------------------------------------------------------------ */

const TZ = 'Europe/Belgrade';

const TYPE_LABELS = {
  planned_maintenance: { SR: 'Planirani radovi', EN: 'Planned works' },
  emergency_repair: { SR: 'Hitna intervencija', EN: 'Emergency repair' },
};

const STATUS = {
  planned: { SR: 'Planirano', EN: 'Planned', bg: '#fef3c7', color: '#b45309' },
  ongoing: { SR: 'U toku', EN: 'Ongoing', bg: '#fee2e2', color: '#991b1b' },
  completed: { SR: 'Završen', EN: 'Completed', bg: '#dcfce7', color: '#166534' },
  cancelled: { SR: 'Otkazano', EN: 'Cancelled', bg: '#f1f5f9', color: '#475569' },
  unknown: { SR: 'Raspored nije potvrđen', EN: 'Schedule Not Confirmed', bg: '#f1f5f9', color: '#475569' },
};

const DATA_TYPE_LABELS = {
  reported: { SR: 'Prijavljeno javnim izvorom', EN: 'Reported by public source' },
  observed: { SR: 'Izmereno', EN: 'Observed' },
  estimated: { SR: 'Procena', EN: 'Estimated' },
  synthetic: { SR: 'Sintetički podatak', EN: 'Synthetic data' },
};

const ACCURACY_LABELS = {
  exact: { SR: 'Tačna lokacija', EN: 'Exact location' },
  approximate: { SR: 'Približna lokacija (po nazivu ulice)', EN: 'Approximate location (street level)' },
};

const SOURCE_HOME = 'https://www.vikns.rs/';

/* ------------------------------------------------------------------ */
/*  Pomoćne funkcije za datume (sve u vremenu Novog Sada)              */
/* ------------------------------------------------------------------ */

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('sr-RS', { timeZone: TZ }) : null;

const fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit', timeZone: TZ }) : null;

// YYYY-MM-DD, za poređenje sa <input type="date">
const dayKey = (iso) =>
  iso ? new Date(iso).toLocaleDateString('sv-SE', { timeZone: TZ }) : null;

const statusKeyOf = (ev) => (STATUS[ev?.status] ? ev.status : 'unknown');

export default function Disruptions() {
  const context = useOutletContext();
  const lang = context?.lang === 'EN' ? 'EN' : 'SR';
  const l = (sr, en) => (lang === 'SR' ? sr : en);
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);       // sirovi događaji iz API-ja
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customDate, setCustomDate] = useState('');
  const [copied, setCopied] = useState(false);
  const dateInputRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    fetchEvents()
      .then((data) => {
        if (!Array.isArray(data)) {
          setError(true);
          setEvents([]);
          setSelectedId(null);
          return;
        }
        setEvents(data);
        setSelectedId(data[0]?.id ?? null);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  /* ---------- pretvaranje API događaja u prikaz ---------- */

  const typeLabel = (key) => TYPE_LABELS[key]?.[lang] ?? key ?? l('Nepoznat tip', 'Unknown type');
  const statusLabel = (key) => STATUS[key][lang];

  const timeText = (ev) => {
    const start = ev.start_time;
    const end = ev.expected_end_time;
    if (start && end) {
      const sameDay = dayKey(start) === dayKey(end);
      return {
        date: fmtDate(start),
        time: sameDay
          ? `${fmtTime(start)} – ${fmtTime(end)}`
          : `${fmtTime(start)} – ${fmtDate(end)} ${fmtTime(end)}`,
      };
    }
    if (start) {
      return { date: fmtDate(start), time: fmtTime(start) };
    }
    if (end) {
      return {
        date: fmtDate(end),
        time: `${l('Očekivani kraj', 'Expected end')} ${fmtTime(end)}`,
      };
    }
    return { date: l('Vreme nije poznato', 'Time unknown'), time: '' };
  };

  const durationText = (ev) => {
    if (!ev.start_time || !ev.expected_end_time) return null;
    const hours = (new Date(ev.expected_end_time) - new Date(ev.start_time)) / 36e5;
    if (!(hours > 0)) return null;
    const h = Math.round(hours * 10) / 10;
    return lang === 'SR' ? `${h} h` : `${h} h`;
  };

  const fullAddress = (ev) => {
    const a = ev.location?.address;
    const m = ev.location?.municipality;
    return [a, m].filter(Boolean).join(', ') || l('Lokacija nije poznata', 'Location unknown');
  };

  const hasCoords = (ev) =>
    typeof ev?.location?.latitude === 'number' && typeof ev?.location?.longitude === 'number';

  /* ---------- filtriranje ---------- */

  const filteredEvents = events.filter((ev) => {
    const search = searchTerm.toLowerCase();
    const haystack = [ev.location?.address, ev.title, typeLabel(ev.event_type)]
      .map((s) => String(s || '').toLowerCase());
    const matchesSearch = haystack.some((s) => s.includes(search));

    const matchesStatus = statusFilter === 'all' || statusKeyOf(ev) === statusFilter;
    const matchesType = typeFilter === 'all' || ev.event_type === typeFilter;

    const matchesDate =
      !customDate ||
      dayKey(ev.start_time) === customDate ||
      dayKey(ev.expected_end_time) === customDate;

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const selectedEvent = events.find((ev) => ev.id === selectedId) || null;

  const count = (key) => events.filter((ev) => statusKeyOf(ev) === key).length;

  const handleCardClick = (key) => setStatusFilter(statusFilter === key ? 'all' : key);

  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setStatusFilter('all');
    setCustomDate('');
    if (dateInputRef.current) dateInputRef.current.value = '';
  };

  const copyLocation = (text) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cardStyle = (active) => ({
    backgroundColor: '#fff',
    padding: '1rem 1.25rem',
    borderRadius: '12px',
    border: active ? '2px solid #0284c7' : '1px solid #e2e8f0',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
    cursor: 'pointer',
  });

  const typeIcon = (key) => {
    if (key === 'emergency_repair') return <AlertTriangle size={16} color="#dc2626" />;
    return <Wrench size={16} color="#0284c7" />;
  };

  return (
    <div style={{ padding: '1.25rem 1.5rem', maxWidth: '1750px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>

      {/* ZAGLAVLJE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            {l('Događaji i Prekidi Vodosnabdevanja', 'Events & Water Outages')}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.2rem 0 0 0' }}>
            {l(
              'Evidencija najavljenih radova i havarija na vodovodnoj mreži Novog Sada, prema javnim obaveštenjima.',
              'Record of announced works and accidents on the Novi Sad water network, based on public notices.'
            )}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#64748b', backgroundColor: '#fff', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span>{l('Izvor:', 'Source:')}{' '}
            <a href={SOURCE_HOME} target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}>
              JKP Vodovod i kanalizacija Novi Sad <ExternalLink size={12} style={{ display: 'inline' }} />
            </a>
          </span>
        </div>
      </div>

      {/* STATISTIKA */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div onClick={() => setStatusFilter('all')} style={cardStyle(statusFilter === 'all')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '700' }}>{l('Ukupno zabeleženo', 'Total Recorded')}</span>
            <FileText size={20} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '0.25rem' }}>{events.length}</div>
          <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '0.15rem' }}>{l('događaja u evidenciji', 'events in the record')}</div>
        </div>

        <div onClick={() => handleCardClick('planned')} style={cardStyle(statusFilter === 'planned')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '700' }}>{l('Planirano', 'Planned')}</span>
            <Clock size={20} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '0.25rem' }}>{count('planned')}</div>
          <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '0.15rem' }}>{l('najavljenih događaja', 'announced events')}</div>
        </div>

        <div onClick={() => handleCardClick('ongoing')} style={cardStyle(statusFilter === 'ongoing')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '700' }}>{l('U toku', 'Ongoing')}</span>
            <Wrench size={20} color="#dc2626" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '0.25rem' }}>{count('ongoing')}</div>
          <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '0.15rem' }}>{l('trenutno aktivnih događaja', 'currently active events')}</div>
        </div>

        <div onClick={() => handleCardClick('completed')} style={cardStyle(statusFilter === 'completed')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '700' }}>{l('Završeni događaji', 'Completed Events')}</span>
            <CheckCircle size={20} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '0.25rem' }}>{count('completed')}</div>
          <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '0.15rem' }}>{l('potvrđeno završenih', 'confirmed completed')}</div>
        </div>

        <div onClick={() => handleCardClick('unknown')} style={cardStyle(statusFilter === 'unknown')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '700' }}>{l('Raspored nije potvrđen', 'Schedule Not Confirmed')}</span>
            <CalendarClock size={20} color="#64748b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '0.25rem' }}>{count('unknown')}</div>
          <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '0.15rem' }}>{l('događaji čekaju detalje rasporeda', 'Events awaiting scheduling details')}</div>
        </div>
      </div>

      {/* PRETRAGA I FILTERI */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center', position: 'relative' }}>
        <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder={l('Pretraži po lokaciji, nazivu ili tipu događaja...', 'Search by location, title or event type...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.6rem 0.55rem 2.4rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', backgroundColor: '#fff', boxSizing: 'border-box' }}
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ padding: '0.55rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff', cursor: 'pointer', color: '#334155' }}
        >
          <option value="all">{l('Svi tipovi', 'All types')}</option>
          {Object.keys(TYPE_LABELS).map((key) => (
            <option key={key} value={key}>{TYPE_LABELS[key][lang]}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '0.55rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff', cursor: 'pointer', color: '#334155' }}
        >
          <option value="all">{l('Svi statusi', 'All statuses')}</option>
          {Object.keys(STATUS).map((key) => (
            <option key={key} value={key}>{STATUS[key][lang]}</option>
          ))}
        </select>

        <input
          type="date"
          ref={dateInputRef}
          onChange={(e) => setCustomDate(e.target.value)}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
        />

        <button
          onClick={() => (dateInputRef.current?.showPicker ? dateInputRef.current.showPicker() : dateInputRef.current?.click())}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: customDate ? '#eff6ff' : '#fff', border: customDate ? '1px solid #0284c7' : '1px solid #cbd5e1', padding: '0.55rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', color: customDate ? '#0284c7' : '#475569', cursor: 'pointer', fontWeight: '500' }}
        >
          <Calendar size={15} color={customDate ? '#0284c7' : '#64748b'} />
          <span>{customDate || l('Izaberi datum', 'Select date')}</span>
        </button>

        <button
          onClick={resetFilters}
          style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'transparent', border: 'none', color: '#0284c7', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', padding: '0.4rem 0.6rem' }}
        >
          <RotateCcw size={14} />
          <span>{l('Resetuj filtre', 'Reset filters')}</span>
        </button>
      </div>

      {/* PORUKE O STANJU */}
      {loading && (
        <p style={{ color: '#64748b' }}>{l('Učitavanje događaja…', 'Loading events…')}</p>
      )}
      {error && (
        <p style={{ color: '#b91c1c' }}>{l('Događaji trenutno nisu dostupni.', 'Events are currently unavailable.')}</p>
      )}
      {!loading && !error && events.length === 0 && (
        <p style={{ color: '#64748b' }}>{l('Nema zabeleženih događaja.', 'No events recorded.')}</p>
      )}
      {!loading && !error && events.length > 0 && filteredEvents.length === 0 && (
        <p style={{ color: '#64748b' }}>{l('Nijedan događaj ne odgovara filterima.', 'No events match the filters.')}</p>
      )}

      {/* TABELA I DETALJI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 620px', gap: '1.25rem', alignItems: 'start' }}>

        {/* TABELA */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: '700', fontSize: '0.78rem' }}>
                <th style={{ padding: '0.85rem 1rem' }}>{l('Događaj', 'Event')}</th>
                <th style={{ padding: '0.85rem 1rem' }}>{l('Lokacija', 'Location')}</th>
                <th style={{ padding: '0.85rem 1rem' }}>{l('Datum & Vreme', 'Date & Time')}</th>
                <th style={{ padding: '0.85rem 1rem' }}>{l('Tip', 'Type')}</th>
                <th style={{ padding: '0.85rem 1rem' }}>{l('Status', 'Status')}</th>
                <th style={{ padding: '0.85rem 1rem' }}>{l('Izvor', 'Source')}</th>
                <th style={{ padding: '0.85rem 0.5rem' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((ev) => {
                const isSelected = selectedId === ev.id;
                const sKey = statusKeyOf(ev);
                const tt = timeText(ev);
                const published = fmtDate(ev.source?.published_at);

                return (
                  <tr
                    key={ev.id}
                    onClick={() => setSelectedId(ev.id)}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: isSelected ? '#f0f9ff' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {typeIcon(ev.event_type)}
                        <span>{ev.title}</span>
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} color="#64748b" /> {ev.location?.address || '—'}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '600', color: '#0f172a' }}>{tt.date}</span>
                        {tt.time && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{tt.time}</span>}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>{typeLabel(ev.event_type)}</td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700', backgroundColor: STATUS[sKey].bg, color: STATUS[sKey].color }}>
                        {statusLabel(sKey)}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: '#64748b' }}>
                      <div>{ev.source?.name || '—'}</div>
                      {published && <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{published}</div>}
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

        {/* DETALJI */}
        {selectedEvent && (() => {
          const sKey = statusKeyOf(selectedEvent);
          const tt = timeText(selectedEvent);
          const duration = durationText(selectedEvent);
          const published = fmtDate(selectedEvent.source?.published_at);
          const accuracy = ACCURACY_LABELS[selectedEvent.location?.location_accuracy]?.[lang];
          const dataType = DATA_TYPE_LABELS[selectedEvent.data_type]?.[lang];
          const addr = fullAddress(selectedEvent);
          const coords = hasCoords(selectedEvent)
            ? [selectedEvent.location.latitude, selectedEvent.location.longitude]
            : null;

          return (
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={18} color="#0284c7" />
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    {l('Detalji događaja', 'Event Details')}
                  </h3>
                </div>
                <button onClick={() => setSelectedId(null)} style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#94a3b8' }}>
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
                      {typeLabel(selectedEvent.event_type)}
                    </span>
                    {dataType && (
                      <span style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.7rem', fontWeight: '600', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                        {dataType}
                      </span>
                    )}
                  </div>
                </div>

                <span style={{ backgroundColor: STATUS[sKey].bg, color: STATUS[sKey].color, fontSize: '0.72rem', fontWeight: '700', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                  {statusLabel(sKey)}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.78rem', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <MapPin size={14} color="#64748b" style={{ flexShrink: 0 }} />
                  <strong style={{ color: '#475569', minWidth: '110px' }}>{l('Lokacija', 'Location')}:</strong>
                  <span style={{ color: '#0f172a' }}>{addr}</span>
                </div>

                {accuracy && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <ShieldCheck size={14} color="#64748b" style={{ flexShrink: 0 }} />
                    <strong style={{ color: '#475569', minWidth: '110px' }}>{l('Tačnost lokacije', 'Accuracy')}:</strong>
                    <span style={{ color: '#64748b' }}>{accuracy}</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Calendar size={14} color="#64748b" style={{ flexShrink: 0 }} />
                  <strong style={{ color: '#475569', minWidth: '110px' }}>{l('Datum i vreme', 'Date & time')}:</strong>
                  <span style={{ color: '#0f172a' }}>{tt.date}{tt.time ? `, ${tt.time}` : ''}</span>
                </div>

                {duration && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Clock size={14} color="#64748b" style={{ flexShrink: 0 }} />
                    <strong style={{ color: '#475569', minWidth: '110px' }}>{l('Trajanje', 'Duration')}:</strong>
                    <span style={{ color: '#0f172a' }}>{duration}</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <ExternalLink size={14} color="#64748b" style={{ flexShrink: 0 }} />
                  <strong style={{ color: '#475569', minWidth: '110px' }}>{l('Izvor', 'Source')}:</strong>
                  {selectedEvent.source?.url ? (
                    <a href={selectedEvent.source.url} target="_blank" rel="noreferrer" style={{ color: '#0284c7', textDecoration: 'none' }}>
                      {selectedEvent.source.name || l('saopštenje', 'notice')} <ExternalLink size={10} style={{ display: 'inline' }} />
                    </a>
                  ) : (
                    <span style={{ color: '#64748b' }}>{selectedEvent.source?.name || l('Nije poznato', 'Unknown')}</span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Clock size={14} color="#64748b" style={{ flexShrink: 0 }} />
                  <strong style={{ color: '#475569', minWidth: '110px' }}>{l('Objavljeno', 'Published')}:</strong>
                  <span style={{ color: '#64748b' }}>{published || l('Datum objave nije naveden', 'Publication date not stated')}</span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <CheckCircle size={14} color={STATUS[sKey].color} style={{ flexShrink: 0 }} />
                  <strong style={{ color: '#475569', minWidth: '110px' }}>{l('Status', 'Status')}:</strong>
                  <span style={{ color: STATUS[sKey].color, fontWeight: '700' }}>{statusLabel(sKey)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => navigate('/map')}
                  style={{ flex: 1, minWidth: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  <MapPin size={13} />
                  <span>{l('Prikaži na GIS mapi', 'Show on GIS map')}</span>
                </button>

                <button
                  onClick={() => navigate('/exposure')}
                  style={{ flex: 1, minWidth: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '0.5rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  <FileText size={13} />
                  <span>{l('Analiziraj izloženost', 'Analyze exposure')}</span>
                </button>

                <button
                  onClick={() => copyLocation(addr)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', backgroundColor: '#fff', color: '#475569', border: '1px solid #cbd5e1', padding: '0.5rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '600', cursor: 'pointer' }}
                >
                  <Share2 size={13} />
                  <span>{copied ? l('Kopirano!', 'Copied!') : l('Kopiraj lokaciju', 'Copy location')}</span>
                </button>
              </div>

              {coords ? (
                <div style={{ height: '200px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative' }}>
                  <MapContainer center={coords} zoom={14} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                    <MapUpdater center={coords} />
                    <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={coords}>
                      <Popup>
                        <strong>{selectedEvent.location?.address}</strong><br />
                        {selectedEvent.title}
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              ) : (
                <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: 0 }}>
                  {l('Koordinate za ovaj događaj nisu poznate.', 'Coordinates for this event are not known.')}
                </p>
              )}
            </div>
          );
        })()}

      </div>
    </div>
  );
}
