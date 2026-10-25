import { useEffect, useRef, useState } from 'react';
import { api } from './api';

export default function MissionAdvisor({ comparison, stale }) {
 const [advice,setAdvice]=useState(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const generation=useRef(0);
 useEffect(()=>{generation.current++;setAdvice(null);setError('');setBusy(false);},[comparison]);
 async function explain() {
  const token=++generation.current;
  setBusy(true);setError('');setAdvice(null);
  try {
   const response=await api(comparison.recovery_attempted?'/explain-improvement':'/explain',comparison.search_request);
   if(token===generation.current) setAdvice(response);
  } catch {if(token===generation.current)setError('The advisor could not connect. Your computed comparison remains available.');}
  finally {if(token===generation.current)setBusy(false);}
 }
 return <section className="advisor" aria-label="Mission advisor">
  <p className="eyebrow">MISSION ADVISOR / GEMINI</p><h3>Why the optimized design works</h3>

  <button className="run" type="button" onClick={explain} disabled={busy||stale}>{busy?'Preparing explanation…':'Explain my results'}</button>
  <p className="muted">Shares settings & results with Gemini.</p>
  {stale&&<p className="alert">Optimize again before requesting advice for changed inputs.</p>}
  <div aria-live="polite" aria-busy={busy}>
   {error&&<p className="alert">{error}</p>}
   {advice&&<>
    <p className="model-scope">{advice.status==='generated'?'AI explanation':'Calculated guidance · AI unavailable'}</p>
    <details><summary>Overview & AI status</summary><p>{advice.advice.summary}</p><p>{advice.message}</p></details>
    <h4>Your design</h4><p>{advice.advice.why_manual_failed || (comparison.manual.resource_balance_complete?'Your manual design completed the selected resource checks.':`Your manual run stopped at hour ${comparison.manual.evaluated_hours}. See its stopping events in the comparison.`)}</p>
    {!!advice.resource_comparison?.length&&<details><summary>Compare resources</summary><div className="table-wrap"><table><caption>Your resources before and after optimization</caption><thead><tr><th>Resource</th><th>Your design</th><th>Optimized</th></tr></thead><tbody>{advice.resource_comparison.map(row=><tr key={row.resource}><th scope="row">{row.resource}</th><td>{row.manual}</td><td>{row.optimized}</td></tr>)}</tbody></table></div></details>}
    <h4>Optimized design</h4><p>{advice.advice.why_optimized_worked || (comparison.optimized?`The proposed settings were tested and completed ${comparison.optimized.evaluated_hours} hours. The resource changes are shown above.`:'No proposed design has passed the selected checks yet.')}</p>
    <details><summary>Tradeoffs & next steps</summary><h4>What you need to add</h4><ul>{advice.advice.tradeoffs.map((t,i)=><li key={i}>{t}</li>)}</ul>
    <h4>What to do next</h4><ul>{advice.advice.next_steps.map((t,i)=><li key={i}>{t}</li>)}</ul></details>
    {!!advice.advice.source_ids.length&&<><h4>Referenced evidence</h4><ul>{advice.advice.source_ids.map(id=><li key={id}><a href={advice.sources[id].url} target="_blank" rel="noreferrer">{advice.sources[id].title}</a></li>)}</ul></>}
    <details><summary>Full results & limits</summary><p>{advice.computed_explanation}</p><ul>{advice.limitations.map(t=><li key={t}>{t}</li>)}</ul></details>
    <p>AI text requires review against calculated results.</p>
   </>}
  </div>
 </section>;
}
