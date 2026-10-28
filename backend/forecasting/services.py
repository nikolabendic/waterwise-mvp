"""Pure business logic; no Django imports. Numbers are DEMONSTRATIONAL."""
import json
import math
from pathlib import Path

SCENARIOS = {
 'normal': {'label':'Normalno', 'demand_factor':1.0, 'capacity_factor':1.0},
 'peak': {'label':'Letnji maksimum', 'demand_factor':1.15, 'capacity_factor':1.0},
 'reduced': {'label':'Smanjena proizvodnja', 'demand_factor':1.0, 'capacity_factor':0.8},
 'combined': {'label':'Kombinovani stres', 'demand_factor':1.15, 'capacity_factor':0.8},
}
PARAMETERS = {'initial_storage_m3':175000.0, 'max_storage_m3':250000.0, 'base_capacity_m3_per_day':120000.0, 'refill_factor':0.15}
LIMITATIONS = [
 'Synthetic utility history; no validation on actual Novi Sad water utility records.',
 'Illustrative mass-balance, not hydraulic simulation or confirmed supply interruption.',
 'The additional +15% peak stress is applied on top of the weather-informed baseline.',
]

def load_forecast(artifact_dir):
    path = Path(artifact_dir) / 'forecast.json'
    if not path.is_file(): raise FileNotFoundError(f'Missing forecast artifact: {path}')
    data = json.loads(path.read_text(encoding='utf-8'))
    rows = data.get('forecast', [])
    if len(rows) != 7: raise ValueError('Forecast must contain exactly 7 days')
    dates = [r['date'] for r in rows]
    from datetime import date, timedelta
    parsed = [date.fromisoformat(x) for x in dates]
    if any(parsed[i+1]-parsed[i] != timedelta(days=1) for i in range(6)):
        raise ValueError('Forecast dates must be consecutive')
    for row in rows:
        val = float(row['forecast_m3'])
        if not math.isfinite(val) or val < 0: raise ValueError('Invalid forecast value')
    return data

def simulate(forecast_rows, scenario_id, parameters=None):
    if scenario_id not in SCENARIOS: raise ValueError('Unknown scenario')
    p = dict(PARAMETERS)
    if parameters: p.update(parameters)
    storage = float(p['initial_storage_m3'])
    maximum = float(p['max_storage_m3'])
    capacity = float(p['base_capacity_m3_per_day']) * SCENARIOS[scenario_id]['capacity_factor']
    alpha = float(p['refill_factor'])
    if not (0 <= storage <= maximum and maximum > 0 and capacity >= 0 and 0 <= alpha <= 1):
        raise ValueError('Invalid model parameters')
    factor = SCENARIOS[scenario_id]['demand_factor']
    rows = []
    total_unmet = 0.0
    for item in forecast_rows:
        base = float(item['forecast_m3'])
        if not math.isfinite(base) or base < 0: raise ValueError('Invalid demand')
        required = base * factor
        production = min(capacity, required + alpha * max(0, maximum - storage), required + maximum - storage)
        delivered = min(required, storage + production)
        unmet = max(0.0, required - delivered)
        next_storage = min(maximum, max(0.0, storage + production - delivered))
        if abs(storage + production - delivered - next_storage) > 1e-6:
            raise ArithmeticError('Mass balance violated')
        rows.append({
            'date':item['date'], 'forecast_m3':round(base,2), 'required_m3':round(required,2),
            'capacity_m3_per_day':round(capacity,2), 'production_m3':round(production,2),
            'delivered_m3':round(delivered,2), 'storage_end_m3':round(next_storage,2),
            'unmet_m3':round(unmet,2),
        })
        total_unmet += unmet
        storage = next_storage
    return {
      'scenario':scenario_id, 'label':SCENARIOS[scenario_id]['label'],
      'period_days':len(rows), 'data_type':'synthetic',
      'units':{'daily_flows':'m3/day', 'storage':'m3', 'total_unmet':'m3'},
      'parameters':p, 'assumptions':SCENARIOS[scenario_id], 'daily':rows,
      'summary':{'storage_end_m3':round(storage,2),'total_unmet_m3':round(total_unmet,2)},
      'limitations':LIMITATIONS,
    }

def comparison(forecast_rows):
    sims = {k:simulate(forecast_rows,k) for k in SCENARIOS}
    return {'data_type':'synthetic','units':{'storage':'m3'},
      'scenarios':[{'id':k,**v} for k,v in SCENARIOS.items()],
      'daily':[{'date':r['date'],**{key:sims[key]['daily'][i]['storage_end_m3'] for key in SCENARIOS}}
               for i,r in enumerate(forecast_rows)],
      'summary':{key:sims[key]['summary'] for key in SCENARIOS},'limitations':LIMITATIONS}
