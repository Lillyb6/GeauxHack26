import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import EquipmentSummary from './EquipmentSummary';
import WaterEquipmentSummary from './WaterEquipmentSummary';
import EvidenceList from './EvidenceList';
import MissionAdvisor from './MissionAdvisor';
import {Co2Result} from './Co2Panel';
import {AtmosphereResult} from './AtmospherePanel';
const fmt = (v,unit='') => v == null ? 'Unknown / not established' : `${Number(v).toLocaleString(undefined,{maximumFractionDigits:3})}${unit}`;
const status = r => !r ? 'No recommendation' : r.resource_balance_complete ? 'Resource checks completed' : 'Resource constraint reached';
function inventory(r,field) {return r ? r.readings[r.readings.length-1][field] : null;}
export default function DesignComparison({comparison,stale,active=true}) {
 const [metric,setMetric]=useState('water_kg');
 const {manual,optimized}=comparison;
 const series=useMemo(()=>{
   if(!optimized) return [];
   return Array.from({length:Math.max(manual.readings.length,optimized.readings.length)},(_,hour)=>({
      hour,manual:manual.readings[hour]?.[metric] ?? null,optimized:optimized.readings[hour]?.[metric] ?? null,
   }));
 },[manual,optimized,metric]);
 const rows=[
   ['Resource outcome',status(manual),status(optimized)],
   ['Hours evaluated',`${manual.evaluated_hours} / ${manual.request.duration_days*24}`,optimized ? `${optimized.evaluated_hours} / ${optimized.request.duration_days*24}` : '—'],
   ['Known installed equipment hardware mass',fmt(comparison.manual_known_hardware_mass_kg,' kg'),fmt(comparison.optimized_known_hardware_mass_kg,' kg')],
   ['Continuous modeled demand',fmt(manual.demand_kw,' kW'),fmt(optimized?.demand_kw,' kW')],
   ['Atmosphere nominal screen',manual.atmosphere_summary?.status?.replaceAll('_',' ') || 'Not evaluated',optimized?.atmosphere_summary?.status?.replaceAll('_',' ') || 'Not evaluated'],
   ['End oxygen',fmt(inventory(manual,'oxygen_kg'),' kg'),fmt(inventory(optimized,'oxygen_kg'),' kg')],
   ['End usable water',fmt(inventory(manual,'water_kg'),' kg'),fmt(inventory(optimized,'water_kg'),' kg')],
   ['End battery charge',fmt(inventory(manual,'battery_kwh'),' kWh'),fmt(inventory(optimized,'battery_kwh'),' kWh')],
   ['End cabin CO₂ (screening enabled only)',fmt(inventory(manual,'co2_mmhg'),' mmHg'),fmt(inventory(optimized,'co2_mmhg'),' mmHg')],
   ['Unprocessed wastewater',fmt(inventory(manual,'wastewater_kg'),' kg'),fmt(inventory(optimized,'wastewater_kg'),' kg')],
 ];
 return <section className="panel comparison" aria-label="Manual and optimized design comparison">
  <p className="eyebrow">DETERMINISTIC SEARCH / EQUIPMENT TRADEOFFS</p><h2>{optimized?'Manual vs optimized design':'No feasible candidate in this search'}</h2>
  {stale && <p className="alert">Current inputs or search settings differ from this saved comparison. Optimize again to update it.</p>}
  <details><summary>Search explanation</summary><p>{comparison.explanation}</p></details><p>{comparison.feasible_count} feasible · {comparison.evaluated_count} evaluated · {comparison.excluded_count} excluded from ranking</p>
  <p className="note">Feasible under current model assumptions only. Water yield, thermal behavior, pressure, radiation and environmental qualification remain unresolved.</p>
  <div className="table-wrap"><table><caption>Same planet, crew, duration, starting supplies, power generation and thermal inputs. End inventories may represent different evaluated durations.</caption><thead><tr><th>Metric</th><th>Manual baseline</th><th>Best eligible catalog configuration</th></tr></thead><tbody>{rows.map(([name,a,b])=><tr key={name}><th scope="row">{name}</th><td>{a}</td><td>{b}</td></tr>)}</tbody></table></div>
  {comparison.known_hardware_mass_saving_kg != null && <p>Manual hardware mass minus recommended hardware mass: <strong>{fmt(comparison.known_hardware_mass_saving_kg,' kg')}</strong>. A negative value means additional equipment mass, not a saving.</p>}
  <details><summary>Mass scope & constraint counts</summary><p>Mass covers oxygen/water equipment and CO₂ scrubbers when screening is enabled. Custom-mode mass is unknown; supplies are fixed, and total mission mass is not estimated.</p>
  {!!Object.keys(comparison.constraint_failure_counts).length && <p>Candidate constraint counts: {Object.entries(comparison.constraint_failure_counts).map(([name,count])=>`${name.replaceAll('_',' ')} ${count}`).join(' · ')}. Counts may overlap and record only observed stopping conditions/end backlog.</p>}
  </details><div className="comparison-risks"><div><h3>Manual risks / constraints</h3><ul>{[...manual.events.map(e=>e.message),...manual.warnings].map((note,i)=><li key={i}>{note}</li>)}</ul>{!manual.events.length&&!manual.warnings.length&&<p>No shortage or capacity warning within the limited resource model.</p>}</div>{optimized&&<div><h3>Recommended risks / constraints</h3><ul>{[...optimized.events.map(e=>e.message),...optimized.warnings].map((note,i)=><li key={i}>{note}</li>)}</ul>{!optimized.events.length&&!optimized.warnings.length&&<p>No shortage or capacity warning within the limited resource model.</p>}</div>}</div>
  {optimized&&<>
   <details><summary>Recommended equipment & screening</summary><EquipmentSummary equipment={optimized.equipment_summary} title="Recommended oxygen equipment"/>
   <WaterEquipmentSummary equipment={optimized.water_equipment_summary} title="Recommended water equipment"/><AtmosphereResult result={optimized}/><Co2Result result={optimized}/></details>
   <details className="comparison-graphs"><summary>Comparison graphs</summary><label className="chart-selector" htmlFor="comparison_metric">Compare inventory<select id="comparison_metric" value={metric} onChange={e=>setMetric(e.target.value)}><option value="water_kg">Usable water · kg</option><option value="oxygen_kg">Oxygen · kg</option><option value="battery_kwh">Battery · kWh</option><option value="wastewater_kg">Waiting wastewater · kg</option>{manual.request.co2_enabled&&<option value="co2_hour_average_mmhg">Cabin CO₂ · hourly mean mmHg</option>}</select></label>
   {active&&<div role="img" aria-label="Manual and optimized inventory over simulated hours" style={{height:240}}><ResponsiveContainer width="100%" height="100%"><LineChart data={series}><CartesianGrid stroke="#233445" strokeDasharray="3 5"/><XAxis dataKey="hour" stroke="#99aabd" minTickGap={35}/><YAxis stroke="#99aabd" width={55}/><Tooltip contentStyle={{background:'#12202d',border:'1px solid #375166'}}/><Legend/>{metric==='co2_hour_average_mmhg'&&<ReferenceLine y={3} stroke="#f38b91" strokeDasharray="4 4" label={{value:'3 mmHg screening',fill:'#f38b91',position:'insideTopRight'}}/>}<Line name="Manual" dataKey="manual" stroke="#eab676" dot={false} connectNulls={false} isAnimationActive={false}/><Line name="Optimized" dataKey="optimized" stroke="#73d9c5" dot={false} connectNulls={false} isAnimationActive={false}/></LineChart></ResponsiveContainer></div>}</details>
   <p>Lines stop when their simulation stops; values are not extended past a failed run.</p>
   <details><summary>Recommended design evidence</summary><EvidenceList evidence={optimized.evidence} sources={optimized.sources}/></details>
  </>}
  <MissionAdvisor comparison={comparison} stale={stale}/>
  <details><summary>Search bounds, candidate audit and limitations</summary><p>{comparison.objective}. Counts searched: oxygen 0–{comparison.search_request.max_oxygen_units}; water 0–{comparison.search_request.max_water_units}. CO₂ counts: {manual.request.co2_enabled?`0–${comparison.search_request.max_co2_units}`:'not evaluated'}. No-backlog constraint: {comparison.search_request.require_no_wastewater_backlog?'enabled':'disabled'}.</p><ul>{comparison.limitations.map(note=><li key={note}>{note}</li>)}</ul><div className="table-wrap"><table><caption>Every enumerated candidate</caption><thead><tr><th>O₂ units</th><th>Water units</th><th>CO₂ units</th><th>Known kg</th><th>kW</th><th>Outcome</th></tr></thead><tbody>{comparison.candidates.map(c=><tr key={`${c.oxygen_units}-${c.water_units}-${c.co2_units}`}><td>{c.oxygen_units}</td><td>{c.water_units}</td><td>{c.co2_units ?? 'Off'}</td><td>{fmt(c.known_hardware_mass_kg)}</td><td>{fmt(c.demand_kw)}</td><td>{c.exclusion_reason || (c.feasible?'Completed':c.constraints_failed.join(', '))}</td></tr>)}</tbody></table></div></details>
 </section>;
}
