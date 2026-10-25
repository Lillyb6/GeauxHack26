import { useEffect, useRef, useState } from 'react';
import { equipmentLabel } from './equipmentLabels';
import { AtmosphereControls } from './AtmospherePanel';
import { Co2Controls } from './Co2Panel';
import { ThermalControls } from './ThermalPanel';

const steps=['Mission','Supplies','Review'];
const fieldNames={
 crew_size:['Crew size',''],duration_days:['Mission length','Earth days'],
 oxygen_kg:['Oxygen','kg'],water_kg:['Water','kg'],battery_kwh:['Battery','kWh'],generation_kw:['Power generation','kW'],
 oxygen_capacity_kg_day:['Oxygen output','kg/day'],electrolyzer_kwh_kg_oxygen:['Energy per kg oxygen','kWh/kg'],
 recycling_fraction:['Water recovered','%'],recycler_power_kw:['Recycler power','kW'],other_load_kw:['Other power use','kW'],
 interior_temperature_c:['Indoor temperature','°C'],heat_loss_kw_k:['Heat transfer','kW/K'],hvac_cop:['Heating/cooling efficiency','COP'],
};
const customKeys=['oxygen_capacity_kg_day','electrolyzer_kwh_kg_oxygen','recycling_fraction','recycler_power_kw'];

