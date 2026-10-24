import { useRef, useState } from 'react';
import { api } from './api';
import EvidenceList from './EvidenceList';

const format=value=>value===null?'None / custom':String(value);
export default function MissionAgent({baseline,onApply}) {
 const [goal,setGoal]=useState('Find the lightest catalog design for six crew for 30 days on Mars, using 12 kW generation, 400 kg initial water and no wastewater backlog. Keep all other inputs unchanged.');
 const [response,setResponse]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[applied,setApplied]=useState(false);
 const generation=useRef(0);
 const stale=response&&(JSON.stringify(response.baseline)!==JSON.stringify(baseline)||response.goal!==goal.trim());
 const run=response?.comparison?.optimized||response?.simulation;
 const changes=response?.proposed_scenario ? [
  ...Object.entries(response.proposed_scenario).filter(([key,value])=>value!==response.baseline.scenario[key]).map(([key,value])=>[key,response.baseline.scenario[key],value]),
  ...Object.entries(response.proposed_search||{}).filter(([key,value])=>value!==response.baseline[key]).map(([key,value])=>[`search.${key}`,response.baseline[key],value]),
 ]:[];
 async function submit(e) {
  e.preventDefault();const token=++generation.current;
  setBusy(true);setResponse(null);setError('');setApplied(false);
  try {const result=await api('/agent',{goal:goal.trim(),baseline});if(token===generation.current)setResponse(result);}
  catch {if(token===generation.current)setError('The mission agent could not connect. Check the updated backend and try again.');}
  finally {if(token===generation.current)setBusy(false);}
 }
 function apply() {
  if(!response?.proposed_scenario||stale||busy)return;
  onApply(response.proposed_scenario,response.proposed_search,run);setApplied(true);
 }
 return <section className="panel mission-agent" aria-label="Mission design agent">
  <p className="eyebrow">GEMINI / LOCAL SIMULATION TOOLS</p><h2>Ask your mission designer</h2>
  <p>Describe a mission goal. Gemini can test proposed inputs and search catalog equipment counts. Review every change before applying it.</p>
  <form onSubmit={submit}><label htmlFor="agent_goal">Mission goal<textarea id="agent_goal" required minLength={5} maxLength={1500} rows={4} value={goal} onChange={e=>{setGoal(e.target.value);setApplied(false);}}/></label><button className="run" disabled={busy||goal.trim().length<5}>{busy?'Evaluating mission goal…':'Test mission goal with agent'}</button></form>
  <button type="button" className="agent-example" onClick={()=>{setGoal('Enable cabin CO2 screening for six crew for 30 days on Mars, with 100 m3 free cabin volume, 0.4 mmHg initial CO2, 14 kW generation, 400 kg initial water and no ending wastewater backlog. Find the lightest catalog design. Keep all other inputs unchanged.');setApplied(false);}}>Try a CO₂ screening goal</button>
  <p className="muted">Uses the existing Gemini API only. Your goal, current settings, catalog evidence and compact tool results are sent to Google. Up to three local tool calls and four Gemini requests per run. Starting supplies and settings change only in a reviewable proposal.</p>
  <div aria-live="polite" aria-busy={busy}>
   {error&&<p role="alert" className="alert">{error}</p>}
   {response&&<>
    <p className="note">{response.model?`AI mission agent · ${response.model}`:'Mission agent unavailable'} · {response.status.replaceAll('_',' ')}</p>
    {stale&&!applied&&<p className="alert">The goal or mission inputs changed. Run the agent again before applying this proposal.</p>}
    <p className="agent-message">{response.message}</p>
    {response.audit.length>0&&<details open><summary>Tool audit · {response.audit.length} call(s)</summary><ol>{response.audit.map((entry,i)=><li key={i}><strong>{entry.tool} · {entry.status}</strong><pre>{JSON.stringify(entry.summary,null,2)}</pre><details><summary>Exact evaluated inputs</summary><pre>{JSON.stringify(entry.inputs,null,2)}</pre></details></li>)}</ol></details>}
    {run&&<div className="note">Latest calculated result: {run.resource_balance_complete?'Resource checks completed':'Resource constraint reached'} · {run.evaluated_hours} / {run.request.duration_days*24} hours · {run.demand_kw} kW demand. This is a limited resource model, not proof of survival.</div>}
    {response.proposed_scenario&&<>
     <h3>Review proposed changes</h3>
     {changes.length?<div className="table-wrap"><table><caption>All changes from your original settings</caption><thead><tr><th>Input</th><th>Current at request</th><th>Proposed</th></tr></thead><tbody>{changes.map(([key,before,after])=><tr key={key}><th scope="row">{key}</th><td>{format(before)}</td><td>{format(after)}</td></tr>)}</tbody></table></div>:<p>The evaluated proposal matches your current settings.</p>}
     <button type="button" className="run" disabled={busy||stale||applied} onClick={apply}>{applied?'Proposal applied':'Apply reviewed proposal to Manual Mode'}</button>
    </>}
    {!response.proposed_scenario&&response.audit.length>0&&<p>No qualifying calculated design is available to apply. Review the audit and adjust the goal if needed.</p>}
    {applied&&<p role="status">Proposal applied to Manual Mode. The result charts now show that evaluated design.</p>}
    {run&&<details><summary>Evidence from the calculated design</summary><EvidenceList evidence={run.evidence} sources={run.sources}/></details>}
    <ul>{response.limitations.map(note=><li key={note}>{note}</li>)}</ul>
    <p>AI prose can contain mistakes. Check the tool audit and evidence; the agent cannot apply changes automatically.</p>
   </>}
  </div>
 </section>;
}
