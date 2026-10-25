import { useRef, useState } from 'react';
import { api } from './api';
import EvidenceList from './EvidenceList';

const format=value=>value===null?'None / custom':String(value);
export default function MissionAgent({baseline,onApply}) {
 const [goal,setGoal]=useState('Find a working optimized design for my current mission. You may propose increases to continuous power, starting water and enabled heating/cooling capacity if needed. Keep crew, duration, destination, cabin atmosphere settings and check enable flags unchanged. Explain why my manual design fails or succeeds and why the tested proposal works.');
 const [response,setResponse]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[applied,setApplied]=useState(false);
 const [allowAdjustments,setAllowAdjustments]=useState(true);
 const generation=useRef(0), resultTarget=useRef(null);
 function viewResponse(){resultTarget.current?.focus();resultTarget.current?.scrollIntoView({block:"start",behavior:"instant"});}
 const stale=response&&(JSON.stringify(response.baseline)!==JSON.stringify(baseline)||response.goal!==goal.trim()||response.allow_resource_adjustments!==allowAdjustments);
 const run=response?.comparison?.optimized||response?.simulation;
 const changes=response?.proposed_scenario ? [
  ...Object.entries(response.proposed_scenario).filter(([key,value])=>value!==response.baseline.scenario[key]).map(([key,value])=>[key,response.baseline.scenario[key],value]),
  ...Object.entries(response.proposed_search||{}).filter(([key,value])=>value!==response.baseline[key]).map(([key,value])=>[`search.${key}`,response.baseline[key],value]),
 ]:[];
 async function submit(e) {
  e.preventDefault();const token=++generation.current;
  setBusy(true);setResponse(null);setError('');setApplied(false);
  try {const result=await api('/agent',{goal:goal.trim(),baseline,allow_resource_adjustments:allowAdjustments});if(token===generation.current)setResponse(result);}
  catch {if(token===generation.current)setError('The mission agent could not connect. Check the updated backend and try again.');}
  finally {if(token===generation.current)setBusy(false);}
 }
 function apply() {
  if(!response?.proposed_scenario||stale||busy)return;
  try {onApply(response.proposed_scenario,response.proposed_search,run);setApplied(true);setError('');}
  catch(error){setError(error.message || 'The proposal could not be applied. Test the goal again.');}
 }
 return <section className="panel mission-agent" aria-label="Mission design agent">
  <p className="eyebrow">GEMINI / LOCAL SIMULATION TOOLS</p><h2>AI mission designer</h2>
  <p>Describe your mission.</p>
  <form onSubmit={submit}><label htmlFor="agent_goal">Mission goal<textarea id="agent_goal" required minLength={5} maxLength={1500} rows={4} value={goal} onChange={e=>{setGoal(e.target.value);setApplied(false);}}/></label><label className="checkbox-label agent-adjustment"><input type="checkbox" checked={allowAdjustments} onChange={e=>{setAllowAdjustments(e.target.checked);setApplied(false);}}/>Allow power, water & thermal capacity increases</label><button className="run" disabled={busy||goal.trim().length<5}>{busy?'Testing goal… please wait':response?(stale&&!applied?'Inputs changed · Test again':'✓ Response received · Test again'):error?'Try goal again':'Test goal'}</button></form>
  <div className="action-feedback" role="status" aria-live="polite" aria-atomic="true">{busy&&<p><span className="activity-spinner" aria-hidden="true"/>Creating a tested design…</p>}{response&&<><p>{applied?'Applied. Simulation updated.':stale?'Inputs changed. Test again.':response.proposed_scenario?'Design ready. Review, then apply.':response.status==='needs_clarification'?'More details needed. See below.':response.status==='unavailable'?'AI unavailable. See details.':response.status==='partial'||response.status==='limited'?'Stopped early. Review results.':'Finished. No design to apply.'}</p>{response.proposed_scenario&&<button type="button" className="run" disabled={busy||stale||applied} onClick={apply}>{applied?'✓ Results applied':'Apply results & run →'}</button>}<button type="button" className="result-jump" onClick={viewResponse}>Review changes ↓</button></>}{error&&<p>Failed. See error below.</p>}</div>
  <details><summary>Example goals</summary><button type="button" className="agent-example" onClick={()=>{setGoal('Enable cabin CO2 screening for six crew for 30 days on Mars, with 100 m3 free cabin volume, 0.4 mmHg initial CO2, 14 kW generation, 400 kg initial water and no ending wastewater backlog. Find the lightest catalog design. Keep all other inputs unchanged.');setApplied(false);}}>Try a CO₂ screening goal</button>
  <button type="button" className="agent-example" onClick={()=>{setGoal('Enable cabin atmosphere screening and evaluate the current design at 101.325 kPa total cabin pressure and 20.9 percent dry oxygen. Keep every other mission, equipment, supply and screening setting unchanged. Explain dry versus inspired oxygen partial pressure.');setApplied(false);}}>Try an atmosphere screening goal</button>
  </details><p className="muted">Your goal and mission settings are sent to Google Gemini.</p><details><summary>How AI uses your data</summary><p className="muted">Uses the existing Gemini API only. Your goal, current settings, catalog evidence and compact tool results are sent to Google. Up to three local tool calls and four Gemini requests per run. Starting supplies and settings change only in a reviewable proposal.</p>
  </details><div aria-live="polite" aria-busy={busy}>
   {error&&<p role="alert" className="alert">{error}</p>}
   {response&&<div ref={resultTarget} tabIndex={-1} className="result-target" aria-label="Goal test response">
    <p className="note">{response.model?`AI mission agent · ${response.model}`:'Mission agent unavailable'} · {response.status.replaceAll('_',' ')}</p>
    {stale&&!applied&&<p className="alert">Inputs changed. Test again before applying.</p>}
    {run ? <>
     <h3>{response.comparison?.optimized?'Recommended configuration':'Calculated design'}</h3>
     <div className="agent-metrics">
      <div><span>Oxygen units</span><strong>{run.equipment_summary?.quantity ?? 'Custom'}</strong></div>
      <div><span>Water units</span><strong>{run.water_equipment_summary?.quantity ?? 'Custom'}</strong></div>
      {run.request.co2_enabled&&<div><span>CO₂ scrubbers</span><strong>{run.co2_equipment_summary?.quantity ?? '—'}</strong></div>}
      <div><span>Power demand</span><strong>{run.demand_kw} kW</strong></div>
      {response.comparison?.optimized&&<div><span>Known equipment mass</span><strong>{response.comparison.optimized_known_hardware_mass_kg ?? 'Unknown'} kg</strong></div>}
     </div>
     <p>{run.resource_balance_complete?'Resource checks completed':'Resource constraint reached'} · {run.evaluated_hours} / {run.request.duration_days*24} hours.</p>
     <p className="muted">CO₂: {run.request.co2_enabled?'screened':'not checked'} · Atmosphere: {run.request.atmosphere_enabled?'fixed settings screened':'not checked'}. Exploratory model; not proof of survival.</p>
     <details><summary>AI explanation</summary><p className="agent-message">{response.message}</p></details>
    </> : response.comparison ? <><p className="note">No eligible design within the searched equipment limits.</p><p>{response.comparison.feasible_count} eligible · {response.comparison.evaluated_count} evaluated. Review constraints in the tool audit.</p><details><summary>AI explanation</summary><p className="agent-message">{response.message}</p></details></> : <p className="agent-message">{response.message}</p>}
    {response.audit.length>0&&<details><summary>Tool audit · {response.audit.length} call(s)</summary><ol>{response.audit.map((entry,i)=><li key={i}><strong>{entry.tool} · {entry.status}</strong><pre>{JSON.stringify(entry.summary,null,2)}</pre><details><summary>Exact evaluated inputs</summary><pre>{JSON.stringify(entry.inputs,null,2)}</pre></details></li>)}</ol></details>}

    {response.proposed_scenario&&<>
     <h3>Review proposed changes</h3>
     {changes.length?<div className="table-wrap"><table><caption>All changes from your original settings</caption><thead><tr><th>Input</th><th>Current at request</th><th>Proposed</th></tr></thead><tbody>{changes.map(([key,before,after])=><tr key={key}><th scope="row">{key}</th><td>{format(before)}</td><td>{format(after)}</td></tr>)}</tbody></table></div>:<p>The evaluated proposal matches your current settings.</p>}
    </>}
    {!response.proposed_scenario&&response.audit.length>0&&<p>No passing design to apply.</p>}
    {applied&&<p role="status">Applied. Controls and charts updated.</p>}
    {run&&<details><summary>Evidence from the calculated design</summary><EvidenceList evidence={run.evidence} sources={run.sources}/></details>}
    <details><summary>AI limitations</summary><ul>{response.limitations.map(note=><li key={note}>{note}</li>)}</ul></details>
    <p>Review AI advice before applying.</p>
   </div>}
  </div>
 </section>;
}
