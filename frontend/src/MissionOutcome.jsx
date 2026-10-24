export default function MissionOutcome({result,loading,error,stale,outcomeRef}) {
 const firstFailure=result?.events?.length?Math.min(...result.events.map(event=>event.hour)):null;
 // The engine includes the first deficient hour in evaluated_hours, not in completed hours.
 const completed=result?(result.resource_balance_complete?result.evaluated_hours:Math.max(0,(firstFailure??result.evaluated_hours)-1)):0;
 const planned=result?result.request.duration_days*24:0;
 const days=hours=>Number((hours/24).toFixed(2)).toLocaleString();
 const outcome=loading?'running':error?'error':result?(result.resource_balance_complete?'success':'failed'):'waiting';
 return <section ref={outcomeRef} tabIndex={-1} className={`panel mission-outcome result-target outcome-${outcome}`} aria-label="Mission outcome" aria-live="polite">
  <p className="eyebrow">MISSION OUTCOME{stale&&!loading?' / PREVIOUS RUN':''}</p>
  <h2>{loading?'Evaluating your build…':error?'Could not run mission':result?(result.resource_balance_complete?'Success':'Failed'):'Ready to run'}</h2>
  {loading?<p>The simulation is running. Your outcome will appear here.</p>:error?<p>The request failed. Review the error below and try again; no new mission outcome is available.</p>:result?<>
   <p className="outcome-duration">{result.resource_balance_complete?`Completed ${days(completed)} of ${result.request.duration_days} days (${completed} / ${planned} hours).`:`Completed ${completed} full hours (${days(completed)} days) of the planned ${result.request.duration_days} days. First failed check: hour ${firstFailure??result.evaluated_hours}.`}</p>
   <p>{result.resource_balance_complete?'Your build completed the planned duration with all enabled checks passing.':firstFailure===0?'Your build failed a check before the mission started.':'Your build reached a modeled limit before completing the mission.'}</p>
   {!result.resource_balance_complete&&result.events.map((event,index)=><p className="alert" key={`${event.resource}-${index}`}>{event.message}</p>)}
   {stale&&<p className="alert">Inputs have changed. This outcome belongs to the previous build; run again to evaluate your changes.</p>}
   <p className="muted">Outcome covers the modeled checks only. It does not establish real mission safety.</p>
  </>:<p>Run your configured mission to see whether it completes the planned duration.</p>}
 </section>;
}
