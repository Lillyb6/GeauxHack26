import { useEffect, useRef, useState } from 'react';
import MissionBuildSummary from './MissionBuildSummary';
import { equipmentLabel } from './equipmentLabels';
import { AtmosphereControls } from './AtmospherePanel';
import { Co2Controls } from './Co2Panel';
import { ThermalControls } from './ThermalPanel';

const steps=['Mission','Starting supplies','Life support','Review'];
const fieldNames={
 crew_size:['Crew size',''],duration_days:['Mission length','Earth days'],
 oxygen_kg:['Stored oxygen','kg'],water_kg:['Clean water','kg'],battery_kwh:['Battery charge','kWh'],generation_kw:['Power generation','kW'],
 oxygen_capacity_kg_day:['Oxygen output','kg/day'],electrolyzer_kwh_kg_oxygen:['Energy per kg oxygen','kWh/kg'],
 recycling_fraction:['Water recovered','%'],recycler_power_kw:['Recycler power','kW'],other_load_kw:['Other power use','kW'],
 interior_temperature_c:['Indoor temperature','°C'],heat_loss_kw_k:['Heat transfer','kW/K'],hvac_cop:['Heating/cooling efficiency','COP'],
};
const customKeys=['oxygen_capacity_kg_day','electrolyzer_kwh_kg_oxygen','recycling_fraction','recycler_power_kw'];

