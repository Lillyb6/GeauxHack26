export function Co2Controls({form,setForm,equipment}) {
 const selected=equipment.find(e=>e.id===form.co2_equipment_id);
 return <fieldset className="optimizer-controls co2-controls"><legend>Cabin CO₂ screening</legend>
  <label className="checkbox-label"><input type="checkbox" checked={form.co2_enabled} onChange={e=>setForm({...form,co2_enabled:e.target.checked})}/>Evaluate cabin CO₂ and scrubber load</label>
  {!form.co2_enabled?<p className="note">CO₂ screening off.</p>:<>
   <label htmlFor="habitat_volume_m3">Free cabin volume · m³<input id="habitat_volume_m3" type="number" required min="10" max="10000" step="1" value={form.habitat_volume_m3} onChange={e=>setForm({...form,habitat_volume_m3:e.target.value===''?'':Number(e.target.value)})}/></label>
   <label htmlFor="initial_co2_mmhg">Initial cabin CO₂ partial pressure · mmHg<input id="initial_co2_mmhg" type="number" required min="0" max="20" step="0.01" value={form.initial_co2_mmhg} onChange={e=>setForm({...form,initial_co2_mmhg:e.target.value===''?'':Number(e.target.value)})}/></label>
   <label htmlFor="co2_equipment_id">CO₂ scrubber reference<select id="co2_equipment_id" value={form.co2_equipment_id} onChange={e=>setForm({...form,co2_equipment_id:e.target.value})}>{equipment.filter(e=>e.category==='co2_removal').map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
   <label htmlFor="co2_equipment_quantity">Number of scrubber units<input id="co2_equipment_quantity" type="number" required min="0" max="4" step="1" value={form.co2_equipment_quantity} onChange={e=>setForm({...form,co2_equipment_quantity:e.target.value===''?'':Number(e.target.value)})}/></label>
   <details><summary>Scrubber specifications & assumptions</summary>{selected&&<p>{selected.co2_capacity_kg_day} kg/day per unit at {selected.reference_ppco2_mmhg} mmHg · {selected.electrical_power_kw} kW/unit · {selected.hardware_mass_kg?.toFixed(3)} kg/unit. <a href={selected.source.url} target="_blank" rel="noreferrer">NASA-authored historical reference ↗</a></p>}
   <p className="note">NASA nominal screening limit: 3 mmHg averaged over one hour. Perfect mixing and the pressure-dependent scrubber curve are unvalidated assumptions; this is not a complete cabin-atmosphere model.</p></details>
  </>}
 </fieldset>;
}

export function Co2Result({result}) {
 if(!result.request.co2_enabled)return <p className="note">CO₂: not evaluated.</p>;
 const end=result.readings[result.readings.length-1],s=result.co2_equipment_summary;
 return <section className="co2-result"><h3>Cabin CO₂ screening</h3>
  <p>{s.quantity} scrubber unit(s) · {s.electrical_power_kw} kW installed load · {s.known_hardware_mass_kg?.toFixed(3) ?? 'Unknown'} kg hardware.</p>
  <p>Ending partial pressure: {end.co2_mmhg} mmHg. Last complete-hour average: {end.co2_hour_average_mmhg ?? 'Not evaluated'} mmHg. Screening limit: 3 mmHg, one-hour mean.</p>
  <p>{result.co2_balance.removed_kg.toFixed(3)} kg removed from the cabin; no oxygen or water recovery credit. Source specifications apply at 2 mmHg; the modeled curve away from that point is unvalidated.</p>
  <a href={s.source.url} target="_blank" rel="noreferrer">{s.source.title} ↗</a>
 </section>;
}
