export function ThermalControls({form,setForm}) {
 return <details className="control-group"><summary>Heating & cooling capacity</summary>
  <label className="checkbox-label"><input type="checkbox" checked={form.thermal_capacity_enabled ?? false} onChange={e=>setForm({...form,thermal_capacity_enabled:e.target.checked})}/><span>Check if the system is powerful enough<small className="field-technical">Thermal-capacity screening</small></span></label>
  <p className="note">Enable to check equipment capacity. Electricity demand is always estimated.</p>
  {form.thermal_capacity_enabled && <>
   {[['heating_capacity_kw','Heating available','Total installed heating capacity · kW thermal'],['cooling_capacity_kw','Cooling available','Total installed cooling capacity · kW thermal']].map(([key,label,technical])=><label key={key} htmlFor={key}>{label}<small className="field-technical">{technical}</small><input id={key} type="number" required min="0" max="1000" step="0.1" value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value===''?'':Number(e.target.value)})}/></label>)}
   <p className="note">Enter total output, not electricity consumption. Capacities are your design assumptions, not verified planetary equipment ratings. The equipment search keeps them fixed and excludes thermal hardware mass.</p>
  </>}
 </details>;
}
const fmt=value=>Number(value).toLocaleString(undefined,{maximumFractionDigits:3});
export function ThermalResult({result}) {
 const s=result.thermal_summary;
 if(!s)return null;
 return <section className="thermal-result" aria-label="Heating and cooling result"><h3>Heating & cooling</h3>
  <div className="thermal-quick"><span>{s.mode==='none'?'Heat transfer':s.mode==='heating'?'Heating':'Cooling'} <strong>{fmt(s.required_thermal_kw)} kW thermal</strong></span><span>Electricity <strong>{fmt(s.required_electric_kw)} kW</strong></span></div>
  {!s.enabled?<p className="model-scope">Demand estimate only</p>:<>
   <p className={s.capacity_sufficient?'note':'alert'}>{s.capacity_sufficient?'Selected capacity meets this requirement':'Selected system is too small'}. Available: {fmt(s.available_thermal_kw)} kW thermal · {s.margin_kw<0?'Shortfall':'Spare capacity'}: {fmt(Math.abs(s.margin_kw))} kW thermal.</p>
  </>}
  <details><summary>Calculation & limits</summary><p>Required heat transfer = conductance × indoor/outdoor temperature difference. Required electricity = heat transfer ÷ COP. Electricity is a target requirement, not actual operation after a failed check.</p><ul>{s.limitations.map(text=><li key={text}>{text}</li>)}</ul></details>
 </section>;
}
