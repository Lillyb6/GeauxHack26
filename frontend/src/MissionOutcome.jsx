const names={cabin_pressure:'Cabin pressure outside range',inspired_oxygen:'Inspired oxygen outside target',inert_diluent:'Not enough inert gas',power:'Power shortage',oxygen:'Oxygen shortage',water:'Water shortage',co2:'CO₂ too high',atmosphere:'Atmosphere outside limits',thermal:'Heating/cooling limit'};
export default function MissionOutcome({result,loading,error,stale,outcomeRef,onOptimize,optimizing=false,disabled=false,optimized=false}) {
 const firstFailure=result?.events?.length?Math.min(...result.events.map(event=>event.hour)):null;
 const completed=result?(result.resource_balance_complete?result.evaluated_hours:Math.max(0,(firstFailure??result.evaluated_hours)-1)):0;
 const outcome=loading?'running':error?'error':result?(result.resource_balance_complete?'success':'failed'):'waiting';
 const unchecked=result?[!result.request.thermal_capacity_enabled&&'Heating/cooling',!result.request.co2_enabled&&'CO₂',!result.request.atmosphere_enabled&&'Atmosphere'].filter(Boolean):[];
 return <section ref={outcomeRef} tabIndex={-1} className={`panel mission-outcome result-target outcome-${outcome}`} aria-label="Mission outcome" aria-live="polite">
  <p className="eyebrow">{optimized?'OPTIMIZED DESIGN':'MISSION OUTCOME'}{stale&&!loading?' · PREVIOUS RUN':''}</p>
  <h2>{loading?'Running…':error?'Run failed':result?(result.resource_balance_complete?'Checks passed':'Mission stopped'):'Ready to run'}</h2>
  {error?<p className="alert">{error}</p>:result&&!loading?<>
   <p className="outcome-duration">{completed} / {result.request.duration_days*24} hours completed</p>
   {!result.resource_balance_complete&&result.events.map((event,index)=><p className="alert" key={index}>{names[event.resource]||`${event.resource.replaceAll('_',' ')} limit`} · hour {event.hour}</p>)}
   <dl className="outcome-readouts"><div><dt>Power needed</dt><dd>{result.demand_kw} kW</dd></div><div><dt>Power available</dt><dd>{result.request.generation_kw} kW</dd></div></dl>
   {unchecked.length>0&&<p className="model-scope">Not checked: {unchecked.join(' · ')}</p>}
   {stale&&<p className="alert">Inputs changed. Run again.</p>}
   <p className="model-scope">Model only · not a safety certification</p>
  </>:!loading&&<p>Run your mission to see results.</p>}
  {result&&<button type="button" className="run" disabled={loading||disabled} onClick={onOptimize}>{optimizing?'Optimizing…':'Optimize & compare →'}</button>}
 </section>;
}
