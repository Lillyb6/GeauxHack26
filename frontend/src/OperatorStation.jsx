import { useEffect, useRef, useState } from 'react';

function Monitor({ id, title, children, className = '' }) {
 return <section className={`operator-monitor station-${id} ${className}`} data-station={id} aria-label={title}>
  <div className="operator-bezel"><span>BE / {title.toUpperCase()}</span><span className="operator-led" aria-hidden="true"/></div>
  <div className="operator-screen" tabIndex={0} aria-label={`${title} monitor content`}>{children}</div>
  <div className="operator-chin"><span>BEYOND EARTH</span><span>● &nbsp; ▰</span></div>
 </section>;
}

export default function OperatorStation({ setup, designer, surface, systems, active, booting = false, editingSetup = false }) {
 const viewport=useRef(null), pointer=useRef(null), wake=useRef(()=>{});
 const [locked,setLocked]=useState(null);
 const [reducedMotion,setReducedMotion]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 const [motion,setMotion]=useState(true);
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setReducedMotion(media.matches);media.addEventListener('change',change);return()=>media.removeEventListener('change',change);},[]);

 function lookAt(id, focus=false) {
  const view=viewport.current, monitor=view?.querySelector(`[data-station="${id}"]`);
  if(!view||!monitor)return;
  pointer.current=null;
  if(window.matchMedia('(max-width: 800px)').matches)monitor.scrollIntoView({block:'start',behavior:'instant'});
  else view.scrollTo({left:monitor.offsetLeft+monitor.offsetWidth/2-view.clientWidth/2,top:monitor.offsetTop+monitor.offsetHeight/2-view.clientHeight/2,behavior:'instant'});
  if(focus)monitor.querySelector('.operator-screen')?.focus({preventScroll:true});
 }
 useEffect(()=>{
  if(!active)return;
  const view=viewport.current;
  const resize=new ResizeObserver(()=>{if(view.clientWidth&&!window.matchMedia('(max-width: 800px)').matches)lookAt(editingSetup?'setup':'surface');});
  resize.observe(view);
  return ()=>resize.disconnect();
 },[active,editingSetup]);
 useEffect(()=>{if(active&&editingSetup){setLocked('setup');lookAt('setup',true);}},[active,editingSetup]);
 useEffect(()=>{
  if(!active||locked||reducedMotion||!motion||booting)return;
  let frame=0,last=null,vx=0,vy=0;
  const edge=(v,size)=>v<size*.4?-(1-v/(size*.4)):v>size*.6?(v-size*.6)/(size*.4):0;
  function update(now) {
   const dt=Math.min((now-(last??now-16.67))/1000,.04);last=now;
   const view=viewport.current,pos=pointer.current;
   const editing=view?.contains(document.activeElement)&&document.activeElement.matches('input,textarea,select,[contenteditable="true"]');
   const moving=pos&&!editing&&!window.matchMedia('(max-width: 800px)').matches;
   const targetX=moving?edge(pos.x,view.clientWidth)*600:0;
   const targetY=moving?edge(pos.y,view.clientHeight)*480:0;
   // Approach the requested velocity gradually; coast to a stop when the pointer leaves.
   const blend=1-Math.exp(-dt/(moving?0.08:0.24));
   vx+=(targetX-vx)*blend;vy+=(targetY-vy)*blend;
   if(view){view.scrollLeft+=vx*dt;view.scrollTop+=vy*dt;}
   if(Math.abs(vx)+Math.abs(vy)+Math.abs(targetX)+Math.abs(targetY)>.5)frame=requestAnimationFrame(update);
   else {frame=0;last=null;vx=vy=0;}
  }
  wake.current=()=>{if(!frame)frame=requestAnimationFrame(update);};
  return ()=>{cancelAnimationFrame(frame);wake.current=()=>{};pointer.current=null;};
 },[active,locked,reducedMotion,motion,booting]);
 function onFocus(e) {
  const monitor=e.target.closest('[data-station]');if(!monitor)return;
  setLocked(monitor.dataset.station);pointer.current=null;
  if(e.target.matches(':focus-visible')&&!window.matchMedia('(max-width: 800px)').matches){
   const view=viewport.current,bounds=e.target.getBoundingClientRect(),outer=view.getBoundingClientRect();
   if(bounds.left<outer.left||bounds.right>outer.right||bounds.top<outer.top||bounds.bottom>outer.bottom)lookAt(monitor.dataset.station);
  }
 }
 useEffect(()=>{if(!active)return;const release=e=>{if(e.key==='Escape'){pointer.current=null;setLocked(null);document.activeElement?.blur();}};window.addEventListener('keydown',release);return()=>window.removeEventListener('keydown',release);},[active]);
 return <div className={`operator-experience ${booting?'station-booting':''}`}>
  <div className="operator-toolbar"><div><span className="operator-live-dot"/> OPERATOR STATION <small>{locked?'Camera locked. Press Escape or click outside a monitor to look around.':'Move toward the edges to glide around. Click a monitor to work.'}</small></div><label className="station-motion"><input type="checkbox" checked={motion&&!reducedMotion} disabled={reducedMotion} onChange={e=>setMotion(e.target.checked)}/> Gentle drift{reducedMotion?' (reduced motion)':''}</label><span className="camera-status" role="status">{booting?'POWERING ON…':locked?'MONITOR FOCUSED':'MISSION CONTROL ONLINE'}</span></div>
  <nav className="station-navigation" aria-label="Choose a mission control monitor">{[['setup','Mission brief'],['surface','Surface'],['systems','Systems & results'],['designer','AI assistance']].map(([id,label])=><button type="button" key={id} disabled={booting} onClick={()=>{setLocked(id);lookAt(id,true);}}>{label}</button>)}</nav>
  <div ref={viewport} className="operator-viewport" onPointerMove={e=>{if(e.pointerType==='mouse'){const rect=e.currentTarget.getBoundingClientRect();pointer.current={x:e.clientX-rect.left,y:e.clientY-rect.top};wake.current();}}} onPointerLeave={()=>{pointer.current=null;wake.current();}} onPointerDown={e=>{pointer.current=null;const monitor=e.target.closest('[data-station]');if(monitor)setLocked(monitor.dataset.station);else{setLocked(null);document.activeElement?.blur();}}} onClick={e=>{const monitor=e.target.closest('[data-station]');if(monitor&&!e.target.closest('.result-jump')&&!window.matchMedia('(max-width: 800px)').matches)lookAt(monitor.dataset.station);}} onFocusCapture={onFocus}>
   <div className="operator-room" inert={booting}>
    <div className="room-wall-label">BEYOND EARTH / HABITAT OPERATIONS DIVISION</div>
    <Monitor id="setup" title="01 / Mission brief">{setup}</Monitor>
    <Monitor id="designer" title="02 / AI assistance">{designer}</Monitor>
    <Monitor id="surface" title="03 / Surface observation">{surface}</Monitor>
    <Monitor id="systems" title="04 / Systems & results">{systems}</Monitor>
    <div className="operator-desk" aria-hidden="true"><div className="desk-keyboard"/><div className="desk-plaque">BEYOND EARTH &nbsp; / &nbsp; FLIGHT DIRECTOR</div></div>
   </div>
  </div>
 </div>;
}
