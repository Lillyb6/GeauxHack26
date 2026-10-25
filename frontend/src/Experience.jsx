import AccountControls from './AuthContext';
import { useEffect, useRef, useState } from 'react';
import App from './App';
import TutorialPage from './TutorialPage';
import DetailedMissionGuide from './DetailedMissionGuide';
import HomeMissionSteps from './HomeMissionSteps';

function routeFromLocation() {
 return ['/tutorial','/help','/simulation'].includes(window.location.pathname) ? window.location.pathname : '/';
}

export default function Experience() {
 const [route,setRoute] = useState(routeFromLocation);
 const [configured,setConfigured]=useState(false);
 const [hasVisitedSimulation,setHasVisitedSimulation]=useState(()=>routeFromLocation()==='/simulation');
 const heading = useRef(null);
 useEffect(()=>{
  const onPopState=()=>setRoute(routeFromLocation());
  window.addEventListener('popstate',onPopState);
  return ()=>window.removeEventListener('popstate',onPopState);
 },[]);
 useEffect(()=>{
  if(route==='/simulation')setHasVisitedSimulation(true);
  document.title=route==='/simulation'?'Mission control | Beyond Earth':route==='/tutorial'?'Quick tutorial | Beyond Earth':route==='/help'?'Detailed instructions | Beyond Earth':'Beyond Earth | Design a mission';
  window.scrollTo(0,0);
  heading.current?.focus();
 },[route]);
 function navigate(next) {
  window.history.pushState(next==='/help'?{helpReturn:route==='/simulation'?'/simulation':route==='/tutorial'?'/tutorial':'/'}:next==='/tutorial'?{tutorialReturn:route==='/simulation'?'/simulation':'/'}:{},'',next);
  if(next==='/simulation')setHasVisitedSimulation(true);
  setRoute(next);
 }
 const helpReturn=['/simulation','/tutorial','/'].includes(window.history.state?.helpReturn)?window.history.state.helpReturn:'/tutorial';
 const tutorialReturn=window.history.state?.tutorialReturn==='/simulation'?'/simulation':'/';
 return <>{hasVisitedSimulation&&<div hidden={route!=='/simulation'}><App onConfiguredChange={setConfigured} active={route==='/simulation'} onHome={()=>navigate('/')} onHelp={()=>navigate('/help')}/></div>}{route!=='/simulation'&&<div className={`welcome-shell${route==='/'?' original-home':''}`}>
  <header className="welcome-header"><a className="brand" href="/" onClick={e=>{e.preventDefault();navigate('/');}}><span className="mark" aria-hidden="true">✦</span> BEYOND EARTH <small>HABITAT INTELLIGENCE</small></a><AccountControls/></header>
  {route==='/help'?<DetailedMissionGuide headingRef={heading} onComplete={()=>navigate('/simulation')} onSkip={()=>navigate('/simulation')} onBack={()=>navigate(helpReturn)} backLabel={helpReturn==='/simulation'?'Back to Mission Lab':helpReturn==='/tutorial'?'Back to quick tutorial':'Back to home'}/>:route==='/tutorial'?<TutorialPage onDetails={()=>navigate('/help')} headingRef={heading} onComplete={()=>navigate('/simulation')} onSkip={()=>navigate('/simulation')} onBack={()=>navigate(tutorialReturn)} backLabel={tutorialReturn==='/simulation'?'Back to Mission Lab':'Back to home'}/>:<main className="welcome-main">
   <section className="welcome-hero">
    <div className="welcome-copy"><p className="eyebrow">HUMAN EXPLORATION STARTS WITH A PLAN</p><h1 ref={heading} tabIndex={-1}>A foothold<br/>beyond Earth<span>.</span></h1><p className="welcome-lead">What does a crew need to live on another world?</p><p>Choose Mars, Venus, or Titan. Build your mission and see how long your supplies last.</p><a className="welcome-start" href={configured?'/simulation':'/tutorial'} onClick={e=>{e.preventDefault();navigate(configured?'/simulation':'/tutorial');}}>Start simulation <span aria-hidden="true">↗</span></a><p className="welcome-hint">First, a quick introduction. Then, mission control.</p></div>
    <div className="welcome-visual" aria-label="Mars surface illustration"><div className="welcome-visual-label"><span>BEYOND EARTH / SURFACE PREVIEW</span><span>01 / MARS</span></div><div className="welcome-art"><img src="/mission/mars.webp" alt="Illustrated orange Mars horizon beneath a purple star-filled sky"/></div><div className="welcome-visual-caption"><span>03 DESTINATIONS</span><span>ONE MISSION: UNDERSTAND THE LIMITS</span></div></div>
   </section>
   <section className="welcome-purpose" aria-labelledby="purpose-title"><div><p className="eyebrow">OUR MISSION</p><h2 id="purpose-title">Explore the choices<br/>that sustain a crew.</h2></div></section>
   <HomeMissionSteps/>
   <p className="welcome-scope">Beyond Earth is a learning tool based on research and simplified assumptions. It estimates how supplies change. It cannot tell you whether a real mission is safe.</p>
  </main>}
  <footer className="welcome-footer"><span>BEYOND EARTH / GEAUXHACK 2026</span><span>Explore. Design. Understand.</span></footer>
 </div>}</>;
}
