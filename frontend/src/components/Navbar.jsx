// src/components/Navbar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, Waves, AlertTriangle, Activity, Cpu } from 'lucide-react';

export default function Navbar({ lang, setLang, t }) {
  const navItems = [
    { path: '/', label: t.dashboard, icon: LayoutDashboard },
    { path: '/map', label: t.gis_map, icon: Map },
    { path: '/hydrology', label: t.hydrology, icon: Waves },
    { path: '/disruptions', label: t.disruptions, icon: AlertTriangle },
    { path: '/exposure', label: t.exposure, icon: Activity },
    { path: '/ai-simulation', label: t.ai_simulation, icon: Cpu },
  ];

  return (
    <header style={{ backgroundColor: '#0f172a', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
        <Waves color="#0284c7" size={24} />
        <span>WaterWise <small style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Novi Sad MVP</small></span>
      </div>

      <nav style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                textDecoration: 'none',
                backgroundColor: isActive ? '#0284c7' : 'transparent',
                color: isActive ? '#fff' : '#94a3b8',
                fontSize: '0.85rem',
                fontWeight: isActive ? '600' : 'normal',
                transition: 'all 0.2s'
              })}
            >
              <Icon size={16} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#1e293b', padding: '0.2rem', borderRadius: '6px' }}>
        <button 
          onClick={() => setLang('SR')}
          style={{
            padding: '0.25rem 0.5rem', border: 'none', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer',
            backgroundColor: lang === 'SR' ? '#0284c7' : 'transparent', color: lang === 'SR' ? '#fff' : '#94a3b8'
          }}
        >
          SR
        </button>
        <button 
          onClick={() => setLang('EN')}
          style={{
            padding: '0.25rem 0.5rem', border: 'none', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer',
            backgroundColor: lang === 'EN' ? '#0284c7' : 'transparent', color: lang === 'EN' ? '#fff' : '#94a3b8'
          }}
        >
          EN
        </button>
      </div>
    </header>
  );
}