export default function MissionSetup({form,setForm,search,setSearch,equipment,environments,controls,name,setName,onNew,loading,library,onLaunch,onClose,closeLabel='Close editor',editVersion=0}) {
 const [step,setStep]=useState(0),[showLibrary,setShowLibrary]=useState(false),[showSupplyHelp,setShowSupplyHelp]=useState(false);
 const formRef=useRef(null),heading=useRef(null);
 useEffect(()=>{if(editVersion>0){setStep(0);setShowLibrary(false);}},[editVersion]);
 const update=(key,value)=>setForm({...form,[key]:value});
 function fields(items){return items.map(([key,technical,min,max,increment])=>{
  const [label,unit]=fieldNames[key]||[technical,''];
  const percentage=key==='recycling_fraction';
  const display=form[key]===''?'':percentage?Number((form[key]*100).toFixed(6)):form[key];
  return <label key={key} htmlFor={key}>{label}{unit&&<> <span className="editor-unit">{unit}</span></>}<input id={key} type="number" required min={percentage?min*100:min} max={percentage?max*100:max} step={percentage?increment*100:increment} value={display} onChange={e=>update(key,e.target.value===''?'':Number(e.target.value)/(percentage?100:1))}/></label>;
 });}
 function focusHeading(){requestAnimationFrame(()=>heading.current?.focus());}
 function revealInvalid(input,index){
  let parent=input.parentElement;
  while(parent&&parent!==formRef.current){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement;}
  setStep(index);
  requestAnimationFrame(()=>{input.reportValidity();input.focus();input.scrollIntoView({block:'nearest',behavior:'instant'});});
 }
 function validateThrough(last){
  const title=formRef.current.querySelector('#mission_title');
  title.setCustomValidity(name.trim()?'':'Enter a mission name.');
  for(let index=0;index<=Math.min(last,1);index++){
   const panel=formRef.current.querySelector(`[data-editor-step="${index}"]`);
   for(const input of panel.querySelectorAll('input,select')){
    if(!input.disabled&&!input.checkValidity()){revealInvalid(input,index);return false;}
   }
  }
  return true;
 }
 function goTo(next){if(next>step&&!validateThrough(next-1))return;setStep(next);focusHeading();}
 function submit(e){e.preventDefault();if(loading)return;if(step<2){goTo(step+1);return;}if(validateThrough(1))onLaunch();}
 const destination=environments.find(env=>env.id===form.environment_id)?.name||form.environment_id;
 const enabledChecks=[form.thermal_capacity_enabled?'Heating/cooling':null,form.atmosphere_enabled?'Cabin air':null,form.co2_enabled?'CO₂':null].filter(Boolean);
 if(showLibrary)return <section className="mission-wizard library-view mission-editor"><div className="wizard-heading"><button type="button" className="wizard-back" onClick={()=>{setShowLibrary(false);focusHeading();}}>← Back to editor</button></div><div className="wizard-body">{library}</div></section>;
 return <form ref={formRef} className="mission-wizard config mission-editor" onSubmit={submit} noValidate>
  <div className="wizard-heading"><div className="editor-library-actions"><button type="button" className="editor-text-action" disabled={loading} onClick={()=>setShowLibrary(true)}>Saved missions</button><button type="button" className="editor-text-action" disabled={loading} onClick={()=>{onNew();setStep(0);setShowSupplyHelp(false);focusHeading();}}>New mission</button></div><nav className="editor-step-nav" aria-label="Setup steps">{steps.map((label,index)=><button type="button" key={label} aria-current={step===index?'step':undefined} disabled={loading} onClick={()=>goTo(index)}>{index+1}. {label}</button>)}</nav></div>
  <div className="wizard-body">
   <section data-editor-step="0" hidden={step!==0} aria-label="Mission settings"><h2 ref={step===0?heading:null} tabIndex={-1}>Your mission</h2><div className="editor-field-grid"><label className="editor-full" htmlFor="mission_title">Mission name<input id="mission_title" required maxLength={80} value={name} onChange={e=>{e.target.setCustomValidity('');setName(e.target.value);}} placeholder="Ares Base One"/></label><label className="editor-full" htmlFor="mission_environment">Destination<select id="mission_environment" value={form.environment_id} onChange={e=>update('environment_id',e.target.value)}>{environments.map(env=><option key={env.id} value={env.id}>{env.name}</option>)}</select></label>{fields(controls.slice(0,2))}</div></section>
   <section data-editor-step="1" hidden={step!==1} aria-label="Supplies and settings"><h2 ref={step===1?heading:null} tabIndex={-1}>Supplies & power</h2><div className="editor-field-grid">{fields([controls[2],controls[3],controls[5],controls[4]])}</div><button type="button" className="editor-inline-help" aria-expanded={showSupplyHelp} aria-controls="editor-supply-help" onClick={()=>setShowSupplyHelp(!showSupplyHelp)}>What’s the difference?</button><p id="editor-supply-help" className="editor-help-copy" hidden={!showSupplyHelp}>Supplies are what you bring. Power runs equipment; the battery stores energy.</p>
    <section className="editor-life-support" aria-labelledby="life-support-heading"><h2 id="life-support-heading">Life support</h2><div className="editor-life-support-grid">{[['oxygen','Oxygen generation system','oxygen_generation'],['water','Water recovery system','water_recovery']].map(([prefix,label,category])=><section className="editor-subsection" key={prefix}><h3>{label}</h3><label htmlFor={`${prefix}_equipment_id`}>Equipment<select id={`${prefix}_equipment_id`} value={form[`${prefix}_equipment_id`]??''} onChange={e=>update(`${prefix}_equipment_id`,e.target.value||null)}><option value="">Custom design</option>{equipment.filter(item=>item.category===category).map(item=><option key={item.id} value={item.id}>{equipmentLabel(item)}</option>)}</select></label>{form[`${prefix}_equipment_id`]?<label htmlFor={`${prefix}_equipment_quantity`}>Units<input id={`${prefix}_equipment_quantity`} type="number" required min="0" max="8" step="1" value={form[`${prefix}_equipment_quantity`]} onChange={e=>update(`${prefix}_equipment_quantity`,e.target.value===''?'':Number(e.target.value))}/></label>:<div className="editor-field-grid">{fields(controls.filter(([key])=>(prefix==='oxygen'?customKeys.slice(0,2):customKeys.slice(2)).includes(key)))}</div>}</section>)}
    </div></section><details className="editor-disclosure"><summary>Advanced settings</summary><div className="editor-disclosure-body"><section className="editor-subsection"><h3>Habitat settings</h3><div className="editor-field-grid">{fields(controls.slice(6).filter(([key])=>!customKeys.includes(key)))}</div></section>
    <details className="editor-model-help"><summary>About these settings</summary><dl>{controls.slice(6).map(([key,technical])=><div key={key}><dt>{fieldNames[key]?.[0]||technical}</dt><dd>{technical}{key==='recycling_fraction'?' · displayed as a percentage; stored as a fraction.':key==='heat_loss_kw_k'?' · higher values mean more heat transfer.':key==='hvac_cop'?' · thermal output per unit of electricity.':''}</dd></div>)}</dl><p>Custom water recovery has no processing limit; custom equipment mass is unknown. Reference equipment uses published specifications and modeled assumptions, not verified planetary suitability.</p></details>
    </div></details>
    <details className="editor-disclosure"><summary>Optional checks</summary><div className="editor-disclosure-body"><AtmosphereControls form={form} setForm={setForm}/><Co2Controls form={form} setForm={setForm} equipment={equipment}/><ThermalControls form={form} setForm={setForm}/></div></details>
    <details className="editor-disclosure"><summary>Comparison settings</summary><div className="editor-disclosure-body editor-field-grid">{[['max_oxygen_units','Max oxygen units',8],['max_water_units','Max water units',8],...(form.co2_enabled?[['max_co2_units','Max CO₂ units',4]]:[])].map(([key,label,max])=><label htmlFor={key} key={key}>{label}<input id={key} type="number" required min="0" max={max} step="1" value={search[key]} onChange={e=>setSearch({...search,[key]:e.target.value===''?'':Number(e.target.value)})}/></label>)}<label className="checkbox-label editor-full"><input type="checkbox" checked={search.require_no_wastewater_backlog} onChange={e=>setSearch({...search,require_no_wastewater_backlog:e.target.checked})}/>No wastewater left waiting</label></div></details>
   </section>
   <section data-editor-step="2" hidden={step!==2} aria-label="Review mission"><div className="editor-review-heading"><div><h2 ref={step===2?heading:null} tabIndex={-1}>{name}</h2><p>{destination} · {form.crew_size} crew · {form.duration_days} days</p></div><button type="button" className="editor-inline-help" onClick={()=>goTo(0)}>Edit mission</button></div><dl className="editor-review-values">{[['Oxygen',`${form.oxygen_kg} kg`],['Water',`${form.water_kg} kg`],['Power generation',`${form.generation_kw} kW`],['Battery',`${form.battery_kwh} kWh`]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p className="editor-review-checks">Optional checks: {enabledChecks.length?enabledChecks.join(', '):'off'}</p><button type="button" className="editor-inline-help" onClick={()=>goTo(1)}>Edit supplies & settings</button><p className="editor-result-hint">Results appear in Systems & results.</p></section>
  </div>
  <div className="wizard-footer"><button type="button" className="wizard-back" disabled={loading} onClick={()=>step===0?onClose?.():goTo(step-1)}>{step===0?closeLabel:'← Back'}</button><button type="submit" className="run" disabled={loading}>{loading?'Running…':step===0?'Next: supplies →':step===1?'Review mission →':'Run mission →'}</button></div>
 </form>;
}
