import {useEffect,useMemo,useState} from 'react';
import {playbackFrames,playbackDelay,endings} from './missionPlayback';
const number=value=>Number.isFinite(value)?Number(value.toFixed(2)).toLocaleString():'Not evaluated';
function Gauge({label,value,max,unit,note,failed=false}){
 const known=Number.isFinite(value),scale=Math.max(1,max||0,known?value:0);
 return <div className={`playback-gauge${failed?' gauge-failed':''}`}><label>{label}<span>{number(value)}{known?` ${unit}`:''}</span></label><meter aria-label={`${label}${note?`. ${note}`:''}`} min="0" max={scale} value={known?Math.max(0,value):0}/>{note&&<small>{note}</small>}</div>;
}
export default function SurfacePlayback({result,children}){
 const frames=useMemo(()=>playbackFrames(result),[result]);
 const [index,setIndex]=useState(0),[playing,setPlaying]=useState(()=>!matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{setIndex(0);setPlaying(!matchMedia('(prefers-reduced-motion: reduce)').matches)},[result]);
 const done=index>=frames.length-1;
 useEffect(()=>{
  if(!playing||done)return;
  const timer=setTimeout(()=>setIndex(i=>Math.min(i+1,frames.length-1)),playbackDelay(frames.length));
  return ()=>clearTimeout(timer);
 },[playing,index,done,frames.length]);
 // Reduced motion shows the final recorded state without automatic playback.
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const current=frames[reduced?frames.length-1:Math.min(index,frames.length-1)];
 if(!current)return children;
 const finished=reduced||done,req=result.request,reading=current.reading;
 const success=result.resource_balance_complete;
 const events=result.events??[];
 const first=events.length?Math.min(...events.map(e=>e.hour)):null;
 const failures=[...new Map(events.filter(e=>e.hour===first).map(e=>[e.resource,e])).values()];
 const thermal=result.thermal_summary,air=result.atmosphere_summary;
 const restart=()=>{setIndex(0);setPlaying(true)};
 return <>
  <div className={`surface-playback-scene${finished?success?' playback-success':' playback-failed':''}`}>
   {children}
   {!finished&&<aside className="surface-day-counter"><span>MISSION PLAYBACK</span><h3>{current.day===0?'Before launch':`Day ${current.day}`}<small> / {req.duration_days}</small></h3><div><button type="button" onClick={()=>setPlaying(!playing)}>{playing?'Pause':'Resume'}</button><button type="button" onClick={restart}>Replay</button></div></aside>}
   {finished&&<div className="surface-ending" role="status"><div><h2>{success?'Success':'Failed'}</h2><p className="playback-ending-time">{first===0?'Before launch':success?`${req.duration_days} days completed`:`Day ${Math.ceil(first/24)} · hour ${first}`}</p>{success?<p>Your build completed the planned mission.</p>:failures.map(event=><div className="ending-reason" key={event.resource}><p>{endings[event.resource]?.[0]??event.message}</p><small>{endings[event.resource]?.[1]}</small></div>)}<p className="playback-fiction">{success?'Modeled checks only.':'Fictional ending. Deaths are not simulated.'}</p><button type="button" onClick={restart}>Replay mission</button></div></div>}
  </div>
  <section className="surface-resources" aria-label="Playback resources and systems"><div className="playback-gauges">
   <Gauge label="Oxygen" value={reading.oxygen_kg} max={Math.max(...result.readings.map(r=>r.oxygen_kg))} unit="kg" failed={finished&&failures.some(e=>e.resource==='oxygen')}/>
   <Gauge label="Clean water" value={reading.water_kg} max={Math.max(...result.readings.map(r=>r.water_kg))} unit="kg" failed={finished&&failures.some(e=>e.resource==='water')}/>
   <Gauge label="Battery" value={reading.battery_kwh} max={req.battery_kwh} unit="kWh" failed={finished&&failures.some(e=>e.resource==='power')}/>
   <Gauge label="Power generation" value={req.generation_kw} max={Math.max(req.generation_kw,result.demand_kw)} unit="kW" note={`Demand ${number(result.demand_kw)} kW`} failed={req.generation_kw<result.demand_kw}/>
   <Gauge label="Wastewater backlog" value={reading.wastewater_kg} max={Math.max(...result.readings.map(r=>r.wastewater_kg))} unit="kg" note="Relative to peak backlog, not a failure limit"/>
   {req.thermal_capacity_enabled&&<Gauge label={`${thermal.mode==='cooling'?'Cooling':'Heating'} demand`} value={thermal.required_thermal_kw} max={Math.max(thermal.required_thermal_kw,thermal.available_thermal_kw)} unit="kW" note={`Capacity ${number(thermal.available_thermal_kw)} kW · Target ${req.interior_temperature_c} °C`} failed={!thermal.capacity_sufficient}/>}
   {req.atmosphere_enabled&&air&&<>
    <Gauge label="Cabin pressure" value={air.cabin_pressure_kpa} max={Math.max(103,air.cabin_pressure_kpa)} unit="kPa" note="Range >34.5 to 103" failed={!air.checks.find(c=>c.id==='cabin_pressure')?.passed}/>
    <Gauge label="Inspired oxygen" value={air.inspired_oxygen_partial_pressure_mmhg} max={Math.max(155,air.inspired_oxygen_partial_pressure_mmhg??0)} unit="mmHg" note="Target 145 to 155" failed={!air.checks.find(c=>c.id==='inspired_oxygen')?.passed}/>
    <Gauge label="Inert gas" value={air.assumed_diluent_percent} max={100} unit="%" note="Minimum 30%" failed={!air.checks.find(c=>c.id==='inert_diluent')?.passed}/>
   </>}
   {req.co2_enabled&&<Gauge label="Cabin CO₂" value={reading.co2_hour_average_mmhg??reading.co2_mmhg} max={Math.max(3,...result.readings.map(r=>r.co2_hour_average_mmhg??r.co2_mmhg??0))} unit="mmHg" note="Hourly average limit 3" failed={(reading.co2_hour_average_mmhg??reading.co2_mmhg)>3}/>}
  </div><p className="playback-scope">Recorded simulation · target temperature and cabin settings are fixed, not live measurements.</p></section>
 </>;
}
