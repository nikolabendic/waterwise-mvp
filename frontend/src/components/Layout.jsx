
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { translations } from '../translations';

export default function Layout() {
  const [lang, setLang] = useState('EN'); 
  const t = translations[lang];

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <Navbar lang={lang} setLang={setLang} t={t} />

      <main>
        {}
        <Outlet context={{ lang, t }} />
      </main>
    </div>
  );
}