import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, Droplets, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function Navbar() {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/map', label: 'GIS Mapa', icon: Map },
    { path: '/hydrology', label: 'Hidrologija', icon: Droplets },
    { path: '/disruptions', label: 'Prekidi & Događaji', icon: AlertTriangle },
    { path: '/exposure', label: 'Analiza Izloženosti', icon: ShieldAlert },
  ];

  return (
    <header style={{ backgroundColor: '#1e293b', color: '#fff', padding: '0 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Droplets size={28} color="#38bdf8" />
        <span style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>
          WaterWise <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 'normal' }}>Novi Sad MVP</span>
        </span>
      </div>
      <nav style={{ display: 'flex', gap: '0.5rem' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: isActive ? '#fff' : '#94a3b8',
                backgroundColor: isActive ? '#0284c7' : 'transparent',
                transition: 'all 0.2s ease',
              })}
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </header>
  );
}