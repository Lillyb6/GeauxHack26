const standard='https://ntrs.nasa.gov/api/citations/20250004555/downloads/NASA-STD-3001%20Vol%202%20Rev%20E%20FINAL_05022025.pdf';
const fmt=value=>value==null?'Not defined at this pressure':Number(value).toLocaleString(undefined,{maximumFractionDigits:3});

export function AtmosphereControls({form,setForm}) {
 return <fieldset className="optimizer-controls"><legend>Cabin atmosphere · fixed settings</legend>
  <label className="checkbox-label"><input type="checkbox" checked={form.atmosphere_enabled} onChange={e=>setForm({...form,atmosphere_enabled:e.target.checked})}/>Screen pressure and inspired oxygen</label>
  {!form.atmosphere_enabled?<p className="note">Cabin pressure and oxygen composition are not evaluated. Stored oxygen is a separate supply inventory.</p>:<>
   <label htmlFor="cabin_pressure_kpa">Total cabin pressure · kPa absolute<input id="cabin_pressure_kpa" type="number" required min="0" max="200" step="0.001" value={form.cabin_pressure_kpa} onChange={e=>setForm({...form,cabin_pressure_kpa:e.target.value===''?'':Number(e.target.value)})}/></label>
   <label htmlFor="cabin_oxygen_percent">Dry cabin oxygen · % by volume<input id="cabin_oxygen_percent" type="number" required min="0" max="100" step="0.01" value={form.cabin_oxygen_percent} onChange={e=>setForm({...form,cabin_oxygen_percent:e.target.value===''?'':Number(e.target.value)})}/></label>
   <p>Remaining dry gas is assumed inert diluent, nominally nitrogen. These are fixed design settings; no regulator, leak or gas-tank model maintains them.</p>
   <p className="note">Nominal screen: total pressure &gt;34.5 to ≤103 kPa, inspired O₂ 145–155 mmHg and ≥30% inert diluent. Inspired O₂ includes the 47 mmHg airway-water correction; it differs from dry cabin oxygen partial pressure.</p>
   <a href={standard} target="_blank" rel="noreferrer">NASA-STD-3001 Vol 2 Rev E · reference criteria ↗</a>
  </>}
 </fieldset>;
}

export function AtmosphereResult({result}) {
 const summary=result.atmosphere_summary;
 if(!summary)return <p className="note">Cabin atmosphere screening disabled for this run. Pressure and inspired oxygen are not evaluated.</p>;
 return <section className="atmosphere-result" aria-label="Cabin atmosphere screening result"><h3>Cabin atmosphere · static screen</h3>
  <p className={summary.status==='within_nominal_screen'?'note':'alert'}>{summary.status==='within_nominal_screen'?'Within selected nominal atmosphere criteria':'Outside selected nominal atmosphere criteria'}. This is a setpoint check, not a dynamic pressure simulation or safety certification.</p>
  <dl className="atmosphere-metrics"><div><dt>Total cabin pressure</dt><dd>{fmt(summary.cabin_pressure_kpa)} kPa</dd></div><div><dt>Dry cabin O₂</dt><dd>{fmt(summary.cabin_oxygen_percent)}%</dd></div><div><dt>Dry oxygen partial pressure</dt><dd>{fmt(summary.dry_oxygen_partial_pressure_kpa)} kPa</dd></div><div><dt>Inspired oxygen partial pressure</dt><dd>{fmt(summary.inspired_oxygen_partial_pressure_mmhg)}{summary.inspired_oxygen_partial_pressure_mmhg!=null?' mmHg':''}</dd></div></dl>
  <ul>{summary.checks.map(check=><li key={check.id}><strong>{check.passed?'Meets screen':'Outside screen'}: {check.label}</strong> — {check.criterion}</li>)}</ul>
  <a href={standard} target="_blank" rel="noreferrer">Source: NASA-STD-3001 Vol 2 Rev E, V2 6002/6003/6006 ↗</a>
  <details><summary>Atmosphere equations and scope</summary><p>Dry ppO₂ = pressure × oxygen fraction. Inspired PIO₂ = (pressure in mmHg − 47) × oxygen fraction. The 47 mmHg correction is airway water vapor at body temperature, not cabin humidity.</p><ul>{summary.limitations.map(text=><li key={text}>{text}</li>)}</ul></details>
 </section>;
}
