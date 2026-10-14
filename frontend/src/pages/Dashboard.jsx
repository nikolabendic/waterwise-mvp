import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Droplets, Building2, ShieldCheck, ArrowRight, Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const miniTrendData = [
  { time: '00:00', level: 246 },
  { time: '04:00', level: 245 },
  { time: '08:00', level: 244 },
  { time: '12:00', level: 244 },
  { time: '16:00', level: 243 },
  { time: '20:00', level: 243 },
];

const recentDisruptions = [
  { id: 1, title: 'Bulevar Slobodana Jovanovića', type: 'Havarija', date: 'Danas', status: 'Aktivno' },
  { id: 2, title: 'Janka Čmelika', type: 'Planirani radovi', date: '02.07.2026.', status: 'Završen' },
  { id: 3, title: 'Bulevar oslobođenja', type: 'Havarija', date: '31.07.2026.', status: 'Završen' },
];

export default function Dashboard() {
  const noviSadCenter = [45.2550, 19.8250];

  return (
    <div style={{ 
      padding: '1.25rem 1.5rem', 
      maxWidth: '1600px', 
      margin: '0 auto', 
      boxSizing: 'border-box',
      height: 'calc(100vh - 80px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      overflow: 'hidden'
    }}>
      
      {}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            WaterWise Novi Sad - Dashboard
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.15rem 0 0 0' }}>
            Sistem za praćenje hidrološkog stanja i upravljanje prekidima vodosnabdevanja
          </p>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.4rem 0.9rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700' }}>
          <ShieldCheck size={18} />
          <span>Sistem je stabilan</span>
        </div>
      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '0.85rem' }}>
        
        <div style={{ backgroundColor: '#fff', padding: '0.85rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Vodostaj Dunava</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '0.1rem' }}>
              243 <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#64748b' }}>cm</span>
            </div>
          </div>
          <div style={{ backgroundColor: '#e0f2fe', padding: '0.65rem', borderRadius: '10px', color: '#0284c7' }}>
            <Droplets size={24} />
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '0.85rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Zabeleženi Događaji</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '0.1rem' }}>3</div>
          </div>
          <div style={{ backgroundColor: '#fef3c7', padding: '0.65rem', borderRadius: '10px', color: '#d97706' }}>
            <AlertTriangle size={24} />
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '0.85rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Kritični Objekti</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '0.1rem' }}>4</div>
          </div>
          <div style={{ backgroundColor: '#e0e7ff', padding: '0.65rem', borderRadius: '10px', color: '#4f46e5' }}>
            <Building2 size={24} />
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '0.85rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Opšti Rizik</div>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#16a34a', marginTop: '0.1rem' }}>NIZAK</div>
          </div>
          <div style={{ backgroundColor: '#f0fdf4', padding: '0.65rem', borderRadius: '10px', color: '#16a34a' }}>
            <Activity size={24} />
          </div>
        </div>

      </div>

      {}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'minmax(0, 1.75fr) minmax(0, 1.25fr)', 
        gap: '1.25rem', 
        flex: 1, 
        minHeight: 0 
      }}>
        
        {}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Prostorni Pregled Mreže (Novi Sad)</h3>
            </div>
            <Link to="/map" style={{ color: '#0284c7', fontSize: '0.85rem', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Detaljan pregled mape <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ flex: 1, borderRadius: '10px', overflow: 'hidden', border: '1px solid #cbd5e1', minHeight: 0 }}>
            <MapContainer center={noviSadCenter} zoom={12.8} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[45.2572, 19.8583]}>
                <Popup><b>Novi Sad - Dunav</b><br />Vodostaj: 243 cm</Popup>
              </Marker>
              <Marker position={[45.2538, 19.8020]}>
                <Popup><b>Bulevar Slobodana Jovanovića</b><br />Aktivna havarija</Popup>
              </Marker>
              <Marker position={[45.2588, 19.8130]}>
                <Popup><b>Janka Čmelika</b><br />Završen prekid</Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>

        {}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', height: '100%' }}>
          
          {}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Trend Vodostaja (Danas)</h3>
              <Link to="/hydrology" style={{ color: '#0284c7', fontSize: '0.8rem', fontWeight: '700', textDecoration: 'none' }}>
                Opširnije
              </Link>
            </div>

            <div style={{ width: '100%', height: '135px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={miniTrendData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashLevel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="#94a3b8" fontSize={11} unit="cm" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', border: 'none' }}
                    formatter={(value) => [`${value} cm`, 'Vodostaj']}
                  />
                  <Area type="monotone" dataKey="level" stroke="#0284c7" strokeWidth={2.5} fill="url(#dashLevel)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 0 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Zabeleženi Prekidi Mreže</h3>
                <Link to="/disruptions" style={{ color: '#0284c7', fontSize: '0.8rem', fontWeight: '700', textDecoration: 'none' }}>
                  Svi prekidi
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {recentDisruptions.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0f172a' }}>{item.title}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{item.type} • {item.date}</div>
                    </div>
                    <span style={{ 
                      fontSize: '0.72rem', 
                      fontWeight: '700', 
                      padding: '0.25rem 0.6rem', 
                      borderRadius: '12px',
                      backgroundColor: item.status === 'Aktivno' ? '#fef3c7' : '#dcfce7',
                      color: item.status === 'Aktivno' ? '#b45309' : '#166534'
                    }}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}