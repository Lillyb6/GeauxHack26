import { useEffect, useRef, useState } from 'react';


function Monitor({ id, title, children, className = '' }) {
 return <section className={`operator-monitor station-${id} ${className}`} data-station={id} aria-label={title}>
  <div className="operator-bezel"><span>BE / {title.toUpperCase()}</span><span className="operator-led" aria-hidden="true"/></div>
  <div className="operator-screen" tabIndex={0} aria-label={`${title} monitor content`}>{children}</div>
  <div className="operator-chin"><span>BEYOND EARTH</span><span>● &nbsp; ▰</span></div>
 </section>;
}

export default function OperatorStation({ setup, designer, surface, systems, active }) {
 const viewport=useRef(null), pointer=useRef(null), lastTime=useRef(null);
 const [locked,setLocked]=useState(null);
 const reducedMotion=useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches);

 function lookAt(id, focus=false) {
  const view=viewport.current, monitor=view?.querySelector(`[data-station="${id}"]`);
  if(!view||!monitor)return;
  pointer.current=null;

  if(window.matchMedia('(max-width: 800px)').matches){monitor.scrollIntoView({block:'start',behavior:'instant'});}
  else {
   view.scrollTo({left:monitor.offsetLeft+monitor.offsetWidth/2-view.clientWidth/2,top:monitor.offsetTop+monitor.offsetHeight/2-view.clientHeight/2,behavior:'instant'});
  }
  if(focus)monitor.querySelector('.operator-screen')?.focus({preventScroll:true});
 }
 useEffect(()=>{
  const view=viewport.current;
  const resize=new ResizeObserver(()=>{if(view.clientWidth)lookAt('surface');});
  resize.observe(view);
  return ()=>resize.disconnect();
 },[]);
 useEffect(()=>{
  if(!active||locked||reducedMotion.current)return;
  let frame;
  function update(now) {
   const dt=Math.min((now-(lastTime.current??now))/1000,.04);
   lastTime.current=now;
   const view=viewport.current, pos=pointer.current;
   if(view&&pos&&!window.matchMedia('(max-width: 800px)').matches) {
    const editing=view.contains(document.activeElement)&&document.activeElement.matches('input,textarea,select,[contenteditable="true"]');
    if(!editing) {
     const edgeSpeed=(v,size)=>v<size*.19?-(1-v/(size*.19)):v>size*.81?(v-size*.81)/(size*.19):0;
     view.scrollLeft+=edgeSpeed(pos.x,view.clientWidth)*700*dt;
     view.scrollTop+=edgeSpeed(pos.y,view.clientHeight)*550*dt;
    }
   }
   frame=requestAnimationFrame(update);
  }
  frame=requestAnimationFrame(update);
  return ()=>{cancelAnimationFrame(frame);lastTime.current=null;pointer.current=null;};
 },[active,locked]);
 function onFocus(e) {
  const monitor=e.target.closest('[data-station]');
  if(!monitor)return;
  setLocked(monitor.dataset.station);pointer.current=null;
  // Keyboard focus reveals controls even when their monitor begins off camera.
  if(e.target.matches(':focus-visible')&&!window.matchMedia('(max-width: 800px)').matches){
   const view=viewport.current, bounds=e.target.getBoundingClientRect(), outer=view.getBoundingClientRect();
   if(bounds.left<outer.left||bounds.right>outer.right||bounds.top<outer.top||bounds.bottom>outer.bottom)lookAt(monitor.dataset.station);
  }
 }
 useEffect(()=>{if(!active)return;const release=e=>{if(e.key==='Escape'){pointer.current=null;setLocked(null);document.activeElement?.blur();}};window.addEventListener('keydown',release);return()=>window.removeEventListener('keydown',release);},[active]);
 return <div className="operator-experience">
  <div className="operator-toolbar"><div><span className="operator-live-dot"/> OPERATOR STATION <small>{locked?"Camera locked to monitor. Click outside the monitors or press Escape to look around.":"Move toward the edges to look around. Click a monitor to work; Escape releases the camera."}</small></div><span className="camera-status" role="status">{locked?"MONITOR FOCUSED":"LOOKING AROUND"}</span></div>
  <div ref={viewport} className="operator-viewport" onPointerMove={e=>{if(e.pointerType==='mouse'){const rect=e.currentTarget.getBoundingClientRect();pointer.current={x:e.clientX-rect.left,y:e.clientY-rect.top};}}} onPointerLeave={()=>{pointer.current=null;}} onPointerDown={e=>{pointer.current=null;const monitor=e.target.closest('[data-station]');if(monitor){setLocked(monitor.dataset.station);}else{setLocked(null);document.activeElement?.blur();}}} onClick={e=>{const monitor=e.target.closest('[data-station]');if(monitor&&!e.target.closest('.result-jump')&&!window.matchMedia('(max-width: 800px)').matches)lookAt(monitor.dataset.station);}} onFocusCapture={onFocus}>
   <div className="operator-room">
    <div className="room-wall-label">BEYOND EARTH / HABITAT OPERATIONS DIVISION</div>
    <Monitor id="setup" title="01 / Mission setup">{setup}</Monitor>
    <Monitor id="designer" title="02 / AI mission designer">{designer}</Monitor>
    <Monitor id="surface" title="03 / Surface observation">{surface}</Monitor>
    <Monitor id="systems" title="04 / Environment, resources & flight operations">{systems}</Monitor>
    <div className="operator-desk" aria-hidden="true"><div className="desk-keyboard"/><div className="desk-plaque">BEYOND EARTH &nbsp; / &nbsp; FLIGHT DIRECTOR</div></div>
   </div>
  </div>

 </div>;
}
