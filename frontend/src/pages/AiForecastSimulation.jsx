// src/pages/AiForecastSimulation.jsx
import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Calendar, Droplets, Database, Activity, 
  CheckCircle, Info, BarChart2, Zap, ArrowUpRight 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';

const forecastDataSR = [
  { day: 'Dan 1', date: '24. okt', demand: 90000, lower: 82000, upper: 98000 },
  { day: 'Dan 2', date: '25. okt', demand: 98000, lower: 89000, upper: 107000 },
  { day: 'Dan 3', date: '26. okt', demand: 105000, lower: 95000, upper: 115000 },
  { day: 'Dan 4', date: '27. okt', demand: 111000, lower: 100000, upper: 122000 },
  { day: 'Dan 5', date: '28. okt', demand: 116000, lower: 104000, upper: 128000 },
  { day: 'Dan 6', date: '29. okt', demand: 113000, lower: 101000, upper: 125000 },
  { day: 'Dan 7', date: '30. okt', demand: 109000, lower: 97000, upper: 121000 },
];

const forecastDataEN = [
  { day: 'Day 1', date: 'Oct 24', demand: 90000, lower: 82000, upper: 98000 },
  { day: 'Day 2', date: 'Oct 25', demand: 98000, lower: 89000, upper: 107000 },
  { day: 'Day 3', date: 'Oct 26', demand: 105000, lower: 95000, upper: 115000 },
  { day: 'Day 4', date: 'Oct 27', demand: 111000, lower: 100000, upper: 122000 },
  { day: 'Day 5', date: 'Oct 28', demand: 116000, lower: 104000, upper: 128000 },
  { day: 'Day 6', date: 'Oct 29', demand: 113000, lower: 101000, upper: 125000 },
  { day: 'Day 7', date: 'Oct 30', demand: 109000, lower: 97000, upper: 121000 },
];

const scenarioComparisonDataSR = [
  { day: 'Dan 1', date: '24. okt', normal: 175000, summer: 161500, reduced: 145000, stress: 131500 },
  { day: 'Dan 2', date: '25. okt', normal: 197000, summer: 164500, reduced: 147000, stress: 114500 },
  { day: 'Dan 3', date: '26. okt', normal: 212000, summer: 162000, reduced: 142000, stress: 92000 },
  { day: 'Dan 4', date: '27. okt', normal: 221000, summer: 155500, reduced: 126000, stress: 60500 },
  { day: 'Dan 5', date: '28. okt', normal: 225000, summer: 146000, reduced: 105000, stress: 26000 },
  { day: 'Dan 6', date: '29. okt', normal: 232000, summer: 146500, reduced: 87000, stress: 1500 },
  { day: 'Dan 7', date: '30. okt', normal: 243000, summer: 150000, reduced: 73000, stress: 0 },
];

const scenarioComparisonDataEN = [
  { day: 'Day 1', date: 'Oct 24', normal: 175000, summer: 161500, reduced: 145000, stress: 131500 },
  { day: 'Day 2', date: 'Oct 25', normal: 197000, summer: 164500, reduced: 147000, stress: 114500 },
  { day: 'Day 3', date: 'Oct 26', normal: 212000, summer: 162000, reduced: 142000, stress: 92000 },
  { day: 'Day 4', date: 'Oct 27', normal: 221000, summer: 155500, reduced: 126000, stress: 60500 },
  { day: 'Day 5', date: 'Oct 28', normal: 225000, summer: 146000, reduced: 105000, stress: 26000 },
  { day: 'Day 6', date: 'Oct 29', normal: 232000, summer: 146500, reduced: 87000, stress: 1500 },
  { day: 'Day 7', date: 'Oct 30', normal: 243000, summer: 150000, reduced: 73000, stress: 0 },
];

