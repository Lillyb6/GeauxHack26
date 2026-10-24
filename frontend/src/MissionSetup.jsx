import { useState } from 'react';
import FieldLabel from './FieldLabel';
import { equipmentLabel } from './equipmentLabels';
import { AtmosphereControls } from './AtmospherePanel';
import { Co2Controls } from './Co2Panel';
import { ThermalControls } from './ThermalPanel';

const steps=['Mission title','Build your mission','Life support','Supplies & power','Optional checks','Ready to launch'];
export default function MissionSetup({ form,setForm,search,setSearch,equipment,environments,controls,name,setName,onNew,onRun,runError,loading,actionState,saveState,library,onResults }) {
 const [step,setStep]=useState(-1),[showLibrary,setShowLibrary]=useState(false);
 const update=(key,value)=>setForm({...form,[key]:value});
 function fields(items){return items.map(([key,label,min,max,increment])=><label key={key} htmlFor={key}><FieldLabel field={key} technical={label}/><input id={key} type="number" required min={min} max={max} step={increment} disabled={(Boolean(form.oxygen_equipment_id)&&['oxygen_capacity_kg_day','electrolyzer_kwh_kg_oxygen'].includes(key))||(Boolean(form.water_equipment_id)&&['recycling_fraction','recycler_power_kw'].includes(key))} value={form[key]} onChange={e=>update(key,e.target.value===''?'':Number(e.target.value))}/></label>);}
 function submit(e){
  e.preventDefault();
  if(step<5){setStep(step+1);return;}
  onRun(e);
 }
 if(showLibrary)return <div className="mission-wizard library-view"><div className="wizard-heading"><button className="wizard-back" onClick={()=>setShowLibrary(false)}>← Back to mission</button><button className="wizard-back" disabled={!name.trim()} onClick={()=>{setShowLibrary(false);setStep(1);}}>Build loaded mission →</button></div><div className="wizard-body">{library}</div></div>;
 if(step===-1)return <section className="mission-wizard mission-launcher"><p className="eyebrow">MISSION OPERATIONS</p><h2>Your next mission<br/>starts here.</h2><p>Name your mission, build a habitat, and run a simulation. Your inputs are saved automatically after a successful run.</p><button className="run" onClick={()=>{onNew();setStep(0);}}>Create new mission →</button><button className="wizard-back" onClick={()=>setShowLibrary(true)}>Open saved missions</button><p className="muted">Saves stay in this browser. Export a mission from your library to keep a separate copy.</p></section>;
 return <form className="mission-wizard config" onSubmit={submit}>
  <div className="wizard-heading"><div className="wizard-step-label"><span>STEP {step+1} / 6</span><button type="button" className="wizard-back" onClick={()=>setStep(-1)}>Mission menu</button></div><h2>{steps[step]}</h2><div className="wizard-progress" aria-hidden="true">{steps.map((_,i)=><span className={i<=step?'filled':''} key={i}/>)}</div>{step>0&&<p className="wizard-mission-name">{name}</p>}</div>
  <div className="wizard-body" key={step}>
   {step===0&&<><p>Give this mission a title. We’ll use it when saving your simulation inputs.</p><label htmlFor="mission_title">Mission title<input id="mission_title" required maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="Example: Ares Base One"/></label><p className="muted">Existing titles are given a number so earlier missions are preserved.</p></>}
   {step===1&&<><label htmlFor="mission_environment">Destination<select id="mission_environment" value={form.environment_id} onChange={e=>update('environment_id',e.target.value)}>{environments.map(env=><option key={env.id} value={env.id}>{env.name}</option>)}</select></label>{fields(controls.slice(0,2))}<p>You can also switch destinations on the center monitor.</p></>}
   {step===2&&<>
    <p className="muted">Choose reference equipment and unit counts.</p>
    {[['oxygen','Oxygen generator','oxygen_generation'],['water','Water recycler','water_recovery']].map(([prefix,label,category])=><div key={prefix}>
     <label htmlFor={`${prefix}_equipment_id`}>{label}<select id={`${prefix}_equipment_id`} value={form[`${prefix}_equipment_id`]??''} onChange={e=>update(`${prefix}_equipment_id`,e.target.value)}>
      {!form[`${prefix}_equipment_id`]&&<option value="" disabled>Custom assumptions active · edit below</option>}
      {equipment.filter(item=>item.category===category).map(item=><option key={item.id} value={item.id}>{equipmentLabel(item)}</option>)}
     </select></label>
     {form[`${prefix}_equipment_id`]&&<label htmlFor={`${prefix}_equipment_quantity`}>Number of {prefix} units<input id={`${prefix}_equipment_quantity`} type="number" required min="0" max="8" step="1" value={form[`${prefix}_equipment_quantity`]} onChange={e=>update(`${prefix}_equipment_quantity`,e.target.value===''?'':Number(e.target.value))}/></label>}
    </div>)}
    <details className="control-group" open={!form.oxygen_equipment_id||!form.water_equipment_id}><summary>Advanced: test your own assumptions</summary>
     <p className="muted">Custom values are hypothetical. Equipment weight is unknown; optimization still searches reference equipment.</p>
     {[['oxygen','oxygen_generation'],['water','water_recovery']].map(([prefix,category])=><div key={prefix}>
      <label className="checkbox-label"><input type="checkbox" checked={!form[`${prefix}_equipment_id`]} onChange={e=>update(`${prefix}_equipment_id`,e.target.checked?null:equipment.find(item=>item.category===category)?.id??null)}/>Use custom {prefix} settings</label>
      {!form[`${prefix}_equipment_id`]&&<div className="custom-equipment">{fields(controls.filter(([key])=>(prefix==='oxygen'?['oxygen_capacity_kg_day','electrolyzer_kwh_kg_oxygen']:['recycling_fraction','recycler_power_kw']).includes(key)))}{prefix==='water'&&<p className="field-help">Assumes unlimited processing capacity.</p>}</div>}
     </div>)}
    </details>
    <p className="muted">Historical reference specs · planetary suitability unverified.</p>
   </>}

   {step===3&&<>{fields(controls.slice(2,6))}</>}
   {step===4&&<><p>Keep these checks off, or expand one to configure it.</p><details className="control-group"><summary>Cabin atmosphere & CO₂</summary><AtmosphereControls form={form} setForm={setForm}/><Co2Controls form={form} setForm={setForm} equipment={equipment}/></details><ThermalControls form={form} setForm={setForm}/><details className="control-group"><summary>Advanced model settings</summary>{fields(controls.slice(6).filter(([key])=>!['oxygen_capacity_kg_day','electrolyzer_kwh_kg_oxygen','recycling_fraction','recycler_power_kw'].includes(key)))}</details><details className="control-group"><summary>Optimization settings</summary>{[['max_oxygen_units','Maximum oxygen units',8],['max_water_units','Maximum water recyclers',8],...(form.co2_enabled?[['max_co2_units','Maximum CO₂ scrubbers',4]]:[])].map(([key,label,max])=><label key={key} htmlFor={key}>{label}<input id={key} type="number" required min="0" max={max} step="1" value={search[key]} onChange={e=>setSearch({...search,[key]:e.target.value===''?'':Number(e.target.value)})}/></label>)}<label className="checkbox-label"><input type="checkbox" checked={search.require_no_wastewater_backlog} onChange={e=>setSearch({...search,require_no_wastewater_backlog:e.target.checked})}/>Require no wastewater waiting at mission end</label></details></>}
   {step===5&&<><p className="eyebrow">PRE-FLIGHT SUMMARY</p><h3>{name}</h3><dl className="launch-summary"><div><dt>Destination</dt><dd>{environments.find(env=>env.id===form.environment_id)?.name}</dd></div><div><dt>Crew</dt><dd>{form.crew_size} members</dd></div><div><dt>Duration</dt><dd>{form.duration_days} Earth days</dd></div><div><dt>Power</dt><dd>{form.generation_kw} kW</dd></div></dl><p>Your titled mission inputs will be saved in this browser after the run. Results can be recreated by loading and rerunning the mission.</p><p className="muted">Optimize searches equipment first. If none pass, it tests power and starting-water increases for you to review before applying.</p><p className="muted">Exploratory model · not a survival certification.</p></>}
  </div>
  {step===5&&<div className="wizard-run-status">{actionState?.status==='done'&&<button type="button" className="result-jump" onClick={onResults}>View {actionState.action==='optimize'?'comparison':'simulation results'} →</button>}{actionState?.status==='error'&&<p role="alert" className="alert">{runError || 'The request failed. Check that the backend is running, then try again.'}</p>}{saveState?.message&&<p role={saveState.error?'alert':'status'} className={saveState.error?'alert':'note'}>{saveState.message}</p>}</div>}
  <div className="wizard-footer"><button type="button" className="wizard-back" disabled={loading} onClick={()=>setStep(step-1)}>← Back</button>{step<5?<button className="run" disabled={loading||(step===0&&!name.trim())} type="submit">{step===0?'Build your mission →':'Continue →'}</button>:<div><button className="run" type="submit" name="action" value="simulate" disabled={loading}>{loading&&actionState?.action==='simulate'?'Running simulation…':'Run simulation →'}</button><button className="wizard-back" type="submit" name="action" value="optimize" disabled={loading}>{loading&&actionState?.action==='optimize'?'Searching & testing improvements…':actionState?.action==='optimize'&&actionState.status==='done'?'✓ Comparison ready · Run again':'Optimize & compare'}</button></div>}</div>
 </form>;
}
