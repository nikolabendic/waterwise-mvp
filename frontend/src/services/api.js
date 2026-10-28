// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://82.117.203.34:8000/api/v1';

// 1. Stanice za hidrologiju
export async function fetchStations() {
  try {
    const res = await fetch(`${API_BASE_URL}/hydrology/stations/`);
    if (!res.ok) throw new Error('Greška pri učitavanju stanica');
    const data = await res.json();
    return data.results || data;
  } catch (err) {
    console.warn('Backend nije dostupan za stanice:', err);
    return [];
  }
}

// 2. Poslednje merenje (za hidrološku stanicu)
export async function fetchLatestHydrology(stationId = 'RHMZ-NS') {
  try {
    const res = await fetch(`${API_BASE_URL}/hydrology/latest/?station_id=${stationId}`);
    if (!res.ok) throw new Error('Greška pri učitavanju poslednjeg merenja');
    return await res.json();
  } catch (err) {
    console.warn('Backend nije dostupan za poslednje merenje:', err);
    return null;
  }
}

// 3. Istorija vodostaja za grafikon (period: '7d', '24h', '30d'...)
export async function fetchHydrologyHistory(stationId = 'RHMZ-NS', period = '7d') {
  try {
    const res = await fetch(`${API_BASE_URL}/hydrology/history/?station_id=${stationId}&period=${period}`);
    if (!res.ok) throw new Error('Greška pri učitavanju istorije');
    return await res.json();
  } catch (err) {
    console.warn('Backend nije dostupan za istoriju:', err);
    return null;
  }
}

// 4. Događaji / Prekidi / Radovi (Disruptions)
export async function fetchEvents(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/events/${query ? '?' + query : ''}`);
    if (!res.ok) throw new Error('Greška pri učitavanju događaja');
    const data = await res.json();
    return data.results || data;
  } catch (err) {
    console.warn('Backend nije dostupan za događaje:', err);
    return [];
  }
}

// 5. Ustanove (Facilities) po kategoriji
export async function fetchFacilities(category = '') {
  try {
    const url = category ? `${API_BASE_URL}/facilities/?category=${category}` : `${API_BASE_URL}/facilities/`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Greška pri učitavanju ustanova');
    const data = await res.json();
    return data.results || data;
  } catch (err) {
    console.warn('Backend nije dostupan za ustanove:', err);
    return [];
  }
}

// Dodaj u src/services/api.js (ako već nemaš)
export async function fetchDashboardSummary() {
  try {
    const response = await fetch('http://82.117.203.34:8000/api/v1/dashboard/summary/');
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return null;
  }
}