export default function AiForecastSimulation() {
  const context = useOutletContext();
  const lang = context?.lang || 'SR';
  const [selectedScenario, setSelectedScenario] = useState('normal');

  const forecastData = lang === 'SR' ? forecastDataSR : forecastDataEN;
  const scenarioComparisonData = lang === 'SR' ? scenarioComparisonDataSR : scenarioComparisonDataEN;

  const scenarios = {
    normal: {
      id: 'normal',
      title: lang === 'SR' ? 'Normalno' : 'Normal',
      subtitle: lang === 'SR' ? 'Osnovni uslovi' : 'Base conditions',
      demandTag: lang === 'SR' ? 'Predviđena potražnja iz AI modela' : 'AI model predicted demand',
      capacityTag: lang === 'SR' ? '100% kapacitet' : '100% capacity',
      reserve7Days: '226.000 m³',
      reserveDiff: lang === 'SR' ? '+29% u odnosu na početno stanje' : '+29% compared to initial state',
      unmetDemand: '0 m³',
      unmetStatus: lang === 'SR' ? 'Sistem zadovoljava potrebe' : 'System satisfies demand',
      avgProduction: lang === 'SR' ? '111.000 m³/dan' : '111,000 m³/day',
      prodCapacity: lang === 'SR' ? '92% kapaciteta' : '92% capacity',
      avgDemand: lang === 'SR' ? '108.000 m³/dan' : '108,000 m³/day',
      explanation: lang === 'SR' 
        ? 'Prema AI prognozi, dnevne potrebe su u opsegu 100.000 - 113.000 m³/dan. Sa punim proizvodnim kapacitetom, sistem zadovoljava potrebe i postepeno dopunjuje rezerve.'
        : 'According to AI forecast, daily needs range between 100,000 - 113,000 m³/day. With full production capacity, the system satisfies needs and gradually replenishes reserves.',
      recommendation: lang === 'SR'
        ? 'U normalnim uslovima sistem je stabilan. Nastaviti praćenje meteoroloških prognoza i stanja rezervi.'
        : 'Under normal conditions, the system is stable. Continue monitoring weather forecasts and reserve levels.'
    },
    summer: {
      id: 'summer',
      title: lang === 'SR' ? 'Letnji maksimum' : 'Summer Peak',
      subtitle: lang === 'SR' ? '+15% potražnja' : '+15% demand',
      demandTag: lang === 'SR' ? 'Predviđena potražnja +15%' : 'Predicted demand +15%',
      capacityTag: lang === 'SR' ? '100% kapacitet' : '100% capacity',
      reserve7Days: '150.000 m³',
      reserveDiff: lang === 'SR' ? '-14% u odnosu na početno stanje' : '-14% compared to initial state',
      unmetDemand: '0 m³',
      unmetStatus: lang === 'SR' ? 'Sistem zadovoljava potrebe uz trošenje rezervi' : 'System satisfies demand using reserves',
      avgProduction: lang === 'SR' ? '120.000 m³/dan' : '120,000 m³/day',
      prodCapacity: lang === 'SR' ? '100% kapaciteta' : '100% capacity',
      avgDemand: lang === 'SR' ? '124.200 m³/dan' : '124,200 m³/day',
      explanation: lang === 'SR'
        ? 'Zbog povećane letnje potrošnje (+15%), proizvodni kapaciteti rade na 100%. Deficit se pokriva iz postojećih akumulacionih rezervi.'
        : 'Due to increased summer consumption (+15%), production capacities run at 100%. The deficit is covered from existing storage reserves.',
      recommendation: lang === 'SR'
        ? 'Aktivirati sekundarne bunarske kapacitete i apelovati na racionalnu potrošnju vode za zalivanje.'
        : 'Activate secondary well capacities and appeal for rational water consumption for irrigation.'
    },
    reduced: {
      id: 'reduced',
      title: lang === 'SR' ? 'Smanjena proizvodnja' : 'Reduced Production',
      subtitle: lang === 'SR' ? '-20% kapacitet' : '-20% capacity',
      demandTag: lang === 'SR' ? 'Predviđena potražnja iz AI modela' : 'AI model predicted demand',
      capacityTag: lang === 'SR' ? '80% kapacitet' : '80% capacity',
      reserve7Days: '73.000 m³',
      reserveDiff: lang === 'SR' ? '-58% u odnosu na početno stanje' : '-58% compared to initial state',
      unmetDemand: '0 m³',
      unmetStatus: lang === 'SR' ? 'Kritičan nivo rezervi' : 'Critical reserve level',
      avgProduction: lang === 'SR' ? '96.000 m³/dan' : '96,000 m³/day',
      prodCapacity: lang === 'SR' ? '80% kapaciteta' : '80% capacity',
      avgDemand: lang === 'SR' ? '108.000 m³/dan' : '108,000 m³/day',
      explanation: lang === 'SR'
        ? 'Tehnički kvar ili radovi smanjuju prerađivački kapacitet za 20%. Rezerve ubrzano opadaju.'
        : 'Technical failure or maintenance reduces processing capacity by 20%. Reserves are dropping rapidly.',
      recommendation: lang === 'SR'
        ? 'Hitna sanacija kvara na prerađivačkom postrojenju i redukcija pritiska u noćnim satima.'
        : 'Emergency repair of the treatment plant failure and pressure reduction during night hours.'
    },
    stress: {
      id: 'stress',
      title: lang === 'SR' ? 'Kombinovani stres' : 'Combined Stress',
      subtitle: lang === 'SR' ? '+15% potražnja, -20% kapacitet' : '+15% demand, -20% capacity',
      demandTag: lang === 'SR' ? 'Predviđena potražnja +15%' : 'Predicted demand +15%',
      capacityTag: lang === 'SR' ? '80% kapacitet' : '80% capacity',
      reserve7Days: '0 m³',
      reserveDiff: lang === 'SR' ? '-100% (Iscrpljene rezerve)' : '-100% (Reserves depleted)',
      unmetDemand: '18.500 m³',
      unmetStatus: lang === 'SR' ? 'Sistem ne može u potpunosti zadovoljiti potrebe' : 'System cannot fully satisfy demand',
      avgProduction: lang === 'SR' ? '96.000 m³/dan' : '96,000 m³/day',
      prodCapacity: lang === 'SR' ? '80% kapaciteta' : '80% capacity',
      avgDemand: lang === 'SR' ? '124.200 m³/dan' : '124,200 m³/day',
      explanation: lang === 'SR'
        ? 'Najnepovoljniji scenario: istovremeni toplotni talas i smanjeni kapacitet. Rezerve se potpuno prazne 7. dana.'
        : 'Most unfavorable scenario: simultaneous heatwave and reduced capacity. Reserves are completely emptied on day 7.',
      recommendation: lang === 'SR'
        ? 'Uvođenje planskih restrikcija po zonama grada i aktivacija vanrednih rezervoara.'
        : 'Introduction of planned restrictions across city zones and activation of emergency reserves.'
    }
  };

  const currentScenario = scenarios[selectedScenario];

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: '1440px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Naslov sekcije i Eksperimentalni model obaveštenje */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: '#0f172a' }}>
            {lang === 'SR' ? 'AI prognoza i simulacija scenarija' : 'AI Forecast & Scenario Simulation'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            {lang === 'SR' 
              ? 'Sedmodnevna prognoza potreba za vodom i analiza mogućih opterećenja sistema vodosnabdevanja.'
              : '7-day water demand forecast and analysis of potential water supply system loads.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <Info size={18} color="#0284c7" />
          <div style={{ fontSize: '0.8rem', color: '#334155' }}>
            <strong>{lang === 'SR' ? 'Eksperimentalni model:' : 'Experimental model:'}</strong> {lang === 'SR' ? 'Prototip koristi sintetičke podatke. Integracija sa stvarnim operativnim podacima predviđena je u narednoj fazi.' : 'Prototype uses synthetic data. Integration with real operational data is planned for the next phase.'}
          </div>
        </div>
      </div>

      {/* Top KPI kartice */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0284c7', fontSize: '0.75rem', fontWeight: '600' }}>
            <Calendar size={16} /> {lang === 'SR' ? 'HORIZONT PROGNOZE' : 'FORECAST HORIZON'}
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.25rem' }}>{lang === 'SR' ? '7 dana' : '7 days'}</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{lang === 'SR' ? 'AI model (MLP, backpropagation)' : 'AI model (MLP, backpropagation)'}</div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0284c7', fontSize: '0.75rem', fontWeight: '600' }}>
            <Droplets size={16} /> {lang === 'SR' ? 'PREDVIĐENA POTRAŽNJA (dan 1)' : 'PREDICTED DEMAND (day 1)'}
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.25rem' }}>100.000</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{lang === 'SR' ? 'm³/dan – mrežni ulaz' : 'm³/day – network inlet'}</div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontSize: '0.75rem', fontWeight: '600' }}>
            <Database size={16} /> {lang === 'SR' ? 'POČETNA REZERVA' : 'INITIAL RESERVE'}
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.25rem' }}>175.000</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{lang === 'SR' ? 'm³ – simulirano' : 'm³ – simulated'}</div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6366f1', fontSize: '0.75rem', fontWeight: '600' }}>
            <BarChart2 size={16} /> {lang === 'SR' ? 'PROIZVODNI KAPACITET' : 'PRODUCTION CAPACITY'}
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.25rem' }}>120.000</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{lang === 'SR' ? 'm³/dan – nominalno' : 'm³/day – nominal'}</div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d97706', fontSize: '0.75rem', fontWeight: '600' }}>
            <Activity size={16} /> {lang === 'SR' ? 'EKOLOŠKI INDIKATOR' : 'ECOLOGICAL INDICATOR'}
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '0.25rem' }}>{lang === 'SR' ? 'Nije ocenjen' : 'Not rated'}</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{lang === 'SR' ? 'Čeka referentne podatke' : 'Waiting for reference data'}</div>
        </div>
      </div>

      {/* Grid: AI Prognoza + Izbor scenarija */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* 1. AI prognoza potreba za vodom */}
        <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>
                {lang === 'SR' ? '1. AI prognoza potreba za vodom' : '1. AI Water Demand Forecast'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                {lang === 'SR' ? 'Predviđeni dnevni ulaz vode u distributivnu mrežu (m³/dan) na osnovu vremenske prognoze.' : 'Predicted daily water input into the distribution network (m³/day) based on weather forecast.'}
              </p>
            </div>
            <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '0.75rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
              {lang === 'SR' ? 'Neuronska mreža' : 'Neural Network'}
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
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickFormatter={(val, idx) => `${val}\n${forecastData[idx].date}`} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[60000, 140000]} />
                <Tooltip formatter={(value) => `${value.toLocaleString()} m³`} />
                <Area type="monotone" dataKey="upper" stroke="transparent" fill="url(#colorUncertainty)" />
                <Line type="monotone" dataKey="demand" stroke="#0284c7" strokeWidth={3} dot={{ r: 4 }} name={lang === 'SR' ? 'AI prognoza (osnovni scenario)' : 'AI forecast (base scenario)'} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ marginTop: '0.75rem', backgroundColor: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Info size={14} /> {lang === 'SR' ? 'Model treniran na sintetičkim istorijskim podacima. Rezultati demonstriraju metodologiju i ne predstavljaju zvaničnu prognozu.' : 'Model trained on synthetic historical data. Results demonstrate methodology and do not represent an official forecast.'}
          </div>
        </div>

        {/* 2. Izaberite scenario */}
        <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>
              {lang === 'SR' ? '2. Izaberite scenario' : '2. Select Scenario'}
            </h3>
            <button style={{ backgroundColor: 'transparent', border: 'none', color: '#0284c7', fontSize: '0.75rem', cursor: 'pointer' }}>
              {lang === 'SR' ? 'O scenarijima' : 'About scenarios'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            
            {/* Scenario 1 */}
            <div 
              onClick={() => setSelectedScenario('normal')}
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: selectedScenario === 'normal' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                backgroundColor: selectedScenario === 'normal' ? '#f0f9ff' : '#fff',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '700', fontSize: '0.875rem' }}>{lang === 'SR' ? 'Normalno' : 'Normal'}</span>
                {selectedScenario === 'normal' && <CheckCircle size={16} color="#0284c7" />}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{lang === 'SR' ? 'Osnovni uslovi' : 'Base conditions'}</div>
              <div style={{ fontSize: '0.7rem', color: '#334155', marginTop: '0.5rem' }}>{lang === 'SR' ? 'Predviđena potražnja iz AI modela' : 'AI model predicted demand'}</div>
              <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: '600' }}>{lang === 'SR' ? '100% kapacitet' : '100% capacity'}</div>
            </div>

            {/* Scenario 2 */}
            <div 
              onClick={() => setSelectedScenario('summer')}
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: selectedScenario === 'summer' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                backgroundColor: selectedScenario === 'summer' ? '#f0f9ff' : '#fff',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '700', fontSize: '0.875rem' }}>{lang === 'SR' ? 'Letnji maksimum' : 'Summer Peak'}</span>
                {selectedScenario === 'summer' && <CheckCircle size={16} color="#0284c7" />}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#d97706' }}>{lang === 'SR' ? '+15% potražnja' : '+15% demand'}</div>
              <div style={{ fontSize: '0.7rem', color: '#334155', marginTop: '0.5rem' }}>{lang === 'SR' ? 'Predviđena potražnja +15%' : 'Predicted demand +15%'}</div>
              <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: '600' }}>{lang === 'SR' ? '100% kapacitet' : '100% capacity'}</div>
            </div>

            {/* Scenario 3 */}
            <div 
              onClick={() => setSelectedScenario('reduced')}
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: selectedScenario === 'reduced' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                backgroundColor: selectedScenario === 'reduced' ? '#f0f9ff' : '#fff',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '700', fontSize: '0.875rem' }}>{lang === 'SR' ? 'Smanjena proizvodnja' : 'Reduced Production'}</span>
                {selectedScenario === 'reduced' && <CheckCircle size={16} color="#0284c7" />}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#dc2626' }}>{lang === 'SR' ? '-20% kapacitet' : '-20% capacity'}</div>
              <div style={{ fontSize: '0.7rem', color: '#334155', marginTop: '0.5rem' }}>{lang === 'SR' ? 'Predviđena potražnja iz AI modela' : 'AI model predicted demand'}</div>
              <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: '600' }}>{lang === 'SR' ? '80% kapacitet' : '80% capacity'}</div>
            </div>

            {/* Scenario 4 */}
            <div 
              onClick={() => setSelectedScenario('stress')}
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: selectedScenario === 'stress' ? '2px solid #dc2626' : '1px solid #e2e8f0',
                backgroundColor: selectedScenario === 'stress' ? '#fef2f2' : '#fff',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '700', fontSize: '0.875rem', color: '#dc2626' }}>{lang === 'SR' ? 'Kombinovani stres' : 'Combined Stress'}</span>
                {selectedScenario === 'stress' && <CheckCircle size={16} color="#dc2626" />}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#dc2626' }}>{lang === 'SR' ? '+15% potražnja, -20% kapacitet' : '+15% demand, -20% capacity'}</div>
              <div style={{ fontSize: '0.7rem', color: '#334155', marginTop: '0.3rem' }}>{lang === 'SR' ? 'Predviđena potražnja +15%' : 'Predicted demand +15%'}</div>
              <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: '600' }}>{lang === 'SR' ? '80% kapacitet' : '80% capacity'}</div>
            </div>

          </div>
        </div>

      </div>

      {/* Grid: Rezultati simulacije & Ključni rezultati */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* 3. Rezultati simulacije */}
        <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>
                {lang === 'SR' ? '3. Rezultati simulacije za izabrani scenario' : '3. Simulation Results for Selected Scenario'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                {lang === 'SR' ? 'Dnevni bilans proizvodnje, isporuke, rezervi i nezadovoljenih potreba.' : 'Daily balance of production, delivery, reserves, and unmet needs.'}
              </p>
            </div>
            <select style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.75rem' }}>
              <option>{lang === 'SR' ? 'Prikaz: Rezerve' : 'View: Reserves'}</option>
            </select>
          </div>

          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scenarioComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 300000]} />
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

        {/* Ključni rezultati */}
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
              <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.2rem', color: currentScenario.unmetDemand !== '0 m³' ? '#dc2626' : '#0f172a' }}>
                {currentScenario.unmetDemand}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
                {currentScenario.unmetStatus}
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{lang === 'SR' ? 'Prosečna dnevna proizvodnja' : 'Average daily production'}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.2rem' }}>{currentScenario.avgProduction}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>{currentScenario.prodCapacity}</div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{lang === 'SR' ? 'Prosečna dnevna potražnja' : 'Average daily demand'}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.2rem' }}>{currentScenario.avgDemand}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>{lang === 'SR' ? 'Prema AI prognozi' : 'According to AI forecast'}</div>
            </div>

          </div>
        </div>

      </div>

      {/* Grid: Objašnjenje + Izvori podataka */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        {/* 4. Objašnjenje i preporuke */}
        <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Zap size={18} color="#0284c7" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>
              {lang === 'SR' ? '4. Objašnjenje i preporuke' : '4. Explanation & Recommendations'}
            </h3>
            <span style={{ fontSize: '0.7rem', backgroundColor: '#eff6ff', color: '#0284c7', padding: '0.1rem 0.5rem', borderRadius: '4px', marginLeft: 'auto' }}>
              {lang === 'SR' ? 'AI objašnjenje' : 'AI Explanation'}
            </span>
          </div>

          <div style={{ fontSize: '0.8rem', color: '#334155', marginBottom: '0.75rem' }}>
            <strong>{currentScenario.title} {lang === 'SR' ? 'scenario:' : 'scenario:'}</strong> {currentScenario.explanation}
          </div>

          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={16} /> <strong>{lang === 'SR' ? 'Preporuka:' : 'Recommendation:'}</strong> {currentScenario.recommendation}
          </div>
        </div>

        {/* Izvori podataka i pouzdanost */}
        <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 0.75rem 0' }}>
            {lang === 'SR' ? 'Izvori podataka i pouzdanost' : 'Data Sources & Reliability'}
          </h3>

          <div style={{ fontSize: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 1rem' }}>
            <div>{lang === 'SR' ? 'Meteorološki podaci:' : 'Weather data:'} <span style={{ color: '#059669', fontWeight: '600' }}>{lang === 'SR' ? 'Planirano (stvarni)' : 'Planned (actual)'}</span></div>
            <div>{lang === 'SR' ? 'Hidrološki podaci Dunava:' : 'Danube hydrological data:'} <span style={{ color: '#059669', fontWeight: '600' }}>{lang === 'SR' ? 'Planirano (stvarni)' : 'Planned (actual)'}</span></div>
            <div>{lang === 'SR' ? 'Operativni podaci vodovoda:' : 'Water utility operational data:'} <span style={{ color: '#d97706', fontWeight: '600' }}>{lang === 'SR' ? 'Sintetički (demo)' : 'Synthetic (demo)'}</span></div>
            <div>{lang === 'SR' ? 'AI prognoza:' : 'AI forecast:'} <span style={{ color: '#6366f1', fontWeight: '600' }}>{lang === 'SR' ? 'Eksperimentalni' : 'Experimental'}</span></div>
            <div>{lang === 'SR' ? 'Simulacija scenarija:' : 'Scenario simulation:'} <span style={{ color: '#64748b', fontWeight: '600' }}>{lang === 'SR' ? 'Hipotetički' : 'Hypothetical'}</span></div>
            <div>{lang === 'SR' ? 'GIS podaci (objekti, populacija):' : 'GIS data (facilities, population):'} <span style={{ color: '#059669', fontWeight: '600' }}>{lang === 'SR' ? 'Stvarni / javni izvori' : 'Actual / public sources'}</span></div>
          </div>
        </div>

      </div>

    </div>
  );
}
