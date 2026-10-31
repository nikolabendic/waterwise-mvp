import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Calendar, Droplets, Database, Activity,
  CheckCircle, Info, BarChart2, Zap, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine
} from 'recharts';

const API_BASE_URL = 'http://82.117.203.34:8000/api/v1';

// Ključ scenarija na stranici -> ključ u API-ju
const API_SCENARIO_KEY = { normal: 'normal', summer: 'peak', reduced: 'reduced', stress: 'combined' };

export default function AiForecastSimulation() {
  const context = useOutletContext();
  const lang = context?.lang || 'SR';
  const locale = lang === 'SR' ? 'sr-Latn-RS' : 'en-GB';

  const [selectedScenario, setSelectedScenario] = useState('normal');
  const [forecastData, setForecastData] = useState([]);
  const [modelInfo, setModelInfo] = useState(null);
  const [isHealthOk, setIsHealthOk] = useState(true);

  const [waterBalanceData, setWaterBalanceData] = useState(null);
  const [balanceError, setBalanceError] = useState(false);
  const [reserveChartData, setReserveChartData] = useState([]);
  const [scenariosList, setScenariosList] = useState([]);

  const fmtN = (v) => (v === null || v === undefined || Number.isNaN(Number(v))) ? '—' : Math.round(Number(v)).toLocaleString(locale);
  const fmtShort = (iso) => iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.` : '';
  const fmtFull = (iso) => iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}.` : '';

  useEffect(() => {
    // 1. Provera zdravlja API-ja
    fetch(`${API_BASE_URL}/health/`)
      .then(res => res.json())
      .then(data => { if (data && data.status !== 'ok') setIsHealthOk(false); })
      .catch(() => setIsHealthOk(false));

    // 2. Podaci o modelu i metrike
    fetch(`${API_BASE_URL}/water-demand/forecast/`)
      .then(res => res.json())
      .then(data => { if (data && data.forecast) setModelInfo(data); })
      .catch(err => console.error('Greska pri povlacenju prognoze:', err));

    // 3. Definicije scenarija
    fetch(`${API_BASE_URL}/water-balance/scenarios/`)
      .then(res => res.json())
      .then(data => { if (data && Array.isArray(data.scenarios)) setScenariosList(data.scenarios); })
      .catch(err => console.error('Greska pri povlacenju definicija scenarija:', err));
  }, []);

  // 4. Vodni bilans za izabrani scenario
  useEffect(() => {
    setBalanceError(false);
    fetch(`${API_BASE_URL}/water-balance/?scenario=${API_SCENARIO_KEY[selectedScenario]}&period=7d`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setWaterBalanceData(data);
        const daily = Array.isArray(data?.daily) ? data.daily : [];
        setForecastData(daily.map(item => ({
          date: item.date,
          label: fmtShort(item.date),
          demand: Math.round(item.required_m3 ?? item.forecast_m3 ?? 0)
        })));
        setReserveChartData(daily.map(item => ({
          date: item.date,
          label: fmtShort(item.date),
          storage: Math.round(item.storage_end_m3 ?? 0)
        })));
      })
      .catch(err => {
        console.error('Greska pri povlacenju vodnog bilansa:', err);
        setBalanceError(true);
        setWaterBalanceData(null);
        setForecastData([]);
        setReserveChartData([]);
      });
  }, [selectedScenario]);

  const modelType = waterBalanceData?.model_type || modelInfo?.model_type || null;
  const modelStatus = waterBalanceData?.model_status || modelInfo?.model_status || null;
  const rfTest = modelInfo?.test?.random_forest;
  const baselineTest = modelInfo?.test?.weekday_baseline;

  const dailyArray = waterBalanceData?.daily || [];
  const hasDaily = dailyArray.length > 0;
  const initialStorage = waterBalanceData?.parameters?.initial_storage_m3 ?? null;
  const maxStorage = waterBalanceData?.parameters?.max_storage_m3 ?? null;
  const summaryStorageVal = waterBalanceData?.summary?.storage_end_m3 ?? null;
  const unmetDemandVal = waterBalanceData?.summary?.total_unmet_m3 ?? null;

  const avgProductionVal = hasDaily ? dailyArray.reduce((a, c) => a + (c.production_m3 || 0), 0) / dailyArray.length : null;
  const avgDemandVal = hasDaily ? dailyArray.reduce((a, c) => a + (c.required_m3 ?? c.forecast_m3 ?? 0), 0) / dailyArray.length : null;
  const reserveDiffPct = (initialStorage && summaryStorageVal !== null)
    ? Math.round(((summaryStorageVal - initialStorage) / initialStorage) * 100)
    : null;

  const demandFactor = waterBalanceData?.assumptions?.demand_factor ?? null;
  const capacityFactor = waterBalanceData?.assumptions?.capacity_factor ?? null;

  const balanceState = (!waterBalanceData || summaryStorageVal === null || initialStorage === null)
    ? null
    : (unmetDemandVal > 0 ? 'deficit' : (summaryStorageVal < initialStorage ? 'declining' : 'stable'));

  const pctLabel = (factor, positive, negative) => {
    if (factor === null || factor === undefined) return '';
    const p = Math.round((factor - 1) * 100);
    if (p === 0) return '';
    return p > 0 ? `+${p}% ${positive}` : `${p}% ${negative}`;
  };
  const describeScenario = (apiKey) => {
    const s = scenariosList.find(x => x.id === apiKey);
    if (!s) return '';
    const parts = [
      pctLabel(s.demand_factor, lang === 'SR' ? 'potražnja' : 'demand', lang === 'SR' ? 'potražnja' : 'demand'),
      pctLabel(s.capacity_factor, lang === 'SR' ? 'kapacitet' : 'capacity', lang === 'SR' ? 'kapacitet' : 'capacity')
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : (lang === 'SR' ? 'Osnovni uslovi' : 'Base conditions');
  };

  const scenarioTitles = {
    normal: lang === 'SR' ? 'Normalno' : 'Normal',
    summer: lang === 'SR' ? 'Letnji maksimum' : 'Summer Peak',
    reduced: lang === 'SR' ? 'Smanjena proizvodnja' : 'Reduced Production',
    stress: lang === 'SR' ? 'Kombinovani stres' : 'Combined Stress'
  };
  const currentTitle = scenarioTitles[selectedScenario];

  const getScenarioColor = () => {
    switch (selectedScenario) {
      case 'summer': return '#d97706';
      case 'reduced': return '#059669';
      case 'stress': return '#dc2626';
      default: return '#0284c7';
    }
  };

  const assumptionsText = (demandFactor !== null && capacityFactor !== null)
    ? (lang === 'SR'
        ? `Pretpostavke scenarija: potražnja ×${demandFactor}, proizvodni kapacitet ×${capacityFactor}.`
        : `Scenario assumptions: demand ×${demandFactor}, production capacity ×${capacityFactor}.`)
    : '';

  let resultText = '';
  if (balanceState === 'stable') {
    resultText = lang === 'SR'
      ? `Rezerva na kraju perioda je ${fmtN(summaryStorageVal)} m³ (${reserveDiffPct >= 0 ? '+' : ''}${reserveDiffPct}% u odnosu na početnih ${fmtN(initialStorage)} m³). Nema nezadovoljenih potreba.`
      : `Reserve at the end of the period is ${fmtN(summaryStorageVal)} m³ (${reserveDiffPct >= 0 ? '+' : ''}${reserveDiffPct}% vs initial ${fmtN(initialStorage)} m³). No unmet demand.`;
  } else if (balanceState === 'declining') {
    resultText = lang === 'SR'
      ? `Rezerva opada sa ${fmtN(initialStorage)} na ${fmtN(summaryStorageVal)} m³ (${reserveDiffPct}%), ali u ovih 7 dana nema nezadovoljenih potreba.`
      : `Reserve declines from ${fmtN(initialStorage)} to ${fmtN(summaryStorageVal)} m³ (${reserveDiffPct}%), but there is no unmet demand in these 7 days.`;
  } else if (balanceState === 'deficit') {
    resultText = lang === 'SR'
      ? `Nezadovoljene potrebe iznose ${fmtN(unmetDemandVal)} m³, a rezerva na kraju perioda je ${fmtN(summaryStorageVal)} m³.`
      : `Unmet demand is ${fmtN(unmetDemandVal)} m³, and the reserve at the end of the period is ${fmtN(summaryStorageVal)} m³.`;
  }
  const stateStyle = {
    stable: { bg: '#f0fdf4', border: '#bbf7d0', color: '#166534' },
    declining: { bg: '#fffbeb', border: '#fde68a', color: '#92400e' },
    deficit: { bg: '#fef2f2', border: '#fecaca', color: '#991b1b' }
  }[balanceState] || { bg: '#f8fafc', border: '#e2e8f0', color: '#64748b' };

  const allLimitations = [
    ...(waterBalanceData?.limitations || []),
    ...((modelInfo?.limitations || []).filter(l => !(waterBalanceData?.limitations || []).includes(l)))
  ];

  const scenarioCards = [
    { key: 'normal', apiKey: 'normal', color: '#0284c7', bg: '#f0f9ff' },
    { key: 'summer', apiKey: 'peak', color: '#d97706', bg: '#fffbeb' },
    { key: 'reduced', apiKey: 'reduced', color: '#059669', bg: '#f0fdf4' },
    { key: 'stress', apiKey: 'combined', color: '#dc2626', bg: '#fef2f2' }
  ];

  return (
    <div className="ai-forecast-container" style={{ padding: '1.5rem 2rem', maxWidth: '1440px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', boxSizing: 'border-box' }}>

      <style>{`
        @media (max-width: 960px) {
          .responsive-grid-split { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .ai-forecast-container { padding: 0.75rem 1rem !important; }
          .stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ZAGLAVLJE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: '#0f172a' }}>
            {lang === 'SR' ? 'AI prognoza i simulacija scenarija' : 'AI Forecast & Scenario Simulation'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            {lang === 'SR'
              ? `Model: ${modelType || '—'} (${modelStatus || '—'}) – predikcija mrežnog ulaza u m³/dan, na sintetičkim podacima.`
              : `Model: ${modelType || '—'} (${modelStatus || '—'}) – network input prediction in m³/day, on synthetic data.`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {!isHealthOk && (
            <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '600', border: '1px solid #fecaca' }}>
              {lang === 'SR' ? 'API servis nedostupan' : 'API service unavailable'}
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <Info size={18} color="#0284c7" />
            <div style={{ fontSize: '0.8rem', color: '#334155' }}>
              <strong>{lang === 'SR' ? 'Random Forest MAE (test):' : 'Random Forest MAE (test):'}</strong> {fmtN(rfTest?.mae_m3_per_day)} m³/d
              {baselineTest && <span style={{ color: '#94a3b8' }}> · baseline {fmtN(baselineTest.mae_m3_per_day)}</span>}
            </div>
          </div>
        </div>
      </div>

      {balanceError && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
          {lang === 'SR' ? 'Podaci o vodnom bilansu trenutno nisu dostupni.' : 'Water balance data is currently unavailable.'}
        </div>
      )}

      {/* METRIKE MODELA */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0284c7', fontSize: '0.75rem', fontWeight: '600' }}>
            <Calendar size={16} /> {lang === 'SR' ? 'HORIZONT PROGNOZE' : 'FORECAST HORIZON'}
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.25rem' }}>
            {(waterBalanceData?.period_days ?? modelInfo?.horizon_days) ? `${waterBalanceData?.period_days ?? modelInfo?.horizon_days} ${lang === 'SR' ? 'dana' : 'days'}` : '—'}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
            {hasDaily ? `${fmtShort(dailyArray[0].date)} – ${fmtShort(dailyArray[dailyArray.length - 1].date)}` : `Target: ${modelInfo?.target || '—'}`}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0284c7', fontSize: '0.75rem', fontWeight: '600' }}>
            <Droplets size={16} /> {lang === 'SR' ? 'PREDVIĐENA POTRAŽNJA (DAN 1)' : 'PREDICTED DEMAND (DAY 1)'}
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.25rem' }}>
            {forecastData[0] ? fmtN(forecastData[0].demand) : '—'}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>m³/{lang === 'SR' ? 'dan' : 'day'}{forecastData[0] ? ` · ${forecastData[0].label}` : ''}</div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontSize: '0.75rem', fontWeight: '600' }}>
            <Database size={16} /> {lang === 'SR' ? 'POČETNA REZERVA' : 'INITIAL RESERVE'}
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.25rem' }}>{fmtN(initialStorage)}</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>m³{maxStorage ? ` · max ${fmtN(maxStorage)}` : ''}</div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6366f1', fontSize: '0.75rem', fontWeight: '600' }}>
            <BarChart2 size={16} /> {lang === 'SR' ? 'TEST (MAE / RMSE)' : 'TEST (MAE / RMSE)'}
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.25rem' }}>
            {rfTest ? `${fmtN(rfTest.mae_m3_per_day)} / ${fmtN(rfTest.rmse_m3_per_day)}` : '—'}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
            m³/{lang === 'SR' ? 'dan' : 'day'}{baselineTest ? ` · baseline ${fmtN(baselineTest.mae_m3_per_day)} / ${fmtN(baselineTest.rmse_m3_per_day)}` : ''}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d97706', fontSize: '0.75rem', fontWeight: '600' }}>
            <Activity size={16} /> {lang === 'SR' ? 'STATUS MODELA' : 'MODEL STATUS'}
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '0.25rem', color: modelStatus ? '#0284c7' : '#94a3b8' }}>{modelStatus || '—'}</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Data: {waterBalanceData?.data_type || modelInfo?.trained_on || '—'}</div>
        </div>
      </div>

      {/* SEKCIJA 1 I 2 */}
      <div className="responsive-grid-split" style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

        {/* GRAFIK 1 (POTRAŽNJA) */}
        <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>
                {lang === 'SR' ? `1. AI prognoza potreba (${currentTitle})` : `1. AI Demand Forecast (${currentTitle})`}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                {lang === 'SR' ? 'Predviđeni dnevni ulaz vode u mrežu za izabrani scenario.' : 'Predicted daily network water input for the selected scenario.'}
              </p>
            </div>
            <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '0.75rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
              {modelType || '—'}
            </span>
          </div>

          <div style={{ width: '100%', height: '240px' }}>
            {forecastData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.85rem', border: '1px dashed #e2e8f0', borderRadius: '8px' }}>
                {lang === 'SR' ? 'Podaci trenutno nisu dostupni' : 'Data currently unavailable'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={getScenarioColor()} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={getScenarioColor()} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} allowDecimals={false} tickFormatter={(v) => Number(v).toLocaleString(locale)} />
                  <Tooltip
                    labelFormatter={(label, payload) => fmtFull(payload?.[0]?.payload?.date) || label}
                    formatter={(value) => [`${Number(value).toLocaleString(locale)} m³`, lang === 'SR' ? 'Prognoza' : 'Forecast']}
                  />
                  <Area type="monotone" dataKey="demand" stroke={getScenarioColor()} strokeWidth={3} fill="url(#colorDemand)" dot={{ r: 4, fill: getScenarioColor() }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* IZBOR SCENARIJA */}
        <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>
              {lang === 'SR' ? '2. Izaberite scenario' : '2. Select Scenario'}
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {scenarioCards.map(({ key, apiKey, color, bg }) => {
              const selected = selectedScenario === key;
              return (
                <div
                  key={key}
                  onClick={() => setSelectedScenario(key)}
                  style={{ padding: '0.75rem', borderRadius: '8px', border: selected ? `2px solid ${color}` : '1px solid #e2e8f0', backgroundColor: selected ? bg : '#fff', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.875rem', color: key === 'normal' ? '#0f172a' : color }}>{scenarioTitles[key]}</span>
                    {selected && <CheckCircle size={16} color={color} />}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: key === 'normal' ? '#64748b' : color, marginTop: '0.15rem' }}>
                    {describeScenario(apiKey) || '—'}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.75rem' }}>
            {lang === 'SR'
              ? 'Scenario se računa na zahtev iz unapred izračunate RF prognoze (faktori potražnje i kapaciteta).'
              : 'The scenario is computed on request from the precomputed RF forecast (demand and capacity factors).'}
          </div>
        </div>
      </div>

      {/* SEKCIJA 3 */}
      <div className="responsive-grid-split" style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

        {/* GRAFIK 3 (STANJE REZERVE VODE) */}
        <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>
              {lang === 'SR' ? `3. Stanje rezerve vode (${currentTitle})` : `3. Water Reserve (${currentTitle})`}
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
              {lang === 'SR' ? 'Rezerva na kraju svakog dana; isprekidana linija je početna rezerva.' : 'Reserve at the end of each day; dashed line is the initial reserve.'}
            </p>
          </div>

          <div style={{ width: '100%', height: '220px' }}>
            {reserveChartData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.85rem', border: '1px dashed #e2e8f0', borderRadius: '8px' }}>
                {lang === 'SR' ? 'Podaci trenutno nisu dostupni' : 'Data currently unavailable'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reserveChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} allowDecimals={false} tickFormatter={(v) => Number(v).toLocaleString(locale)} />
                  <Tooltip
                    labelFormatter={(label, payload) => fmtFull(payload?.[0]?.payload?.date) || label}
                    formatter={(val) => [`${Number(val).toLocaleString(locale)} m³`, lang === 'SR' ? 'Rezerva' : 'Reserve']}
                  />
                  {initialStorage !== null && <ReferenceLine y={initialStorage} stroke="#94a3b8" strokeDasharray="4 4" />}
                  <Line type="monotone" dataKey="storage" name={currentTitle} stroke={getScenarioColor()} strokeWidth={2.5} dot={{ r: 4, fill: getScenarioColor() }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* KLJUČNI REZULTATI */}
        <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 1rem 0' }}>
            {lang === 'SR' ? `Ključni rezultati (${currentTitle})` : `Key Results (${currentTitle})`}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{lang === 'SR' ? 'Rezerva nakon 7 dana' : 'Reserve after 7 days'}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.2rem' }}>
                {summaryStorageVal === null ? '—' : `${fmtN(summaryStorageVal)} m³`}
              </div>
              <div style={{ fontSize: '0.7rem', color: reserveDiffPct === null ? '#94a3b8' : (reserveDiffPct >= 0 ? '#059669' : '#dc2626'), marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                {reserveDiffPct === null ? '—' : (
                  <>
                    {reserveDiffPct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {reserveDiffPct >= 0 ? '+' : ''}{reserveDiffPct}% {lang === 'SR' ? 'u odnosu na početak' : 'from initial'}
                  </>
                )}
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{lang === 'SR' ? 'Nezadovoljene potrebe' : 'Unmet demand'}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.2rem', color: unmetDemandVal > 0 ? '#dc2626' : '#0f172a' }}>
                {unmetDemandVal === null ? '—' : `${fmtN(unmetDemandVal)} m³`}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
                {unmetDemandVal === null ? '' : (unmetDemandVal === 0
                  ? (lang === 'SR' ? 'Sistem zadovoljava sve potrebe' : 'System meets all demand')
                  : (lang === 'SR' ? 'Postoji deficit u snabdevanju' : 'Supply deficit present'))}
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{lang === 'SR' ? 'Prosečna proizvodnja' : 'Average production'}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.2rem' }}>
                {avgProductionVal === null ? '—' : `${fmtN(avgProductionVal)} m³/${lang === 'SR' ? 'dan' : 'day'}`}
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{lang === 'SR' ? 'Prosečna potražnja' : 'Average demand'}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.2rem' }}>
                {avgDemandVal === null ? '—' : `${fmtN(avgDemandVal)} m³/${lang === 'SR' ? 'dan' : 'day'}`}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* TUMAČENJE REZULTATA I OGRANIČENJA */}
      <div className="responsive-grid-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Zap size={18} color="#0284c7" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>
              {lang === 'SR' ? '4. Tumačenje rezultata' : '4. Result Interpretation'}
            </h3>
          </div>

          {assumptionsText && (
            <div style={{ fontSize: '0.8rem', color: '#334155', marginBottom: '0.75rem' }}>
              {assumptionsText}
            </div>
          )}

          <div style={{ backgroundColor: stateStyle.bg, border: `1px solid ${stateStyle.border}`, padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', color: stateStyle.color, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <CheckCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span><strong>{lang === 'SR' ? 'Rezultat simulacije:' : 'Simulation result:'}</strong> {resultText || '—'}</span>
          </div>

          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.75rem' }}>
            {lang === 'SR'
              ? 'Ilustrativni maseni bilans na sintetičkim podacima, nije hidraulička simulacija ni potvrđen prekid snabdevanja.'
              : 'Illustrative mass balance on synthetic data, not a hydraulic simulation or a confirmed supply interruption.'}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 0.75rem 0' }}>
            {lang === 'SR' ? 'Ograničenja i metapodaci modela' : 'Limitations & Model Metadata'}
          </h3>

          <ul style={{ fontSize: '0.75rem', color: '#64748b', paddingLeft: '1rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {allLimitations.length === 0 && <li>—</li>}
            {allLimitations.map((limit, idx) => <li key={idx}>{limit}</li>)}
            <li>Model Type: <strong>{modelType || '—'}</strong></li>
            <li>Trained On: <strong>{waterBalanceData?.trained_on || modelInfo?.trained_on || '—'}</strong></li>
            <li>Weather: <strong>{modelInfo?.future_weather_type || '—'}</strong></li>
            <li>Execution: <strong>{modelInfo?.execution_mode || '—'}</strong></li>
          </ul>
        </div>

      </div>

    </div>
  );
}
