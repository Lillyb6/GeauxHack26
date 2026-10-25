const labels={cabin_pressure:'Cabin pressure outside range',inspired_oxygen:'Inspired oxygen outside target',inert_diluent:'Not enough inert gas',oxygen:'Oxygen shortage',water:'Water shortage',power:'Power shortage',co2:'CO₂ too high',atmosphere:'Atmosphere outside limits',thermal:'Heating/cooling limit'};
export default function ResultNotices({result}) {
 const unchecked=[!result.request.thermal_capacity_enabled&&'Heating/cooling capacity',!result.request.co2_enabled&&'CO₂',!result.request.atmosphere_enabled&&'Atmosphere'].filter(Boolean);
 const otherWarnings=result.warnings.filter(text=>!text.includes('screening is disabled'));
 return <div className="result-notices">
  {result.events.map((event,i)=><div className="alert" key={i}><strong>{labels[event.resource]||`${event.resource.replaceAll('_',' ')} limit`} · hour {event.hour??result.evaluated_hours}</strong><details><summary>Details</summary><p>{event.message}</p></details></div>)}
  {unchecked.length>0&&<p className="screening-status"><strong>Not checked:</strong> {unchecked.join(' · ')}</p>}
  {otherWarnings.length>0&&<details className="warning-details"><summary>{otherWarnings.length} model {otherWarnings.length===1?'warning':'warnings'} — review</summary><ul>{otherWarnings.map((text,i)=><li key={i}>{text}</li>)}</ul></details>}
  <details><summary>Model limits & full diagnostics</summary><p>{result.scientific_status}</p><ul>{result.warnings.map((text,i)=><li key={i}>{text}</li>)}</ul><p>Resource checks only. Pressure regulation, radiation and planetary qualification are not established.</p></details>
 </div>;
}
