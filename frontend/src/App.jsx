import ResultNotices from './ResultNotices';
import {comparisonState} from './comparisonState';
import { useEffect, useRef, useState } from 'react';
import MissionControl from './MissionControl';
import OperatorStation from './OperatorStation';
import MissionSetup from './MissionSetup';
import { createMission, saveMissionRun } from './missionStorage';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { api } from './api';
import EquipmentSummary from './EquipmentSummary';
import EvidenceList from './EvidenceList';
import WaterEquipmentSummary from './WaterEquipmentSummary';
import DesignComparison from './DesignComparison';
import MissionAgent from './MissionAgent';
import {Co2Result} from './Co2Panel';
import {AtmosphereResult} from './AtmospherePanel';
import MissionLibrary from './MissionLibrary';
import {ThermalResult} from './ThermalPanel';
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
function Trend({result, field, label, color, active = true}) {
 if (!active) return null;
 return <section className="panel chart"><h3>{label}</h3><p>Simulated inventory · end of each hour</p><div role="img" aria-label={`${label} across ${result.evaluated_hours} simulated hours`} style={{height:200}}><ResponsiveContainer width="100%" height="100%"><LineChart data={result.readings}><CartesianGrid stroke="#233445" strokeDasharray="3 5"/><XAxis dataKey="hour" stroke="#99aabd" tickLine={false} minTickGap={40} label={{value:'Hours',position:'insideBottomRight',offset:-2}}/><YAxis stroke="#99aabd" width={48}/><Tooltip contentStyle={{background:'#12202d',border:'1px solid #375166',borderRadius:8}} formatter={v=>Number(v).toFixed(2)} labelFormatter={h=>`Hour ${h}`}/>{field==='co2_hour_average_mmhg'&&<ReferenceLine y={3} stroke="#f38b91" strokeDasharray="4 4" label={{value:'3 mmHg screening',fill:'#f38b91',position:'insideTopRight'}}/>}<Line dataKey={field} name={label} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false}/></LineChart></ResponsiveContainer></div></section>
}
function referenceDefaults(defaults,catalog) {
 return {...defaults,
  oxygen_equipment_id:catalog.find(item=>item.category==='oxygen_generation')?.id??defaults.oxygen_equipment_id,
  water_equipment_id:catalog.find(item=>item.category==='water_recovery')?.id??defaults.water_equipment_id,
 };
}
export default function App({ onHome, onHelp, active = true }) {
 const runGeneration=useRef(0);
 const [missionName,setMissionName]=useState(''),[savedMissionId,setSavedMissionId]=useState(null),[saveState,setSaveState]=useState(null);
 const comparisonTarget=useRef(null), simulationTarget=useRef(null);
 const [actionState,setActionState]=useState(null);
 function showResult(target){target.current?.focus();target.current?.scrollIntoView({block:"start",behavior:"instant"});}
 const [missionEpoch,setMissionEpoch]=useState(0),[loadedName,setLoadedName]=useState(''),[schemas,setSchemas]=useState(null);
 const [comparison,setComparison]=useState(null), [search,setSearch]=useState({max_oxygen_units:8,max_water_units:8,max_co2_units:4,require_no_wastewater_backlog:false});
 const [equipment,setEquipment]=useState([]), [environments,setEnvironments]=useState([]), [form,setForm]=useState(null), [result,setResult]=useState(null), [reference,setReference]=useState(null), [error,setError]=useState(''), [loading,setLoading]=useState(false);
 useEffect(()=>{Promise.all([api('/environments'),api('/model-reference'),api('/equipment'),api('/openapi.json')]).then(([envs,ref,catalog,contract])=>{if(typeof ref?.default_request?.thermal_capacity_enabled!=='boolean'||typeof ref?.default_request?.atmosphere_enabled!=='boolean'||typeof ref?.default_request?.co2_enabled!=='boolean'||!catalog.some(item=>item.category==='co2_removal')) {const mismatch=new Error(`Your backend is running model ${ref?.version || 'unknown'} without the required thermal and cabin screening fields. Restart the backend in the VS Code terminal containing your Gemini key, then refresh this page.`);mismatch.name='BackendCompatibilityError';throw mismatch;}setSchemas(contract.components.schemas);setEquipment(catalog);setEnvironments(envs);setReference(ref);setForm(referenceDefaults(ref.default_request,catalog));}).catch(err=>setError(err.name==='BackendCompatibilityError'?err.message:'Cannot reach the updated API. Start or restart the FastAPI backend on port 8000, then refresh.'));},[]);
 const env = environments.find(e=>e.id===form?.environment_id);
 const stale = result && JSON.stringify(result.request)!==JSON.stringify(form);
 const catalogMode = Boolean(form?.oxygen_equipment_id);
 const waterCatalogMode = Boolean(form?.water_equipment_id);
 const liveEvidence = reference ? Object.fromEntries(Object.entries(reference.parameters)
   .filter(([key])=>(!catalogMode || key!=='electrolyzer_kwh_kg_oxygen') && (!waterCatalogMode || !['recycling_fraction','recycler_power_kw'].includes(key)))
   .map(([key,p])=>[key,{...p,value:form?.[key] ?? p.value,
      classification:form?.[key] !== undefined && form[key] !== p.value ? 'user_override' : p.classification}])) : {};

 function optimizationRequest() {
   if(!form)return {scenario:null,...search};
   return {scenario:form,
     oxygen_equipment_id:form.oxygen_equipment_id || equipment.find(item=>item.category==='oxygen_generation')?.id,
     water_equipment_id:form.water_equipment_id || equipment.find(item=>item.category==='water_recovery')?.id,
     ...search};
 }
 const {stale:comparisonStale,applied:optimizedApplied}=comparisonState(comparison,optimizationRequest(),result);
 function applyOptimized(){
  if(!comparison?.optimized||comparisonStale||loading)return;
  runGeneration.current++;setLoading(false);setError('');setLoadedName('');setSaveState(null);
  setForm({...comparison.optimized.request});setResult(comparison.optimized);setMissionEpoch(value=>value+1);
  setActionState({action:'simulate',status:'done'});
 }

 function missionContext(){return {defaults:reference.default_request,searchDefaults:{max_oxygen_units:8,max_water_units:8,max_co2_units:4,require_no_wastewater_backlog:false},schemas,equipment,modelVersion:reference.version};}
 function newMission(){
  runGeneration.current++;setLoading(false);setForm(referenceDefaults(reference.default_request,equipment));setSearch({max_oxygen_units:8,max_water_units:8,max_co2_units:4,require_no_wastewater_backlog:false});setMissionName('');setSavedMissionId(null);setSaveState(null);setResult(null);setComparison(null);setLoadedName('');setActionState(null);setError('');setMissionEpoch(value=>value+1);
 }
 function loadMission(configuration,name,id=null) {
   runGeneration.current++;setMissionName(name);setSavedMissionId(id);setSaveState(null);
   setForm(configuration.scenario);setSearch(configuration.search);setResult(null);setComparison(null);
   setError('');setLoading(false);setActionState(null);setLoadedName(name);setMissionEpoch(value=>value+1);
 }
 async function run(e) {
   e.preventDefault(); const action=e.nativeEvent.submitter?.value;
   const token=++runGeneration.current;
   setLoading(true);setError('');setSaveState(null);setActionState({action:action==='optimize'?'optimize':'simulate',status:'running'});
   try {
     const snapshot=createMission(missionName,form,search,missionContext());
     const response=await api(action==='optimize'?'/improve':'/simulate',action==='optimize'?optimizationRequest():form);
     if(token!==runGeneration.current)return;
     if(action==='optimize'){setComparison(response);setResult(response.manual);setActionState({action:'optimize',status:'done',eligible:Boolean(response.optimized)});}
     else {setResult(response);setActionState({action:'simulate',status:'done'});}
     try {
      const saved=saveMissionRun(window.localStorage,snapshot,missionContext(),savedMissionId);
      setSavedMissionId(saved.item.id);setMissionName(saved.item.document.name);setSaveState({message:`Saved “${saved.item.document.name}” in this browser.`,error:false});
     } catch(saveError){setSaveState({message:`Simulation completed, but the mission could not be saved: ${saveError.message}`,error:true});}
   } catch(err) {if(token===runGeneration.current){setError(action==='optimize'&&err.message.includes('(404)')?'Restart the backend to load the new optimization improvement endpoint, then try again.':err.message);setActionState({action:action==='optimize'?'optimize':'simulate',status:'error'});}}
   finally {if(token===runGeneration.current)setLoading(false);}
 }
 if (!form) return <main className="shell"><h1>Beyond Earth</h1><p role="status">{error || 'Loading research references…'}</p><a href="/tutorial" onClick={onHelp?e=>{e.preventDefault();onHelp();}:undefined}>Help: how to use Mission Lab</a></main>;
 return <div className="shell operator-shell" data-planet={form.environment_id}>
  <header><a className="brand" href="/" onClick={onHome ? e=>{e.preventDefault();onHome();} : undefined}><span className="mark">✦</span> BEYOND EARTH <small>HABITAT INTELLIGENCE</small></a><nav className="mission-page-nav" aria-label="Mission Lab navigation"><a href="/" onClick={onHome?e=>{e.preventDefault();onHome();}:undefined}>Home</a><a href="/tutorial" onClick={onHelp?e=>{e.preventDefault();onHelp();}:undefined}>Help</a></nav><span className="badge">EXPLORATORY MODEL / {reference.version}</span></header>
  <main id="main" aria-label="Mission control">
  <OperatorStation active={active}
   setup={<MissionSetup form={form} setForm={setForm} search={search} setSearch={setSearch} equipment={equipment} environments={environments} controls={controls} name={missionName} setName={setMissionName} onNew={newMission} onRun={run} runError={error} loading={loading} actionState={actionState} saveState={saveState} onResults={()=>showResult(actionState?.action==='optimize'?comparisonTarget:simulationTarget)} library={<MissionLibrary scenario={form} search={search} context={missionContext()} onLoad={loadMission}/>}/>}
   designer={<><MissionAgent key={missionEpoch} baseline={optimizationRequest()} onApply={(scenario,nextSearch,evaluated)=>{runGeneration.current++;setLoading(false);setActionState(null);setLoadedName('');setForm(scenario);setSearch(nextSearch);setResult(evaluated);setComparison(null);}}/></>}
   surface={<><nav aria-label="Select environment" className="planets">{environments.map((p,i)=><button key={p.id} aria-pressed={form.environment_id===p.id} onClick={()=>setForm({...form,environment_id:p.id})} className={form.environment_id===p.id?'planet active':'planet'}><span className={`orb ${p.id}`} aria-hidden="true"/><span><small>0{i+1} / {p.kind}</small><strong>{p.name}</strong></span><span className="arrow" aria-hidden="true">↗</span></button>)}</nav>{env && <MissionControl sceneOnly form={form} setForm={setForm} env={env} result={result} stale={stale}/>}</>}
   systems={<>{error && <p role="alert" className="alert">{error}</p>}{env && <section className="environment panel"><div><p className="eyebrow">REFERENCE DATA · NOT LIVE</p><h2>{env.name} surface environment</h2><p>{env.atmosphere}</p><a href={env.source} target="_blank" rel="noreferrer">Scientific reference ↗</a></div><dl><div><dt>Temperature</dt><dd>{env.temperature_c} <small>°C</small></dd></div><div><dt>Pressure</dt><dd>{env.pressure_kpa.toLocaleString()} <small>kPa</small></dd></div><div><dt>Gravity</dt><dd>{env.gravity_ms2} <small>m/s²</small></dd></div></dl><details className="risk"><summary>Environment risks & resources</summary><p>{env.reference_context} {env.risk} {env.resources}</p></details></section>}<div className="results" aria-live="polite">{loadedName&&!result&&<p role="status" className="note">Loaded “{loadedName}”. {loading?'Evaluating loaded mission…':'Run a fresh simulation or optimization to evaluate these inputs.'}</p>}{comparison && <div ref={comparisonTarget} tabIndex={-1} className="result-target" aria-label="Optimization comparison"><DesignComparison active={active} comparison={comparison} stale={comparisonStale} applied={optimizedApplied} onApply={applyOptimized} applyingDisabled={loading} onViewSimulation={()=>showResult(simulationTarget)}/></div>}<details className="panel"><summary>Sources & assumptions</summary><p>Current inputs: NASA crew and environment baselines; {catalogMode ? 'published historical oxygen equipment' : 'DOE electrolysis proxy'}; user-selected habitat design. {waterCatalogMode ? ' Water recovery uses a capacity-limited historical reference case.' : ' Custom water recovery has no throughput limit.'} Thermal conductance, HVAC performance and other loads are not validated equipment data.</p><details><summary>Inspect parameter sources and assumptions</summary><EvidenceList evidence={liveEvidence} sources={reference.sources}/><p>Crew, mission length, starting supplies, generation and oxygen capacity are scenario choices. Their defaults are demo selections, not published mission specifications. In catalog mode the selected unit count replaces the custom oxygen capacity; its source and totals appear in the selection preview.</p><ul>{Object.entries(env.field_sources).map(([key,url])=><li key={key}>{key}: <a href={url} target="_blank" rel="noreferrer">published reference ↗</a></li>)}</ul></details></details>{!result?<section className="panel empty"><span className="crosshair" aria-hidden="true">◎</span><p className="eyebrow">AWAITING MISSION PARAMETERS</p><h2>Ready to simulate</h2><p>Run your mission to see resource results.</p></section>:<>
  <section ref={simulationTarget} tabIndex={-1} aria-label="Simulation results" className="panel status result-target">{optimizedApplied&&<p role="status" className="applied-design-banner">OPTIMIZED DESIGN ACTIVE</p>}<p className="eyebrow">02 / SIMULATION RESULT · {result.request.environment_id.toUpperCase()}</p>{stale && <p className="alert">Inputs changed. Run again to update these results.</p>}<h2>{result.resource_balance_complete?'Resource balance completed':'Resource constraint reached'}</h2><p className="model-scope">Exploratory model · not proof of survival</p><p>{result.evaluated_hours} / {result.request.duration_days*24} hours evaluated</p><div className="stats"><div><small>Total demand</small><strong>{result.demand_kw} kW</strong></div><div><small>Heating/cooling electricity needed</small><strong>{result.thermal_load_kw} kW</strong></div></div><ResultNotices result={result}/><ThermalResult result={result}/><details className="result-details"><summary>Equipment & cabin checks</summary>{result.equipment_summary ? <EquipmentSummary equipment={result.equipment_summary}/> : <p>Evaluated oxygen system: custom configuration.</p>}
  {result.water_equipment_summary ? <WaterEquipmentSummary equipment={result.water_equipment_summary}/> : <p>Evaluated water system: custom effective recovery with unbounded throughput.</p>}
  <AtmosphereResult result={result}/><Co2Result result={result}/><section className="water-balance"><h3>Water processing balance</h3><p>Over the evaluated hours: {result.water_balance.recovered_water_kg.toFixed(3)} kg recovered · {result.water_balance.unprocessed_wastewater_kg.toFixed(3)} kg waiting · {result.water_balance.brine_water_kg.toFixed(3)} kg in modeled brine/losses.</p><p>Effective recovery of modeled crew use: {(result.water_balance.effective_recovery_fraction*100).toFixed(2)}%. Feed composition, pretreatment, delay and storage limits remain assumptions.</p></section>
  </details><details><summary>Simulation evidence</summary><p>This record belongs to the last run, even when current inputs change.</p><EvidenceList evidence={result.evidence} sources={result.sources}/></details></section>
  <Trend active={active} result={result} field="oxygen_kg" label="Oxygen · kg" color="#73d9c5"/><Trend active={active} result={result} field="water_kg" label="Water · kg" color="#74aaff"/><Trend active={active} result={result} field="battery_kwh" label="Battery · kWh" color="#eab676"/>
  {result.request.co2_enabled&&<Trend active={active} result={result} field="co2_hour_average_mmhg" label="Cabin CO₂ · one-hour average mmHg" color="#f38b91"/>}
  {result.water_equipment_summary && <Trend active={active} result={result} field="wastewater_kg" label="Unprocessed wastewater · kg" color="#d2a6ee"/>}
  <details className="panel"><summary>Inspect hourly data and limitations</summary><ul>{result.limitations.map(l=><li key={l}>{l}</li>)}</ul><div className="table-wrap"><table><caption>Hourly resource inventories (model {result.assumptions_version})</caption><thead><tr><th>Hour</th><th>O₂ kg</th><th>Water kg</th><th>Battery kWh</th><th>Waiting water kg</th><th>Recovered kg</th><th>Brine/loss kg</th></tr></thead><tbody>{result.readings.map(p=><tr key={p.hour}><td>{p.hour}</td><td>{p.oxygen_kg.toFixed(2)}</td><td>{p.water_kg.toFixed(2)}</td><td>{p.battery_kwh.toFixed(2)}</td><td>{p.wastewater_kg.toFixed(2)}</td><td>{p.recovered_water_kg.toFixed(2)}</td><td>{p.brine_water_kg.toFixed(2)}</td></tr>)}</tbody></table></div></details></>}
</div></>}
  />
  </main></div>;
}
