import AccountControls,{AUTH_DRAFT_KEY,useAuth} from './AuthContext';
import {canSaveEvaluatedMission,saveCloudMission} from './cloudMissions';
import {downloadMission} from './MissionLibrary';
import ComparisonGraphs from './ComparisonGraphs';
import {prepareAgentProposal} from './agentProposal';
import {co2ChartState} from './simulationDisplay';
import MissionBuildSummary from './MissionBuildSummary';
import OptimizationWorkflow from './OptimizationWorkflow';
import ResultNotices from './ResultNotices';
import {comparisonState} from './comparisonState';
import { useEffect, useRef, useState } from 'react';
import MissionControl from './MissionControl';
import MissionOutcome from './MissionOutcome';
import OperatorStation from './OperatorStation';
import MissionSetup from './MissionSetup';
import { createMission, parseMission } from './missionStorage';
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
 const co2=field==='co2_hour_average_mmhg';
 const co2State=co2?co2ChartState(result):null;
 if(co2&&co2State.status==='initial_only')return <section className="panel chart"><h3>{label}</h3><p>No hourly CO₂ average was calculated because the run stopped before launch. Initial cabin CO₂: {co2State.initial} mmHg.</p></section>;

 return <section className="panel chart"><h3>{label}</h3><p>{co2?'Cabin CO₂ · mean over each evaluated hour · limit 3 mmHg':'Simulated inventory · end of each hour'}</p><div role="img" aria-label={`${label} across ${result.evaluated_hours} simulated hours`} style={{height:200}}><ResponsiveContainer width="100%" height="100%"><LineChart data={result.readings}><CartesianGrid stroke="#233445" strokeDasharray="3 5"/><XAxis dataKey="hour" stroke="#99aabd" tickLine={false} minTickGap={40} label={{value:'Hours',position:'insideBottomRight',offset:-2}}/><YAxis stroke="#99aabd" width={48}/><Tooltip contentStyle={{background:'#12202d',border:'1px solid #375166',borderRadius:8}} formatter={v=>Number(v).toFixed(2)} labelFormatter={h=>`Hour ${h}`}/>{field==='co2_hour_average_mmhg'&&<ReferenceLine y={3} ifOverflow="extendDomain" stroke="#f38b91" strokeDasharray="4 4" label={{value:'3 mmHg screening',fill:'#f38b91',position:'insideTopRight'}}/>}<Line dataKey={field} name={label} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false}/></LineChart></ResponsiveContainer></div></section>
}
function referenceDefaults(defaults,catalog) {
 return {...defaults,
  oxygen_equipment_id:catalog.find(item=>item.category==='oxygen_generation')?.id??defaults.oxygen_equipment_id,
  water_equipment_id:catalog.find(item=>item.category==='water_recovery')?.id??defaults.water_equipment_id,
 };
}
function ResourceGraphs({ result, active }) {
 const [metric,setMetric]=useState('water_kg');
 const choices=[['oxygen_kg','Oxygen · kg','#73d9c5'],['water_kg','Water · kg','#74aaff'],['battery_kwh','Battery · kWh','#eab676'],...(result.request.co2_enabled?[['co2_hour_average_mmhg','Cabin CO₂ · one-hour average mmHg','#f38b91']]:[]),...(result.water_equipment_summary?[['wastewater_kg','Unprocessed wastewater · kg','#d2a6ee']]:[])];
 const selected=choices.find(([field])=>field===metric);
 return <section className="panel resource-graphs" aria-label="Simulation graphs"><label className="chart-selector" htmlFor="resource_graph">Graphs<select id="resource_graph" value={selected?metric:''} onChange={e=>setMetric(e.target.value)}><option value="">Choose a graph</option>{choices.map(([field,label])=><option key={field} value={field}>{label}</option>)}</select></label>{selected&&<Trend active={active} result={result} field={selected[0]} label={selected[1]} color={selected[2]}/>}</section>;
}
export default function App({ onHome, onHelp, active = true, onConfiguredChange }) {
 const auth=useAuth();
 const cloudSaveGeneration=useRef(0),restoredDraft=useRef(false);
 const [savingCloud,setSavingCloud]=useState(false);
 const runGeneration=useRef(0);
 const [stationReady,setStationReady]=useState(false),[hasPoweredOn,setHasPoweredOn]=useState(false),[booting,setBooting]=useState(false);
 const preparationHeading=useRef(null);
 const [editVersion,setEditVersion]=useState(0),[editingMission,setEditingMission]=useState(false);
 const labActive=active&&stationReady;
 useEffect(()=>{if(!booting)return;const timer=setTimeout(()=>setBooting(false),1100);return()=>clearTimeout(timer);},[booting]);
 function launchMission(){if(loading)return;setEditingMission(false);setStationReady(true);setBooting(!hasPoweredOn);setHasPoweredOn(true);setResult(null);setComparison(null);onConfiguredChange?.(true);window.scrollTo(0,0);void run('simulate');}
 function editMission(){setEditVersion(value=>value+1);setEditingMission(true);setStationReady(true);setBooting(false);}

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
 const canApplyOptimization=Boolean(comparison?.optimized&&!comparisonStale&&!optimizedApplied);
 useEffect(()=>{
  if(!comparison)return;
  const frame=requestAnimationFrame(()=>showResult(comparisonTarget));
  return ()=>cancelAnimationFrame(frame);
 },[comparison]);
 function applyOptimized(){
  if(!comparison?.optimized||comparisonStale||loading)return;
  cloudSaveGeneration.current++;setSavingCloud(false);
  runGeneration.current++;setLoading(false);setError('');setLoadedName('');setSaveState(null);
  setForm({...comparison.optimized.request});setResult(comparison.optimized);setMissionEpoch(value=>value+1);
  setActionState({action:'simulate',status:'done'});
 }

 function applyAgentProposal(scenario,nextSearch,evaluated){
  // Validate before changing any live controls. Use the exact tested request,
  // rather than calling run() while React still holds the previous form state.
  cloudSaveGeneration.current++;setSavingCloud(false);
  const proposal=prepareAgentProposal(scenario,nextSearch,evaluated,missionContext(),missionName);
  runGeneration.current++;setLoading(false);setError('');setLoadedName('');setComparison(null);
  setForm(proposal.scenario);setSearch(proposal.search);setResult(proposal.result);
  setEditingMission(false);setStationReady(true);setBooting(!hasPoweredOn);setHasPoweredOn(true);
  onConfiguredChange?.(true);setMissionEpoch(value=>value+1);
  setActionState({action:'simulate',status:'done'});setSaveState(null);
  if(!missionName.trim())setMissionName(proposal.document.name);
  window.scrollTo(0,0);
 }
 function missionContext(){return {defaults:reference.default_request,searchDefaults:{max_oxygen_units:8,max_water_units:8,max_co2_units:4,require_no_wastewater_backlog:false},schemas,equipment,modelVersion:reference.version};}
 // Account changes invalidate pending save UI and cloud record ownership.
 useEffect(()=>{cloudSaveGeneration.current++;setSavedMissionId(null);setSaveState(null);setSavingCloud(false);},[auth.user?.id]);
 useEffect(()=>{
  if(!form||!reference||!schemas)return;
  return auth.registerBeforeSignIn(()=>{
   const document=createMission(missionName.trim()||'Your mission',form,search,missionContext());
   window.sessionStorage.setItem(AUTH_DRAFT_KEY,JSON.stringify({document,expiresAt:Date.now()+15*60*1000}));
  });
 },[form,search,missionName,reference,schemas,equipment,auth.registerBeforeSignIn]);
 useEffect(()=>{
  if(!auth.user||!form||!reference||!schemas||restoredDraft.current)return;
  restoredDraft.current=true;
  try{
   const raw=window.sessionStorage.getItem(AUTH_DRAFT_KEY);if(!raw)return;
   window.sessionStorage.removeItem(AUTH_DRAFT_KEY);
   const draft=JSON.parse(raw);if(draft.expiresAt<Date.now())return;
   const document=parseMission(JSON.stringify(draft.document),missionContext());
   loadMission(document.configuration,document.name);
   setSaveState({message:'Your settings were restored after sign-in. Run, then Save to keep them in your account.',error:false});
  }catch{setSaveState({message:'The pre-sign-in draft could not be restored. Import a JSON backup or configure your mission again.',error:true});}
 },[auth.user,form,reference,schemas,equipment]);
 const canCloudSave=Boolean(auth.user&&!loading&&canSaveEvaluatedMission(form,result));
 async function saveToAccount(){
  if(!canCloudSave||savingCloud)return;
  const token=++cloudSaveGeneration.current;
  setSavingCloud(true);setSaveState(null);
  try{
   const document=createMission(missionName,form,search,missionContext());
   const saved=await saveCloudMission(auth.client,auth.user,document,missionContext(),savedMissionId);
   if(token!==cloudSaveGeneration.current)return;
   setSavedMissionId(saved.id);setSaveState({message:`Saved “${saved.document.name}” to your private account.`,error:false});
  }catch(err){if(token===cloudSaveGeneration.current)setSaveState({message:err.message,error:true});}
  finally{if(token===cloudSaveGeneration.current)setSavingCloud(false);}
 }
 function exportCurrent(){try{downloadMission(createMission(missionName||'Your mission',form,search,missionContext()),missionContext());setSaveState({message:'Mission JSON download requested.',error:false});}catch(err){setSaveState({message:err.message,error:true});}}
 function newMission(){
  cloudSaveGeneration.current++;setSavingCloud(false);
  setEditingMission(false);setEditVersion(0);
  setStationReady(false);setHasPoweredOn(false);setBooting(false);onConfiguredChange?.(false);
  runGeneration.current++;setLoading(false);setForm(referenceDefaults(reference.default_request,equipment));setSearch({max_oxygen_units:8,max_water_units:8,max_co2_units:4,require_no_wastewater_backlog:false});setMissionName('');setSavedMissionId(null);setSaveState(null);setResult(null);setComparison(null);setLoadedName('');setActionState(null);setError('');setMissionEpoch(value=>value+1);
 }
 function loadMission(configuration,name,id=null) {
   cloudSaveGeneration.current++;setSavingCloud(false);
   runGeneration.current++;setMissionName(name);setSavedMissionId(id);setSaveState(null);
   setForm(configuration.scenario);setSearch(configuration.search);setResult(null);setComparison(null);
   setError('');setLoading(false);setActionState(null);setLoadedName(name);setMissionEpoch(value=>value+1);
 }
 function submitRun(e){e.preventDefault();void run(e.nativeEvent.submitter?.value || 'simulate');}
 async function run(action = 'simulate') {
   if(loading)return;
   cloudSaveGeneration.current++;setSavingCloud(false);
   const token=++runGeneration.current;
   setLoading(true);setError('');setSaveState(null);setActionState({action:action==='optimize'?'optimize':'simulate',status:'running'});
   try {
     createMission(missionName,form,search,missionContext());
     const response=await api(action==='optimize'?'/improve':'/simulate',action==='optimize'?optimizationRequest():form);
     if(token!==runGeneration.current)return;
     if(action==='optimize'){setComparison(response);setResult(response.manual);setActionState({action:'optimize',status:'done',eligible:Boolean(response.optimized)});}
     else {setResult(response);setActionState({action:'simulate',status:'done'});}

   } catch(err) {if(token===runGeneration.current){setError(action==='optimize'&&err.message.includes('(404)')?'Restart the backend to load the new optimization improvement endpoint, then try again.':err.message);setActionState({action:action==='optimize'?'optimize':'simulate',status:'error'});}}
   finally {if(token===runGeneration.current)setLoading(false);}
 }
 if (!form) return <main className="shell"><h1>Beyond Earth</h1><p role="status">{error || 'Loading research references…'}</p><a href="/help" onClick={onHelp?e=>{e.preventDefault();onHelp();}:undefined}>Help: how to use Mission Lab</a></main>;
 const missionSaveActions=<div className="mission-save-actions">{auth.user?<button type="button" className="wizard-back" onClick={saveToAccount} disabled={!canCloudSave||savingCloud}>{savingCloud?'Saving…':'Save mission'}</button>:<small>Guest mission · export JSON to keep it</small>}<button type="button" className="wizard-back" onClick={exportCurrent}>Export JSON</button></div>;
 const setupWizard=<MissionSetup form={form} setForm={setForm} search={search} setSearch={setSearch} equipment={equipment} environments={environments} controls={controls} name={missionName} setName={setMissionName} onNew={newMission} loading={loading} editVersion={editVersion} onLaunch={launchMission} onClose={hasPoweredOn?()=>setEditingMission(false):onHome} closeLabel={hasPoweredOn?'Close editor':'Home'} library={<MissionLibrary scenario={form} search={search} context={missionContext()} onLoad={loadMission} name={missionName} result={result} canSave={canCloudSave} onSave={saveToAccount} saving={savingCloud} saveMessage={saveState?.message}/>}/>;
 return <div className="shell operator-shell" data-planet={form.environment_id}>
  <header><a className="brand" href="/" onClick={onHome ? e=>{e.preventDefault();onHome();} : undefined}><span className="mark">✦</span> BEYOND EARTH <small>HABITAT INTELLIGENCE</small></a><nav className="mission-page-nav" aria-label="Mission Lab navigation"><a href="/" onClick={onHome?e=>{e.preventDefault();onHome();}:undefined}>Home</a>{hasPoweredOn&&<a href="/help" onClick={onHelp?e=>{e.preventDefault();onHelp();}:undefined}>Help</a>}</nav><AccountControls/><span className="badge">EXPLORATORY MODEL / {reference.version}</span></header>
  <main id="main" aria-label="Mission control">
  <section className="mission-preparation" hidden={stationReady} aria-labelledby="preparation-title">
   <div className="preparation-intro"><p className="eyebrow">MISSION PREPARATION</p><h1 id="preparation-title" ref={preparationHeading} tabIndex={-1}>Build your mission</h1><p>Configure your habitat, then Run mission to power on the monitors and evaluate your build.</p></div>
   <div className="preparation-card">{!hasPoweredOn&&setupWizard}</div>
   {!stationReady&&<details className="preparation-ai"><summary>Optional: ask the AI mission designer for help</summary><p>Review a tested suggestion, then Apply & run to open mission control.</p><MissionAgent key={missionEpoch} baseline={optimizationRequest()} onApply={applyAgentProposal}/></details>}
  </section>
  {hasPoweredOn&&<div hidden={!stationReady}>
  <OperatorStation active={labActive} booting={booting} editingSetup={editingMission}
   setup={editingMission?setupWizard:<section className="mission-brief"><header className="brief-header"><div><p className="eyebrow">MISSION CONFIGURED</p><h2>{missionName || 'Your mission'}</h2></div><button type="button" className="wizard-back" onClick={editMission}>Edit configuration</button></header><MissionBuildSummary form={form} name={missionName} destination={env?.name} equipment={equipment}/><form className="brief-actions" onSubmit={submitRun}><button className="run" type="submit" name="action" value="simulate" disabled={loading||booting}>{loading?'Evaluating…':result&&!stale?'Run again →':'Run simulation →'}</button><div className="brief-secondary-actions"><button className="wizard-back" type="button" onClick={()=>void run('optimize')} disabled={loading||booting}>Optimize & compare</button><button className="wizard-back" type="button" onClick={applyOptimized} disabled={loading||booting||!canApplyOptimization}>{optimizedApplied?'✓ Results applied':'Apply results →'}</button><button type="button" className="result-jump" disabled={!result && actionState?.status!=='done'} onClick={()=>showResult(actionState?.action==='optimize'?comparisonTarget:simulationTarget)}>{canApplyOptimization?'Review optimized design →':'View results →'}</button></div></form>{missionSaveActions}<div className="brief-status" role="status">{canApplyOptimization&&<p>Passing design ready. Review it, then Apply optimized design.</p>}{optimizedApplied&&<p>Optimized design active. Settings and surface playback updated.</p>}{actionState?.action==='optimize'&&actionState.status==='done'&&!comparison?.optimized&&<p>No passing design found. Review the comparison for fixed limits.</p>}{actionState?.status==='running'&&<p>Evaluating your mission…</p>}{actionState?.status==='error'&&<p className="alert">The run failed. Check Systems & results for details.</p>}{saveState?.message&&<p className={saveState.error?'alert':'note'}>{saveState.message}</p>}</div></section>}
   designer={<section aria-label="Mission graphs"><p className="eyebrow">RESOURCE GRAPHS</p>{stale&&<p className="alert">Previous run · inputs changed.</p>}{result?<ResourceGraphs result={result} active={labActive}/>:<p>Run a mission to see graphs.</p>}{comparison?.optimized&&<><p className="model-scope">Comparison: {comparison.manual.request.environment_id}{comparisonStale?' · previous settings':''}</p><ComparisonGraphs comparison={comparison} active={labActive}/></>}</section>}

   surface={<><nav aria-label="Select environment" className="planets">{environments.map((p,i)=><button key={p.id} aria-pressed={form.environment_id===p.id} onClick={()=>setForm({...form,environment_id:p.id})} className={form.environment_id===p.id?'planet active':'planet'}><span className="orb planet-art-icon" aria-hidden="true"><img src={`/mission/${p.id}-icon.${p.id==='mars'?'webp':'png'}`} alt="" width="300" height="300"/></span><span><small>0{i+1} / {p.kind}</small><strong>{p.name}</strong></span><span className="arrow" aria-hidden="true">↗</span></button>)}</nav>{env && <MissionControl sceneOnly form={form} setForm={setForm} env={env} result={result} stale={stale}/>}</>}
   systems={<>{missionSaveActions}{saveState?.message&&<p role="status" className={saveState.error?'alert':'note'}>{saveState.message}</p>}
    <MissionOutcome outcomeRef={simulationTarget} result={result} loading={loading} error={error} stale={stale} optimized={optimizedApplied} optimizing={loading&&actionState?.action==='optimize'} disabled={booting} onOptimize={()=>run('optimize')}/>
    {comparison&&<div ref={comparisonTarget} tabIndex={-1} className="result-target" aria-label="Optimization comparison"><DesignComparison active={labActive} comparison={comparison} stale={comparisonStale} applied={optimizedApplied} onApply={applyOptimized} applyingDisabled={loading} onViewSimulation={()=>showResult(simulationTarget)}/></div>}
    <details className="panel relocated-ai"><summary>AI tools & prompt assistant</summary><OptimizationWorkflow comparison={comparison} stale={comparisonStale} applied={optimizedApplied} busy={loading} disabled={booting} error={error} onOptimize={()=>run('optimize')} onCompare={()=>showResult(comparisonTarget)} onApply={applyOptimized} onViewSimulation={()=>showResult(simulationTarget)}/>
    <details className="optional-prompt"><summary>Optional: create from a prompt</summary><p>Describe a mission to generate a tested design.</p><MissionAgent key={missionEpoch} baseline={optimizationRequest()} onApply={applyAgentProposal}/></details>
   </details>
    <details className="panel technical-details"><summary>Research & technical details</summary>
{env && <section className="environment panel"><div><p className="eyebrow">REFERENCE DATA · NOT LIVE</p><h2>{env.name} surface environment</h2><p>{env.atmosphere}</p><a href={env.source} target="_blank" rel="noreferrer">Scientific reference ↗</a></div><dl><div><dt>Temperature</dt><dd>{env.temperature_c} <small>°C</small></dd></div><div><dt>Pressure</dt><dd>{env.pressure_kpa.toLocaleString()} <small>kPa</small></dd></div><div><dt>Gravity</dt><dd>{env.gravity_ms2} <small>m/s²</small></dd></div></dl><details className="risk"><summary>Environment risks & resources</summary><p>{env.reference_context} {env.risk} {env.resources}</p></details></section>}<section className="panel"><p className="eyebrow">EVIDENCE / MODEL TRANSPARENCY</p><h2>References are not validation.</h2><p>Current inputs: NASA crew and environment baselines; {catalogMode ? 'published historical oxygen equipment' : 'DOE electrolysis proxy'}; user-selected habitat design. {waterCatalogMode ? ' Water recovery uses a capacity-limited historical reference case.' : ' Custom water recovery has no throughput limit.'} Thermal conductance, HVAC performance and other loads are not validated equipment data.</p><details><summary>Inspect parameter sources and assumptions</summary><EvidenceList evidence={liveEvidence} sources={reference.sources}/><p>Crew, mission length, starting supplies, generation and oxygen capacity are scenario choices. Their defaults are demo selections, not published mission specifications. In catalog mode the selected unit count replaces the custom oxygen capacity; its source and totals appear in the selection preview.</p><ul>{Object.entries(env.field_sources).map(([key,url])=><li key={key}>{key}: <a href={url} target="_blank" rel="noreferrer">published reference ↗</a></li>)}</ul></details></section>{result&&<><section tabIndex={-1} aria-label="Simulation results" className="panel status result-target"><p className="eyebrow">02 / SIMULATION RESULT · {result.request.environment_id.toUpperCase()}</p>{stale && <p className="alert">Inputs changed. Run again to update these results.</p>}<h2>Detailed simulation results</h2><p className="note">{result.scientific_status}</p><p>{result.evaluated_hours} / {result.request.duration_days*24} hours evaluated</p><div className="stats"><div><small>Total demand</small><strong>{result.demand_kw} kW</strong></div><div><small>Heating/cooling electricity needed</small><strong>{result.thermal_load_kw} kW</strong></div></div><ResultNotices result={result}/><ThermalResult result={result}/><details className="result-details"><summary>Equipment & cabin checks</summary>{result.equipment_summary ? <EquipmentSummary equipment={result.equipment_summary}/> : <p>Evaluated oxygen system: custom configuration.</p>}
  {result.water_equipment_summary ? <WaterEquipmentSummary equipment={result.water_equipment_summary}/> : <p>Evaluated water system: custom effective recovery with unbounded throughput.</p>}
  <AtmosphereResult result={result}/><Co2Result result={result}/><section className="water-balance"><h3>Water processing balance</h3><p>Over the evaluated hours: {result.water_balance.recovered_water_kg.toFixed(3)} kg recovered · {result.water_balance.unprocessed_wastewater_kg.toFixed(3)} kg waiting · {result.water_balance.brine_water_kg.toFixed(3)} kg in modeled brine/losses.</p><p>Effective recovery of modeled crew use: {(result.water_balance.effective_recovery_fraction*100).toFixed(2)}%. Feed composition, pretreatment, delay and storage limits remain assumptions.</p></section>
  </details>{result.warnings.map(warning=><p key={warning} className="alert">{warning}</p>)}<details><summary>Simulation evidence</summary><p>This record belongs to the last run, even when current inputs change.</p><EvidenceList evidence={result.evidence} sources={result.sources}/></details><p className="note">Completion means only that the modeled resources covered this scenario. Pressure regulation and radiation remain unevaluated; optional atmosphere screening checks fixed settings only.</p></section><details className="panel"><summary>Inspect hourly data and limitations</summary><ul>{result.limitations.map(l=><li key={l}>{l}</li>)}</ul><div className="table-wrap"><table><caption>Hourly resource inventories (model {result.assumptions_version})</caption><thead><tr><th>Hour</th><th>O₂ kg</th><th>Water kg</th><th>Battery kWh</th><th>Waiting water kg</th><th>Recovered kg</th><th>Brine/loss kg</th></tr></thead><tbody>{result.readings.map(p=><tr key={p.hour}><td>{p.hour}</td><td>{p.oxygen_kg.toFixed(2)}</td><td>{p.water_kg.toFixed(2)}</td><td>{p.battery_kwh.toFixed(2)}</td><td>{p.wastewater_kg.toFixed(2)}</td><td>{p.recovered_water_kg.toFixed(2)}</td><td>{p.brine_water_kg.toFixed(2)}</td></tr>)}</tbody></table></div></details></>}
    </details>
   </>}

  /></div>}
  </main></div>;
}
