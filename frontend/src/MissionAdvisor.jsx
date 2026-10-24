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
   const response=await api('/explain',comparison.search_request);
   if(token===generation.current) setAdvice(response);
  } catch {if(token===generation.current)setError('The advisor could not connect. Your computed comparison remains available.');}
  finally {if(token===generation.current)setBusy(false);}
 }
 return <section className="advisor" aria-label="Mission advisor">
  <p className="eyebrow">MISSION ADVISOR / GEMINI</p><h3>Understand your design</h3>
  <p>AI explains calculated results.</p>
  <button className="run" type="button" onClick={explain} disabled={busy||stale}>{busy?'Preparing explanation…':'Explain comparison'}</button>
  <p className="muted">Sends mission settings, results and evidence to Google Gemini.</p>
  {stale&&<p className="alert">Optimize again before requesting advice for changed inputs.</p>}
  <div aria-live="polite" aria-busy={busy}>
   {error&&<p className="alert">{error}</p>}
   {advice&&<>
    <p className="note">{advice.status==='generated'?`AI-generated explanation · ${advice.model}`:'Computed fallback · Gemini unavailable'} — {advice.message}</p>
    <p>{advice.advice.summary}</p>
    <h4>Tradeoffs</h4><ul>{advice.advice.tradeoffs.map((t,i)=><li key={i}>{t}</li>)}</ul>
    <h4>Suggested next steps</h4><ul>{advice.advice.next_steps.map((t,i)=><li key={i}>{t}</li>)}</ul>
    {!!advice.advice.source_ids.length&&<><h4>Referenced evidence</h4><ul>{advice.advice.source_ids.map(id=><li key={id}><a href={advice.sources[id].url} target="_blank" rel="noreferrer">{advice.sources[id].title}</a></li>)}</ul></>}
    <details><summary>Authoritative computed summary and limitations</summary><p>{advice.computed_explanation}</p><ul>{advice.limitations.map(t=><li key={t}>{t}</li>)}</ul></details>
    <p>AI explanations may contain mistakes. Use the calculated comparison and original evidence to verify claims. Resource completion does not certify survival.</p>
   </>}
  </div>
 </section>;
}
