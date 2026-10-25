import {rangePlaceholder} from './inputRange';
import {equipmentLabel} from './equipmentLabels';
export function Co2Controls({form,setForm,equipment}) {
 const selected=equipment.find(e=>e.id===form.co2_equipment_id);
 return <fieldset className="optimizer-controls co2-controls"><legend>Cabin CO₂ screening</legend>
  <label className="checkbox-label"><input type="checkbox" checked={form.co2_enabled} onChange={e=>setForm({...form,co2_enabled:e.target.checked})}/>Check carbon dioxide buildup and air-cleaner power</label>
  {!form.co2_enabled?<p className="note">CO₂ screening off.</p>:<>
   <p className="field-help">Crew generates CO₂ inside the sealed cabin. More crew needs more removal; planet atmosphere is not cabin air.</p><label htmlFor="habitat_volume_m3">Air space inside<small className="field-technical">Free cabin volume · m³</small><input id="habitat_volume_m3" type="number" required min="10" max="10000" step="1" value={form.habitat_volume_m3} onChange={e=>setForm({...form,habitat_volume_m3:e.target.value===''?'':Number(e.target.value)})} placeholder={rangePlaceholder(10,10000,'m³')} title={rangePlaceholder(10,10000,'m³')}/></label>
   <label htmlFor="initial_co2_mmhg">Starting carbon dioxide level<small className="field-technical">Initial cabin CO₂ partial pressure · mmHg</small><input id="initial_co2_mmhg" type="number" required min="0" max="20" step="0.01" value={form.initial_co2_mmhg} onChange={e=>setForm({...form,initial_co2_mmhg:e.target.value===''?'':Number(e.target.value)})} placeholder={rangePlaceholder(0,20,'mmHg')} title={rangePlaceholder(0,20,'mmHg')}/></label>
   <label htmlFor="co2_equipment_id">Carbon dioxide cleaner<small className="field-technical">CO₂ scrubber reference</small><select id="co2_equipment_id" value={form.co2_equipment_id} onChange={e=>setForm({...form,co2_equipment_id:e.target.value})}>{equipment.filter(e=>e.category==='co2_removal').map(e=><option key={e.id} value={e.id}>{equipmentLabel(e)}</option>)}</select></label>
   <label htmlFor="co2_equipment_quantity">Number of scrubber units<input id="co2_equipment_quantity" type="number" required min="0" max="4" step="1" value={form.co2_equipment_quantity} onChange={e=>setForm({...form,co2_equipment_quantity:e.target.value===''?'':Number(e.target.value)})} placeholder={rangePlaceholder(0,4,'units')} title={rangePlaceholder(0,4,'units')}/></label>
   <details><summary>Scrubber specifications & assumptions</summary>{selected&&<p>{selected.name} · {selected.co2_capacity_kg_day} kg/day per unit at {selected.reference_ppco2_mmhg} mmHg · {selected.electrical_power_kw} kW/unit · {selected.hardware_mass_kg?.toFixed(3)} kg/unit. <a href={selected.source.url} target="_blank" rel="noreferrer">NASA-authored historical reference ↗</a></p>}
   <p className="note">NASA nominal screening limit: 3 mmHg averaged over one hour. Perfect mixing and the pressure-dependent scrubber curve are unvalidated assumptions; this is not a complete cabin-atmosphere model.</p></details>
  </>}
 </fieldset>;
}

export function Co2Result({result}) {
 if(!result.request.co2_enabled)return <p className="note">CO₂: not evaluated.</p>;
 const end=result.readings[result.readings.length-1],s=result.co2_equipment_summary;
 return <section className="co2-result"><h3>Cabin CO₂ screening</h3>
  <p>{s.quantity} scrubber unit(s) · {s.electrical_power_kw} kW installed load · {s.known_hardware_mass_kg?.toFixed(3) ?? 'Unknown'} kg hardware.</p>
  {result.co2_balance.crew_generation_kg_day!=null&&<p>Crew produces {result.co2_balance.crew_generation_kg_day.toFixed(3)} kg/day. Installed removal capacity: {result.co2_balance.installed_capacity_kg_day.toFixed(3)} kg/day at the reference pressure. {result.co2_balance.capacity_margin_kg_day<0?'Removal cannot keep up indefinitely. Try more scrubber units and check their power demand.':'Reference capacity covers crew generation; room volume and the pressure-dependent response still affect the run.'}</p>}
  <p>Ending partial pressure: {end.co2_mmhg} mmHg. Last evaluated-hour average: {end.co2_hour_average_mmhg ?? 'Not evaluated'} mmHg. Screening limit: 3 mmHg, one-hour mean.</p>
  <p>{result.co2_balance.removed_kg.toFixed(3)} kg removed from the cabin; no oxygen or water recovery credit. Source specifications apply at 2 mmHg; the modeled curve away from that point is unvalidated.</p>
  <a href={s.source.url} target="_blank" rel="noreferrer">{s.source.title} ↗</a>
 </section>;
}
