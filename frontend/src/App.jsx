import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import Hydrology from './pages/Hydrology';
import Disruptions from './pages/Disruptions';
import Exposure from './pages/Exposure';
import AiForecastSimulation from './pages/AiForecastSimulation'; // Uvoz nove stranice

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="map" element={<MapView />} />
          <Route path="hydrology" element={<Hydrology />} />
          <Route path="disruptions" element={<Disruptions />} />
          <Route path="exposure" element={<Exposure />} />
          <Route path="ai-simulation" element={<AiForecastSimulation />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}