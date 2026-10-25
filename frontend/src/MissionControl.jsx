import { useState } from 'react';
import SurfacePlayback from './SurfacePlayback';

export default function MissionControl({ form, setForm, env, result, stale, sceneOnly = false }) {
 const [selectedCrew, setSelectedCrew] = useState(null);
 const [channel, setChannel] = useState('environment');
 const count = Math.max(0, Math.min(12, Math.floor(Number(form.crew_size) || 0)));
 const currentResult = result && !stale;
 return <section className={sceneOnly ? "mission-control surface-only" : "mission-control"} aria-label="Mission control monitors">
  <aside className="console-monitor operations-monitor">
   <div className="monitor-bar"><span>01 / FLIGHT OPERATIONS</span><i aria-hidden="true"/></div>
   <p className="eyebrow">MISSION CONFIGURATION</p><h2>{env.name} expedition</h2>
   <dl className="console-readouts"><div><dt>Duration</dt><dd>{form.duration_days} <small>Earth days</small></dd></div><div><dt>Crew complement</dt><dd>{count.toString().padStart(2,'0')} <small>members</small></dd></div></dl>
   <div className="crew-stepper"><button aria-label="Remove one crew member" disabled={count<=1} onClick={()=>setForm({...form,crew_size:Math.max(1,count-1)})}>−</button><span>CREW</span><button aria-label="Add one crew member" disabled={count>=12} onClick={()=>setForm({...form,crew_size:Math.min(12,count+1)})}>+</button></div>
   <a className="console-link" href="#crew_size">Edit mission parameters ↘</a>
  </aside>
  <section className="console-monitor center-monitor">
   <div className="monitor-bar"><span>02 / {env.name.toUpperCase()} SURFACE VIEW</span><span>CONFIGURATION PREVIEW</span></div>
   <PlaybackScene result={currentResult?result:null}>
   <div className="planet-scene">
    <img className="planet-art" src={`/mission/${form.environment_id}.webp`} alt={`${env.name} surface artwork`} />
    <div className="scene-label"><span className="signal-dot"/> {env.name.toUpperCase()} / CREW {count.toString().padStart(2,'0')}</div>
    {Array.from({length:count},(_,i)=>{
     const row=Math.floor(i/6), col=i%6;
     const left=14+col*14+(row?5:0);
     const top=69+Math.pow((left-50)/42,2)*14+row*9;
     return <button key={i} className={`crew-sprite ${selectedCrew===i?'selected':''}`} style={{left:`${left}%`,top:`${top}%`}} aria-label={`Inspect crew member ${i+1}`} aria-pressed={selectedCrew===i} onClick={()=>setSelectedCrew(selectedCrew===i?null:i)}><span className="crew-art" aria-hidden="true"/><span className="crew-id">{String(i+1).padStart(2,'0')}</span></button>;
    })}
   </div>
   </PlaybackScene>
   <div className="scene-footer" role="status"><span>{selectedCrew!==null&&selectedCrew<count?`CREW ${String(selectedCrew+1).padStart(2,'0')} / assigned to ${env.name}`:'Select a crew member to inspect'}</span><span>Visual preview · no surface activity model</span></div>
  </section>
  <aside className="console-monitor telemetry-monitor">
   <div className="monitor-bar"><span>03 / SCIENCE & SYSTEMS</span><i aria-hidden="true"/></div>
   <div className="monitor-tabs" role="group" aria-label="Monitor channel"><button aria-pressed={channel==='environment'} onClick={()=>setChannel('environment')}>Environment</button><button aria-pressed={channel==='resources'} onClick={()=>setChannel('resources')}>Resources</button></div>
   {channel==='environment'?<dl className="console-readouts"><div><dt>Surface temperature</dt><dd>{env.temperature_c} <small>°C</small></dd></div><div><dt>Surface pressure</dt><dd>{env.pressure_kpa.toLocaleString()} <small>kPa</small></dd></div><div><dt>Gravity</dt><dd>{env.gravity_ms2} <small>m/s²</small></dd></div></dl>:<dl className="console-readouts"><div><dt>Starting oxygen</dt><dd>{form.oxygen_kg} <small>kg</small></dd></div><div><dt>Starting water</dt><dd>{form.water_kg} <small>kg</small></dd></div><div><dt>Continuous power</dt><dd>{form.generation_kw} <small>kW</small></dd></div></dl>}
   <p className="monitor-caption">{channel==='environment'?'Published reference values · not live telemetry':currentResult?`Last run: ${result.evaluated_hours} hours evaluated`:'Current inputs · run simulation for results'}</p>
  </aside>
 </section>;
}

function PlaybackScene({result,children}){return result?<SurfacePlayback result={result}>{children}</SurfacePlayback>:children;}
