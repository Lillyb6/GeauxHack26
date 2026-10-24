import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from './api';
import EquipmentSummary from './EquipmentSummary';
import EvidenceList from './EvidenceList';
const controls = [
 ['crew_size','Crew members',1,12,1],['duration_days','Mission duration · Earth days',1,180,1],
 ['oxygen_kg','Initial oxygen · kg',0,10000,1],['water_kg','Initial water · kg',0,100000,10],
 ['battery_kwh','Battery capacity / initial charge · kWh',0,10000,10],['generation_kw','Continuous external power · kW',0,100,0.5],
 ['oxygen_capacity_kg_day','Electrolyzer output · kg O₂/day',0,30,0.1],['recycling_fraction','Effective potable-water recovery · fraction',0,0.98,0.01],
 ['other_load_kw','Other habitat load · kW (design input)',0,100,0.1],
 ['recycler_power_kw','Recycler load · kW (ISS proxy)',0,100,0.001],
 ['electrolyzer_kwh_kg_oxygen','Electrolyzer · kWh/kg O₂ (DOE proxy)',0.001,100,0.001],
 ['heat_loss_kw_k','Conductance · kW/K (unvalidated design)',0.001,10,0.001],
 ['interior_temperature_c','Interior setpoint · °C (design choice)',10,30,0.5],
 ['hvac_cop','HVAC COP (unvalidated design)',0.1,10,0.1],
];
function Trend({result, field, label, color}) {
 return <section className="panel chart"><h3>{label}</h3><p>Simulated inventory · end of each hour</p><div role="img" aria-label={`${label} across ${result.evaluated_hours} simulated hours`} style={{height:200}}><ResponsiveContainer width="100%" height="100%"><LineChart data={result.readings}><CartesianGrid stroke="#233445" strokeDasharray="3 5"/><XAxis dataKey="hour" stroke="#99aabd" tickLine={false} minTickGap={40} label={{value:'Hours',position:'insideBottomRight',offset:-2}}/><YAxis stroke="#99aabd" width={48}/><Tooltip contentStyle={{background:'#12202d',border:'1px solid #375166',borderRadius:8}} formatter={v=>Number(v).toFixed(2)} labelFormatter={h=>`Hour ${h}`}/><Line dataKey={field} name={label} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false}/></LineChart></ResponsiveContainer></div></section>
}
export default function App() {
 const [equipment,setEquipment]=useState([]), [environments,setEnvironments]=useState([]), [form,setForm]=useState(null), [result,setResult]=useState(null), [reference,setReference]=useState(null), [error,setError]=useState(''), [loading,setLoading]=useState(false);
 useEffect(()=>{Promise.all([api('/environments'),api('/model-reference'),api('/equipment')]).then(([envs,ref,catalog])=>{setEquipment(catalog);setEnvironments(envs);setReference(ref);setForm(ref.default_request);}).catch(()=>setError('Cannot reach the updated API. Start or restart the FastAPI backend on port 8000, then refresh.'));},[]);
 const env = environments.find(e=>e.id===form?.environment_id);
 const stale = result && JSON.stringify(result.request)!==JSON.stringify(form);
 const catalogMode = Boolean(form?.oxygen_equipment_id);
 const selectedEquipment = equipment.find(item=>item.id===form?.oxygen_equipment_id);
 const preview = selectedEquipment && form.oxygen_equipment_quantity !== '' ? {
   ...selectedEquipment,
   quantity: form.oxygen_equipment_quantity,
   oxygen_output_kg_day: selectedEquipment.oxygen_output_kg_day == null ? null : selectedEquipment.oxygen_output_kg_day * form.oxygen_equipment_quantity,
   electrical_power_kw: selectedEquipment.electrical_power_kw == null ? null : selectedEquipment.electrical_power_kw * form.oxygen_equipment_quantity,
   known_hardware_mass_kg: selectedEquipment.hardware_mass_kg == null ? null : selectedEquipment.hardware_mass_kg * form.oxygen_equipment_quantity,
 } : null;
 const liveEvidence = reference ? Object.fromEntries(Object.entries(reference.parameters)
   .filter(([key])=>!catalogMode || key!=='electrolyzer_kwh_kg_oxygen')
   .map(([key,p])=>[key,{...p,value:form?.[key] ?? p.value,
      classification:form?.[key] !== undefined && form[key] !== p.value ? 'user_override' : p.classification}])) : {};

 async function run(e) {e.preventDefault();setLoading(true);setError('');try{setResult(await api('/simulate',form));}catch(err){setError(err.message);}finally{setLoading(false);}}
 if (!form) return <main className="shell"><h1>Beyond Earth</h1><p role="status">{error || 'Loading research references…'}</p></main>;
 return <div className="shell">
  <header><a className="brand" href="#main"><span className="mark">✦</span> BEYOND EARTH <small>HABITAT INTELLIGENCE</small></a><span className="badge">EXPLORATORY MODEL / 0.2</span></header>
  <main id="main"><div className="intro"><div><p className="eyebrow">GEAUXHACK 2026 / MISSION DESIGN LAB</p><h1>A foothold beyond Earth.</h1><p className="subtitle">Design a habitat. Trace its limits. Understand the tradeoffs.</p></div><div className="mission-tag">01—03<br/><span>ENVIRONMENTS ONLINE</span></div></div>
  <nav aria-label="Select environment" className="planets">{environments.map((p,i)=><button key={p.id} aria-pressed={form.environment_id===p.id} onClick={()=>setForm({...form,environment_id:p.id})} className={form.environment_id===p.id?'planet active':'planet'}><span className={`orb ${p.id}`} aria-hidden="true"/><span><small>0{i+1} / {p.kind}</small><strong>{p.name}</strong></span><span className="arrow" aria-hidden="true">↗</span></button>)}</nav>
  {error && <p role="alert" className="alert">{error}</p>}
  {env && <section className="environment panel"><div><p className="eyebrow">PUBLISHED REFERENCE / NOT LIVE TELEMETRY</p><h2>{env.name} surface environment</h2><p>{env.atmosphere}</p><a href={env.source} target="_blank" rel="noreferrer">Scientific reference ↗</a></div><dl><div><dt>Temperature</dt><dd>{env.temperature_c} <small>°C</small></dd></div><div><dt>Pressure</dt><dd>{env.pressure_kpa.toLocaleString()} <small>kPa</small></dd></div><div><dt>Gravity</dt><dd>{env.gravity_ms2} <small>m/s²</small></dd></div></dl><p className="risk">{env.reference_context} {env.risk} {env.resources}</p></section>}
  <div className="workspace"><form className="panel config" onSubmit={run}><p className="eyebrow">01 / MANUAL CONFIGURATION</p><h2>Build your mission</h2><p>Select a published reference design or use custom oxygen parameters. Planetary suitability remains unevaluated.</p>
  <label htmlFor="oxygen_equipment_id">Oxygen system<select id="oxygen_equipment_id" value={form.oxygen_equipment_id ?? ''} onChange={e=>setForm({...form,oxygen_equipment_id:e.target.value || null})}><option value="">Custom oxygen configuration</option>{equipment.filter(item=>item.category==='oxygen_generation').map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
  {catalogMode && <><label htmlFor="oxygen_equipment_quantity">Number of oxygen units<input id="oxygen_equipment_quantity" type="number" required min="0" max="8" step="1" value={form.oxygen_equipment_quantity} onChange={e=>setForm({...form,oxygen_equipment_quantity:e.target.value===''?'':Number(e.target.value)})}/></label><p>Catalog output and power replace the disabled custom fields. Zero units means no oxygen equipment installed.</p>{preview && <EquipmentSummary equipment={preview} title="Selected configuration preview"/>}</>}
{controls.map(([key,label,min,max,step])=><label key={key} htmlFor={key}>{label}<input id={key} type="number" disabled={catalogMode && ['oxygen_capacity_kg_day','electrolyzer_kwh_kg_oxygen'].includes(key)} required min={min} max={max} step={step} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value===''?'':Number(e.target.value)})}/></label>)}<button className="run" type="submit" disabled={loading || !env}>{loading?'Evaluating…':'Run resource simulation →'}</button><small>1-hour steps · deterministic results · no AI-generated metrics</small></form>
  <div className="results" aria-live="polite"><section className="panel"><p className="eyebrow">EVIDENCE / MODEL TRANSPARENCY</p><h2>References are not validation.</h2><p>Current inputs: NASA crew and environment baselines; {catalogMode ? 'published historical oxygen equipment' : 'DOE electrolysis proxy'}; user-selected habitat design. Thermal conductance, HVAC performance and other loads are not validated equipment data.</p><details><summary>Inspect parameter sources and assumptions</summary><EvidenceList evidence={liveEvidence} sources={reference.sources}/><p>Crew, mission length, starting supplies, generation and oxygen capacity are scenario choices. Their defaults are demo selections, not published mission specifications. In catalog mode the selected unit count replaces the custom oxygen capacity; its source and totals appear in the selection preview.</p><ul>{Object.entries(env.field_sources).map(([key,url])=><li key={key}>{key}: <a href={url} target="_blank" rel="noreferrer">published reference ↗</a></li>)}</ul></details></section>{!result?<section className="panel empty"><span className="crosshair" aria-hidden="true">◎</span><p className="eyebrow">AWAITING MISSION PARAMETERS</p><h2>Your habitat starts here.</h2><p>Run the default Mars configuration, then reduce power or switch environments to reveal a constraint.</p><div className="note">This milestone evaluates oxygen, water and electricity. It does not certify a habitat as safe.</div></section>:<>
  <section className="panel status"><p className="eyebrow">02 / SIMULATION RESULT · {result.request.environment_id.toUpperCase()}</p>{stale && <p className="alert">Inputs changed. Run again to update these results.</p>}<h2>{result.resource_balance_complete?'Resource balance completed':'Resource constraint reached'}</h2><p className="note">{result.scientific_status}</p><p>{result.evaluated_hours} / {result.request.duration_days*24} hours evaluated</p><div className="stats"><div><small>Total demand</small><strong>{result.demand_kw} kW</strong></div><div><small>Assumed thermal load</small><strong>{result.thermal_load_kw} kW</strong></div></div>{result.events.map(e=><p className="alert" key={e.resource}>{e.message}</p>)}{result.equipment_summary ? <EquipmentSummary equipment={result.equipment_summary}/> : <p>Evaluated oxygen system: custom configuration.</p>}
  <details><summary>Evidence used for this simulation</summary><p>This record belongs to the last run, even when current inputs change.</p><EvidenceList evidence={result.evidence} sources={result.sources}/></details><p className="note">Completion means only that the modeled resources covered this scenario. Pressure and radiation remain unevaluated.</p></section>
  <Trend result={result} field="oxygen_kg" label="Oxygen · kg" color="#73d9c5"/><Trend result={result} field="water_kg" label="Water · kg" color="#74aaff"/><Trend result={result} field="battery_kwh" label="Battery · kWh" color="#eab676"/>
  <details className="panel"><summary>Inspect hourly data and limitations</summary><ul>{result.limitations.map(l=><li key={l}>{l}</li>)}</ul><div className="table-wrap"><table><caption>Hourly resource inventories (model {result.assumptions_version})</caption><thead><tr><th>Hour</th><th>O₂ kg</th><th>Water kg</th><th>Battery kWh</th></tr></thead><tbody>{result.readings.map(p=><tr key={p.hour}><td>{p.hour}</td><td>{p.oxygen_kg.toFixed(2)}</td><td>{p.water_kg.toFixed(2)}</td><td>{p.battery_kwh.toFixed(2)}</td></tr>)}</tbody></table></div></details></>}
  </div></div><footer>BEYOND EARTH / Team-built exploration, evidence-based assumptions.<span>Next: expand and validate equipment → optimizer → Gemini explanations.</span></footer></main></div>
}
