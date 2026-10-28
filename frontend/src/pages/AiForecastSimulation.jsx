// src/pages/AiForecastSimulation.jsx
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Calendar, Droplets, Database, Activity, 
  CheckCircle, Info, BarChart2, Zap, ArrowUpRight 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { fetchEvents } from '../services/api';

export default function AiForecastSimulation() {
  const context = useOutletContext();
  const lang = context?.lang || 'SR';
  const [selectedScenario, setSelectedScenario] = useState('normal');
  const [eventsCount, setEventsCount] = useState(4);
  const [forecastData, setForecastData] = useState([]);
  const [modelInfo, setModelInfo] = useState(null);
  
  // Stanja za podatke sa vodnog bilansa (water-balance endpointi)
  const [waterBalanceData, setWaterBalanceData] = useState(null);
  const [scenarioComparisonData, setScenarioComparisonData] = useState([]);

  useEffect(() => {
    // 1. Povlačenje događaja
    fetchEvents().then(data => {
      if (data && data.length > 0) {
        setEventsCount(data.length);
      }
    });

    // 2. Povlačenje AI prognoze sa tačnog JSON endpointa
    fetch('http://82.117.203.34:8000/api/v1/water-demand/forecast/')
      .then(res => res.json())
      .then(data => {
        if (data && data.forecast) {
          setModelInfo(data);
          const formatted = data.forecast.map((item, idx) => ({
            day: lang === 'SR' ? `Dan ${idx + 1}` : `Day ${idx + 1}`,
            date: item.date.split('-').reverse().join('.'),
            demand: Math.round(item.forecast_m3),
            lower: Math.round(item.forecast_m3 * 0.9),
            upper: Math.round(item.forecast_m3 * 1.1)
          }));
          setForecastData(formatted);
        }
      })
      .catch(err => {
        console.log('Using fallback forecast data', err);
        const fallback = [
          { day: lang === 'SR' ? 'Dan 1' : 'Day 1', date: '29.10.', demand: 95438, lower: 86000, upper: 105000 },
          { day: lang === 'SR' ? 'Dan 2' : 'Day 2', date: '30.10.', demand: 96403, lower: 87000, upper: 106000 },
          { day: lang === 'SR' ? 'Dan 3' : 'Day 3', date: '31.10.', demand: 93685, lower: 84000, upper: 103000 },
          { day: lang === 'SR' ? 'Dan 4' : 'Day 4', date: '01.11.', demand: 93332, lower: 84000, upper: 102000 },
          { day: lang === 'SR' ? 'Dan 5' : 'Day 5', date: '02.11.', demand: 95167, lower: 85000, upper: 104000 },
          { day: lang === 'SR' ? 'Dan 6' : 'Day 6', date: '03.11.', demand: 94282, lower: 85000, upper: 103000 },
          { day: lang === 'SR' ? 'Dan 7' : 'Day 7', date: '04.11.', demand: 96040, lower: 86000, upper: 105000 },
        ];
        setForecastData(fallback);
      });

    // 3. Paralelno povlačenje za sve scenarije radi iscrtavanja uporednog grafika 2
    Promise.all([
      fetch('http://82.117.203.34:8000/api/v1/water-balance/?scenario=normal&period=7d').then(res => res.json()).catch(() => null),
      fetch('http://82.117.203.34:8000/api/v1/water-balance/?scenario=peak&period=7d').then(res => res.json()).catch(() => null),
      fetch('http://82.117.203.34:8000/api/v1/water-balance/?scenario=reduced&period=7d').then(res => res.json()).catch(() => null),
      fetch('http://82.117.203.34:8000/api/v1/water-balance/?scenario=combined&period=7d').then(res => res.json()).catch(() => null),
    ]).then(([normalRes, peakRes, reducedRes, combinedRes]) => {
      if (normalRes && normalRes.daily && peakRes && reducedRes && combinedRes) {
        const combinedChart = normalRes.daily.map((item, idx) => ({
          day: lang === 'SR' ? `Dan ${idx + 1}` : `Day ${idx + 1}`,
          date: item.date.split('-').reverse().join('.'),
          normal: Math.round(normalRes.daily[idx]?.storage_end_m3 || 0),
          summer: Math.round(peakRes.daily[idx]?.storage_end_m3 || 0),
          reduced: Math.round(reducedRes.daily[idx]?.storage_end_m3 || 0),
          stress: Math.round(combinedRes.daily[idx]?.storage_end_m3 || 0),
        }));
        setScenarioComparisonData(combinedChart);
      }
    });

  }, [lang]);

  useEffect(() => {
    // 4. Povlačenje specifičnog vodnog bilansa za trenutno izabrani scenario
    const apiScenarioKey = selectedScenario === 'summer' ? 'peak' : selectedScenario === 'stress' ? 'combined' : selectedScenario;
    fetch(`http://82.117.203.34:8000/api/v1/water-balance/?scenario=${apiScenarioKey}&period=7d`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setWaterBalanceData(data);
        }
      })
      .catch(err => console.log('Water balance error:', err));
  }, [selectedScenario]);

  // Dinamičko izvlačenje vrednosti iz API odgovora za kartice rezultata
  const summaryStorageVal = waterBalanceData?.summary?.storage_end_m3 ? Math.round(waterBalanceData.summary.storage_end_m3) : (selectedScenario === 'normal' ? 225957 : selectedScenario === 'summer' ? 225323 : selectedScenario === 'reduced' ? 182652 : 83000);
  const unmetDemandVal = waterBalanceData?.summary?.total_unmet_m3 ? Math.round(waterBalanceData.summary.total_unmet_m3) : 0;
  
  const initialStorage = waterBalanceData?.parameters?.initial_storage_m3 || 175000;
  const reserveDiffPct = Math.round(((summaryStorageVal - initialStorage) / initialStorage) * 100);

  const scenarios = {
    normal: {
      id: 'normal',
      title: lang === 'SR' ? 'Normalno' : 'Normal',
      subtitle: lang === 'SR' ? 'Osnovni uslovi' : 'Base conditions',
      demandTag: lang === 'SR' ? 'Predviđena potražnja iz Random Forest modela' : 'Random Forest model predicted demand',
      capacityTag: lang === 'SR' ? '100% kapacitet' : '100% capacity',
      reserve7Days: `${summaryStorageVal.toLocaleString()} m³`,
      reserveDiff: lang === 'SR' ? `${reserveDiffPct >= 0 ? '+' : ''}${reserveDiffPct}% u odnosu na početno stanje` : `${reserveDiffPct >= 0 ? '+' : ''}${reserveDiffPct}% compared to initial state`,
      unmetDemand: `${unmetDemandVal.toLocaleString()} m³`,
      unmetStatus: lang === 'SR' ? 'Sistem zadovoljava potrebe' : 'System satisfies demand',
      avgProduction: lang === 'SR' ? '103.200 m³/dan' : '103,200 m³/day',
      prodCapacity: lang === 'SR' ? '86% kapaciteta' : '86% capacity',
      avgDemand: lang === 'SR' ? '94.890 m³/dan' : '94,890 m³/day',
      explanation: lang === 'SR' 
        ? `Model: ${modelInfo?.model_type || 'random_forest'} (${modelInfo?.model_status || 'experimental'}). Dnevne potrebe su u opsegu ~93.000 - 96.400 m³/dan. Sistem u potpunosti zadovoljava potrebe.`
        : `Model: ${modelInfo?.model_type || 'random_forest'} (${modelInfo?.model_status || 'experimental'}). Daily needs range between ~93,000 - 96,400 m³/day. System fully satisfies demand.`,
      recommendation: lang === 'SR'
        ? 'U normalnim uslovima sistem je stabilan. Nastaviti praćenje.'
        : 'Under normal conditions, the system is stable. Continue monitoring.'
    },
    summer: {
      id: 'summer',
      title: lang === 'SR' ? 'Letnji maksimum' : 'Summer Peak',
      subtitle: lang === 'SR' ? '+15% potražnja' : '+15% demand',
      demandTag: lang === 'SR' ? 'Predviđena potražnja +15%' : 'Predicted demand +15%',
      capacityTag: lang === 'SR' ? '100% kapacitet' : '100% capacity',
      reserve7Days: `${summaryStorageVal.toLocaleString()} m³`,
      reserveDiff: lang === 'SR' ? `${reserveDiffPct >= 0 ? '+' : ''}${reserveDiffPct}% u odnosu na početno stanje` : `${reserveDiffPct >= 0 ? '+' : ''}${reserveDiffPct}% compared to initial state`,
      unmetDemand: `${unmetDemandVal.toLocaleString()} m³`,
      unmetStatus: lang === 'SR' ? 'Sistem zadovoljava potrebe uz akumulaciju rezervi' : 'System satisfies demand accumulating reserves',
      avgProduction: lang === 'SR' ? '115.400 m³/dan' : '115,400 m³/day',
      prodCapacity: lang === 'SR' ? '96% kapaciteta' : '96% capacity',
      avgDemand: lang === 'SR' ? '109.100 m³/dan' : '109,100 m³/day',
      explanation: lang === 'SR'
        ? 'Zbog povećane letnje potrošnje (+15%), proizvodni kapaciteti rade blizu maksimuma, a zalihe u rezervoarima rastu.'
        : 'Due to increased summer consumption (+15%), production capacities run near maximum while reserves grow.',
      recommendation: lang === 'SR' ? 'Aktivirati sekundarne bunarske kapacitete po potrebi.' : 'Activate secondary well capacities if needed.'
    },
    reduced: {
      id: 'reduced',
      title: lang === 'SR' ? 'Smanjena proizvodnja' : 'Reduced Production',
      subtitle: lang === 'SR' ? '-20% kapacitet' : '-20% capacity',
      demandTag: lang === 'SR' ? 'Predviđena potražnja iz AI modela' : 'AI model predicted demand',
      capacityTag: lang === 'SR' ? '80% kapacitet' : '80% capacity',
      reserve7Days: `${summaryStorageVal.toLocaleString()} m³`,
      reserveDiff: lang === 'SR' ? `${reserveDiffPct >= 0 ? '+' : ''}${reserveDiffPct}% u odnosu na početno stanje` : `${reserveDiffPct >= 0 ? '+' : ''}${reserveDiffPct}% compared to initial state`,
      unmetDemand: `${unmetDemandVal.toLocaleString()} m³`,
      unmetStatus: lang === 'SR' ? 'Stabilan rad sa smanjenim kapacitetom' : 'Stable operation with reduced capacity',
      avgProduction: lang === 'SR' ? '96.000 m³/dan' : '96,000 m³/day',
      prodCapacity: lang === 'SR' ? '80% kapaciteta' : '80% capacity',
      avgDemand: lang === 'SR' ? '94.890 m³/dan' : '94,890 m³/day',
      explanation: lang === 'SR' ? 'Smanjenje proizvodnog kapaciteta na 80% (96.000 m³/dan). Proizvodnja pokriva potrebe.' : 'Reduction of production capacity to 80%. Production covers needs.',
      recommendation: lang === 'SR' ? 'Izvršiti redovan pregled postrojenja.' : 'Perform routine plant inspection.'
    },
    stress: {
      id: 'stress',
      title: lang === 'SR' ? 'Kombinovani stres' : 'Combined Stress',
      subtitle: lang === 'SR' ? '+15% potražnja, -20% kapacitet' : '+15% demand, -20% capacity',
      demandTag: lang === 'SR' ? 'Predviđena potražnja +15%' : 'Predicted demand +15%',
      capacityTag: lang === 'SR' ? '80% kapacitet' : '80% capacity',
      reserve7Days: `${summaryStorageVal.toLocaleString()} m³`,
      reserveDiff: lang === 'SR' ? `${reserveDiffPct >= 0 ? '+' : ''}${reserveDiffPct}% u odnosu na početno stanje` : `${reserveDiffPct >= 0 ? '+' : ''}${reserveDiffPct}% compared to initial state`,
      unmetDemand: `${unmetDemandVal.toLocaleString()} m³`,
      unmetStatus: lang === 'SR' ? (unmetDemandVal > 0 ? 'Nezadovoljene potrebe' : 'Zadovoljeno uz pražnjenje rezervi') : 'Satisfied using reserves',
      avgProduction: lang === 'SR' ? '96.000 m³/dan' : '96,000 m³/day',
      prodCapacity: lang === 'SR' ? '80% kapaciteta' : '80% capacity',
      avgDemand: lang === 'SR' ? '109.100 m³/dan' : '109,100 m³/day',
      explanation: lang === 'SR' ? 'Najzahtevniji scenario: istovremeni +15% skok potražnje i -20% smanjenje kapaciteta.' : 'Most demanding scenario.',
      recommendation: lang === 'SR' ? 'Pripremiti alternativne pravce vodosnabdevanja.' : 'Prepare alternative supply routes.'
    }
  };

  const currentScenario = scenarios[selectedScenario];

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: '1440px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* ZAGLAVLJE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: '#0f172a' }}>
            {lang === 'SR' ? 'AI prognoza i simulacija scenarija' : 'AI Forecast & Scenario Simulation'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            {lang === 'SR' 
              ? `Model: ${modelInfo?.model_type || 'random_forest'} (${modelInfo?.model_status || 'experimental'}) – Predikcija mrežnog ulaza u m³/dan.`
              : `Model: ${modelInfo?.model_type || 'random_forest'} (${modelInfo?.model_status || 'experimental'}) – Network input prediction in m³/day.`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <Info size={18} color="#0284c7" />
          <div style={{ fontSize: '0.8rem', color: '#334155' }}>
            <strong>{lang === 'SR' ? 'Random Forest MAE:' : 'Random Forest MAE:'}</strong> {modelInfo?.validation?.random_forest?.mae_m3_per_day ? Math.round(modelInfo.validation.random_forest.mae_m3_per_day) : '1,377'} m³/d
          </div>
        </div>
      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0284c7', fontSize: '0.75rem', fontWeight: '600' }}>
            <Calendar size={16} /> {lang === 'SR' ? 'HORIZONT PROGNOZE' : 'FORECAST HORIZON'}
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.25rem' }}>{modelInfo?.horizon_days || 7} {lang === 'SR' ? 'dana' : 'days'}</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Target: {modelInfo?.target || 'network_input_m3'}</div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0284c7', fontSize: '0.75rem', fontWeight: '600' }}>
            <Droplets size={16} /> {lang === 'SR' ? 'PREDVIĐENA POTRAŽNJA (dan 1)' : 'PREDICTED DEMAND (day 1)'}
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.25rem' }}>{forecastData[0]?.demand.toLocaleString() || '95,438'}</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>m³/dan</div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontSize: '0.75rem', fontWeight: '600' }}>
            <Database size={16} /> {lang === 'SR' ? 'POČETNA REZERVA' : 'INITIAL RESERVE'}
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.25rem' }}>{initialStorage.toLocaleString()}</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>m³</div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6366f1', fontSize: '0.75rem', fontWeight: '600' }}>
            <BarChart2 size={16} /> {lang === 'SR' ? 'VALIDACIJA (RMSE)' : 'VALIDATION (RMSE)'}
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.25rem' }}>{modelInfo?.validation?.random_forest?.rmse_m3_per_day ? Math.round(modelInfo.validation.random_forest.rmse_m3_per_day) : '1,779'}</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>m³/dan</div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d97706', fontSize: '0.75rem', fontWeight: '600' }}>
            <Activity size={16} /> {lang === 'SR' ? 'STATUS MODELA' : 'MODEL STATUS'}
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '0.25rem', color: '#0284c7' }}>{modelInfo?.model_status || 'experimental'}</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Mode: {modelInfo?.execution_mode || 'precomputed'}</div>
        </div>
      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {}
        <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>
                {lang === 'SR' ? '1. AI prognoza potreba za vodom (API)' : '1. AI Water Demand Forecast (API)'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                {lang === 'SR' ? 'Predviđeni dnevni ulaz vode u distributivnu mrežu (m³/dan) iz API-ja.' : 'Predicted daily water input into the distribution network from API.'}
              </p>
            </div>
            <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '0.75rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
              {modelInfo?.model_type || 'Random Forest'}
            </span>
          </div>

          <div style={{ width: '100%', height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUncertainty" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} />
                <Tooltip formatter={(value) => `${value.toLocaleString()} m³`} />
                <Area type="monotone" dataKey="upper" stroke="transparent" fill="url(#colorUncertainty)" />
                <Line type="monotone" dataKey="demand" stroke="#0284c7" strokeWidth={3} dot={{ r: 4 }} name={lang === 'SR' ? 'Prognoza (m³/dan)' : 'Forecast (m³/day)'} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {}
        <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>
              {lang === 'SR' ? '2. Izaberite scenario' : '2. Select Scenario'}
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            
            <div onClick={() => setSelectedScenario('normal')} style={{ padding: '0.75rem', borderRadius: '8px', border: selectedScenario === 'normal' ? '2px solid #0284c7' : '1px solid #e2e8f0', backgroundColor: selectedScenario === 'normal' ? '#f0f9ff' : '#fff', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '700', fontSize: '0.875rem' }}>{lang === 'SR' ? 'Normalno' : 'Normal'}</span>
                {selectedScenario === 'normal' && <CheckCircle size={16} color="#0284c7" />}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{lang === 'SR' ? 'Osnovni uslovi' : 'Base conditions'}</div>
              <div style={{ fontSize: '0.7rem', color: '#334155', marginTop: '0.5rem' }}>{scenarios.normal.demandTag}</div>
            </div>

            <div onClick={() => setSelectedScenario('summer')} style={{ padding: '0.75rem', borderRadius: '8px', border: selectedScenario === 'summer' ? '2px solid #0284c7' : '1px solid #e2e8f0', backgroundColor: selectedScenario === 'summer' ? '#f0f9ff' : '#fff', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '700', fontSize: '0.875rem' }}>{lang === 'SR' ? 'Letnji maksimum' : 'Summer Peak'}</span>
                {selectedScenario === 'summer' && <CheckCircle size={16} color="#0284c7" />}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#d97706' }}>{lang === 'SR' ? '+15% potražnja' : '+15% demand'}</div>
            </div>

            <div onClick={() => setSelectedScenario('reduced')} style={{ padding: '0.75rem', borderRadius: '8px', border: selectedScenario === 'reduced' ? '2px solid #0284c7' : '1px solid #e2e8f0', backgroundColor: selectedScenario === 'reduced' ? '#f0f9ff' : '#fff', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '700', fontSize: '0.875rem' }}>{lang === 'SR' ? 'Smanjena proizvodnja' : 'Reduced Production'}</span>
                {selectedScenario === 'reduced' && <CheckCircle size={16} color="#0284c7" />}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#dc2626' }}>{lang === 'SR' ? '-20% kapacitet' : '-20% capacity'}</div>
            </div>

            <div onClick={() => setSelectedScenario('stress')} style={{ padding: '0.75rem', borderRadius: '8px', border: selectedScenario === 'stress' ? '2px solid #dc2626' : '1px solid #e2e8f0', backgroundColor: selectedScenario === 'stress' ? '#fef2f2' : '#fff', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '700', fontSize: '0.875rem', color: '#dc2626' }}>{lang === 'SR' ? 'Kombinovani stres' : 'Combined Stress'}</span>
                {selectedScenario === 'stress' && <CheckCircle size={16} color="#dc2626" />}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#dc2626' }}>{lang === 'SR' ? 'Stresni uslovi' : 'Stress conditions'}</div>
            </div>

          </div>
        </div>
      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>
                {lang === 'SR' ? '3. Rezultati simulacije za izabrane scenarije' : '3. Simulation Results for Selected Scenarios'}
              </h3>
            </div>
          </div>

          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scenarioComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} />
                <Tooltip formatter={(val) => `${val.toLocaleString()} m³`} />
                <Legend />
                <Line type="monotone" dataKey="normal" name={lang === 'SR' ? 'Normalno' : 'Normal'} stroke="#0284c7" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="summer" name={lang === 'SR' ? 'Letnji maksimum' : 'Summer Peak'} stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="reduced" name={lang === 'SR' ? 'Smanjena proizvodnja' : 'Reduced Production'} stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="stress" name={lang === 'SR' ? 'Kombinovani stres' : 'Combined Stress'} stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 1rem 0' }}>
            {lang === 'SR' ? `Ključni rezultati (${currentScenario.title})` : `Key Results (${currentScenario.title})`}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{lang === 'SR' ? 'Rezerva nakon 7 dana' : 'Reserve after 7 days'}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.2rem' }}>{currentScenario.reserve7Days}</div>
              <div style={{ fontSize: '0.7rem', color: '#059669', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <ArrowUpRight size={14} /> {currentScenario.reserveDiff}
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{lang === 'SR' ? 'Nezadovoljene potrebe' : 'Unmet demand'}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.2rem', color: unmetDemandVal > 0 ? '#dc2626' : '#0f172a' }}>
                {currentScenario.unmetDemand}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
                {currentScenario.unmetStatus}
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{lang === 'SR' ? 'Prosečna proizvodnja' : 'Average production'}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.2rem' }}>{currentScenario.avgProduction}</div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{lang === 'SR' ? 'Prosečna potražnja' : 'Average demand'}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.2rem' }}>{currentScenario.avgDemand}</div>
            </div>
          </div>
        </div>

      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Zap size={18} color="#0284c7" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>
              {lang === 'SR' ? '4. Objašnjenje i preporuke' : '4. Explanation & Recommendations'}
            </h3>
          </div>

          <div style={{ fontSize: '0.8rem', color: '#334155', marginBottom: '0.75rem' }}>
            {currentScenario.explanation}
          </div>

          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={16} /> <strong>{lang === 'SR' ? 'Preporuka:' : 'Recommendation:'}</strong> {currentScenario.recommendation}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 0.75rem 0' }}>
            {lang === 'SR' ? 'Ograničenja i metapodaci modela' : 'Limitations & Model Metadata'}
          </h3>

          <ul style={{ fontSize: '0.75rem', color: '#64748b', paddingLeft: '1rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {modelInfo?.limitations ? (
              modelInfo.limitations.map((limit, idx) => <li key={idx}>{limit}</li>)
            ) : (
              <>
                <li>Utility history is synthetic; test scores measure synthetic-data performance.</li>
                <li>Do not infer actual outages or environmental water scarcity from this prediction.</li>
              </>
            )}
            <li>Model Type: <strong>{modelInfo?.model_type || 'random_forest'}</strong></li>
            <li>Trained On: <strong>{modelInfo?.trained_on || 'synthetic'}</strong></li>
          </ul>
        </div>

      </div>

    </div>
  );
}