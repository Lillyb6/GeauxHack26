import { useEffect, useRef, useState } from 'react';
import App from './App';
import TutorialPage from './TutorialPage';

function routeFromLocation() {
 return ['/tutorial','/simulation'].includes(window.location.pathname) ? window.location.pathname : '/';
}

export default function Experience() {
 const [route,setRoute] = useState(routeFromLocation);
 const heading = useRef(null);
 useEffect(()=>{
  const onPopState=()=>setRoute(routeFromLocation());
  window.addEventListener('popstate',onPopState);
  return ()=>window.removeEventListener('popstate',onPopState);
 },[]);
 useEffect(()=>{
  document.title=route==='/simulation'?'Mission control | Beyond Earth':route==='/tutorial'?'Tutorial | Beyond Earth':'Beyond Earth | Design a mission';
  window.scrollTo(0,0);
  heading.current?.focus();
 },[route]);
 function navigate(next) {
  window.history.pushState({},'',next);
  setRoute(next);
 }
 if(route==='/simulation')return <App onHome={()=>navigate('/')}/>;
 return <div className="welcome-shell">
  <header className="welcome-header"><a className="brand" href="/" onClick={e=>{e.preventDefault();navigate('/');}}><span className="mark" aria-hidden="true">✦</span> BEYOND EARTH <small>HABITAT INTELLIGENCE</small></a><span className="welcome-coordinate">GEAUXHACK 2026 / MISSION DESIGN LAB</span></header>
  {route==='/tutorial'?<TutorialPage headingRef={heading} onComplete={()=>navigate('/simulation')} onSkip={()=>navigate('/simulation')} onBack={()=>navigate('/')}/>:<main className="welcome-main">
   <section className="welcome-hero">
    <div className="welcome-copy"><p className="eyebrow">HUMAN EXPLORATION STARTS WITH A PLAN</p><h1 ref={heading} tabIndex={-1}>A foothold<br/>beyond Earth<span>.</span></h1><p className="welcome-lead">What does it take to keep a crew going on another world?</p><p>Build a habitat mission on Mars, Venus, or Titan. Choose your crew, supplies, and life-support equipment, then simulate how oxygen, water, and power change over time.</p><a className="welcome-start" href="/tutorial" onClick={e=>{e.preventDefault();navigate('/tutorial');}}>Start simulation <span aria-hidden="true">↗</span></a><p className="welcome-hint">First, a quick introduction. Then, mission control.</p></div>
    <div className="welcome-visual" aria-label="Mars surface illustration"><div className="welcome-visual-label"><span>BEYOND EARTH / SURFACE PREVIEW</span><span>01 / MARS</span></div><div className="welcome-art"><img src="/mission/mars.webp" alt="Illustrated orange Mars horizon beneath a purple star-filled sky"/></div><div className="welcome-visual-caption"><span>03 DESTINATIONS</span><span>ONE MISSION: UNDERSTAND THE LIMITS</span></div></div>
   </section>
   <section className="welcome-purpose" aria-labelledby="purpose-title"><div><p className="eyebrow">OUR MISSION</p><h2 id="purpose-title">Explore the choices<br/>that sustain a crew.</h2></div><div><p>Far from Earth, every supply and every watt matters. Oxygen production needs power and water. Water recovery has limits. A change in crew size or destination can change the entire resource balance.</p><p>Beyond Earth makes those connections visible. Compare designs, discover shortages, and understand why a mission reaches its limits before choosing what to change.</p></div></section>
   <section className="welcome-steps" aria-label="How the simulation works"><article><span>01 / CONFIGURE</span><h3>Choose your world.</h3><p>Set the destination, crew, duration, and equipment for your mission.</p></article><article><span>02 / SIMULATE</span><h3>Trace the resources.</h3><p>Follow hourly resource inventories and inspect modeled constraints.</p></article><article><span>03 / COMPARE</span><h3>Understand the tradeoffs.</h3><p>Compare equipment configurations and review the evidence behind the model.</p></article></section>
   <p className="welcome-scope">An exploratory learning tool using research-informed inputs and explicit assumptions. Results describe modeled resource balances; they do not certify a habitat or mission as safe.</p>
  </main>}
  <footer className="welcome-footer"><span>BEYOND EARTH / GEAUXHACK 2026</span><span>Explore. Design. Understand.</span></footer>
 </div>;
}