export default function MissionSetup({form,setForm,search,setSearch,equipment,environments,controls,name,setName,onNew,loading,library,onLaunch,onClose,closeLabel='Close editor',editVersion=0}) {
 const [step,setStep]=useState(0),[showLibrary,setShowLibrary]=useState(false);
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
  for(let index=0;index<=Math.min(last,2);index++){
   const panel=formRef.current.querySelector(`[data-editor-step="${index}"]`);
   for(const input of panel.querySelectorAll('input,select')){
    if(!input.disabled&&!input.checkValidity()){revealInvalid(input,index);return false;}
   }
  }
  return true;
 }
 function goTo(next){if(next>step&&!validateThrough(next-1))return;setStep(next);focusHeading();}
 function submit(e){e.preventDefault();if(loading)return;if(step<3){goTo(step+1);return;}if(validateThrough(2))onLaunch();}
 const destination=environments.find(env=>env.id===form.environment_id)?.name||form.environment_id;
 if(showLibrary)return <section className="mission-wizard library-view mission-editor"><div className="wizard-heading"><button type="button" className="wizard-back" onClick={()=>{setShowLibrary(false);focusHeading();}}>← Back to editor</button></div><div className="wizard-body">{library}</div></section>;
 return <form ref={formRef} className="mission-wizard config mission-editor" onSubmit={submit} noValidate>
  <div className="wizard-heading"><div className="editor-library-actions"><button type="button" className="editor-text-action" disabled={loading} onClick={()=>setShowLibrary(true)}>Saved missions</button><button type="button" className="editor-text-action" disabled={loading} onClick={()=>{onNew();setStep(0);focusHeading();}}>New mission</button></div><nav className="editor-step-nav" aria-label="Setup steps">{steps.map((label,index)=><button type="button" key={label} aria-current={step===index?'step':undefined} disabled={loading} onClick={()=>goTo(index)}>{label}</button>)}</nav></div>
  <div className="wizard-body">
   <section data-editor-step="0" hidden={step!==0} aria-label="Mission settings"><h2 ref={step===0?heading:null} tabIndex={-1}>Mission parameters</h2><p className="build-step-intro">Where you’re going. Who’s coming. How long you’ll stay.</p><div className="editor-field-grid"><label className="editor-full" htmlFor="mission_title">Mission name<input id="mission_title" required maxLength={80} value={name} onChange={e=>{e.target.setCustomValidity('');setName(e.target.value);}} placeholder="Ares Base One"/></label><label htmlFor="mission_environment">Destination<select id="mission_environment" value={form.environment_id} onChange={e=>update('environment_id',e.target.value)}>{environments.map(env=><option key={env.id} value={env.id}>{env.name}</option>)}</select></label>{fields(controls.slice(0,2))}</div></section>
   <section data-editor-step="1" hidden={step!==1} aria-label="Starting supplies"><h2 ref={step===1?heading:null} tabIndex={-1}>Starting supplies</h2><p className="build-step-intro">What is available when the mission begins.</p>{[[controls[2],'Used when oxygen production cannot meet crew demand.'],[controls[3],'Supplies the crew and oxygen generation system.'],[controls[4],'Stored energy that covers a power shortfall.']].map(([control,description])=><div className="build-supply-row" key={control[0]}>{fields([control])}<p>{description}</p></div>)}</section>
   <section data-editor-step="2" hidden={step!==2} aria-label="Life support systems"><h2 ref={step===2?heading:null} tabIndex={-1}>Life support systems</h2><p className="build-step-intro">Equipment that keeps the habitat running.</p>
    <div className="build-system-row"><div><h3>Power generation</h3><p>Continuous electrical supply</p></div>{fields([controls[5]])}</div>
    {[['oxygen','Oxygen generation','Produces oxygen using water and power','oxygen_generation'],['water','Water recovery','Processes wastewater into usable water','water_recovery']].map(([prefix,label,description,category])=><div className="build-system-row" key={prefix}><div><h3>{label}</h3><p>{description}</p></div><div><label htmlFor={`${prefix}_equipment_id`}>Design<select id={`${prefix}_equipment_id`} disabled={!form[`${prefix}_equipment_id`]} value={form[`${prefix}_equipment_id`]??''} onChange={e=>update(`${prefix}_equipment_id`,e.target.value)}>{!form[`${prefix}_equipment_id`]&&<option value="">Custom configuration (advanced)</option>}{equipment.filter(item=>item.category===category).map(item=><option key={item.id} value={item.id}>{equipmentLabel(item)}</option>)}</select></label>{form[`${prefix}_equipment_id`]&&<label htmlFor={`${prefix}_equipment_quantity`}>Units<input id={`${prefix}_equipment_quantity`} type="number" required min="0" max="8" step="1" value={form[`${prefix}_equipment_quantity`]} onChange={e=>update(`${prefix}_equipment_quantity`,e.target.value===''?'':Number(e.target.value))}/></label>}</div></div>)}
    <details className="editor-disclosure" open={!form.oxygen_equipment_id||!form.water_equipment_id}><summary>Custom configuration (advanced)</summary><div className="editor-disclosure-body"><p className="build-custom-note">Use only if you have your own equipment specifications.</p>{[['oxygen','oxygen_generation'],['water','water_recovery']].map(([prefix,category])=><section className="build-custom-system" key={prefix}><label className="checkbox-label"><input type="checkbox" checked={!form[`${prefix}_equipment_id`]} onChange={e=>update(`${prefix}_equipment_id`,e.target.checked?null:equipment.find(item=>item.category===category)?.id??null)}/>Use my own {prefix} system</label>{!form[`${prefix}_equipment_id`]&&<div className="editor-field-grid">{fields(controls.filter(([key])=>(prefix==='oxygen'?customKeys.slice(0,2):customKeys.slice(2)).includes(key)))}</div>}</section>)}<p className="editor-help-copy">Custom recovery assumes unlimited processing. Custom equipment mass is unknown.</p></div></details>
    <details className="editor-disclosure"><summary>Additional checks</summary><div className="editor-disclosure-body"><AtmosphereControls form={form} setForm={setForm}/><Co2Controls form={form} setForm={setForm} equipment={equipment}/><ThermalControls form={form} setForm={setForm}/></div></details>
    <details className="editor-disclosure"><summary>Advanced model settings</summary><div className="editor-disclosure-body editor-field-grid">{fields(controls.slice(6).filter(([key])=>!customKeys.includes(key)))}</div><details className="editor-model-help"><summary>Technical names & assumptions</summary><dl>{controls.slice(6).map(([key,technical])=><div key={key}><dt>{fieldNames[key]?.[0]||technical}</dt><dd>{technical}</dd></div>)}</dl><p>Reference equipment uses historical specifications and modeled assumptions, not verified planetary suitability.</p></details></details>
    <details className="editor-disclosure"><summary>Comparison settings</summary><div className="editor-disclosure-body editor-field-grid">{[['max_oxygen_units','Max oxygen units',8],['max_water_units','Max water units',8],...(form.co2_enabled?[['max_co2_units','Max CO₂ units',4]]:[])].map(([key,label,max])=><label htmlFor={key} key={key}>{label}<input id={key} type="number" required min="0" max={max} step="1" value={search[key]} onChange={e=>setSearch({...search,[key]:e.target.value===''?'':Number(e.target.value)})}/></label>)}<label className="checkbox-label editor-full"><input type="checkbox" checked={search.require_no_wastewater_backlog} onChange={e=>setSearch({...search,require_no_wastewater_backlog:e.target.checked})}/>No wastewater left waiting</label></div></details>
   </section>
   <section data-editor-step="3" hidden={step!==3} aria-label="Review mission"><h2 ref={step===3?heading:null} tabIndex={-1}>Review your build</h2><MissionBuildSummary form={form} name={name} destination={destination} equipment={equipment}/><p className="build-step-intro">Run mission evaluates the design and opens the monitors.</p></section>
  </div>
  <div className="wizard-footer"><button type="button" className="wizard-back" disabled={loading} onClick={()=>step===0?onClose?.():goTo(step-1)}>{step===0?closeLabel:'← Back'}</button><button type="submit" className="run" disabled={loading}>{loading?'Running…':['Starting supplies →','Life support →','Review build →','Run mission →'][step]}</button></div>
 </form>;
}
