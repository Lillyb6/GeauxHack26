import { useEffect, useRef, useState } from 'react';

const lessons=[
 {title:'Choose your mission',caption:'Pick a world, crew size and mission length.'},
 {title:'Run your build',caption:'One click turns on the monitors and runs your build.'},
 {title:'Read your outcome',caption:'See Success or Failed—and how long your build lasted.'},
];
const exampleSummaries=[
 'Example: select Mars, Venus, then Titan; increase the crew from four to six; increase mission length from seven to fourteen to thirty Earth days.',
 'Example: Run mission powers on a monitor and shows changing oxygen, water and battery levels. These levels are illustrative.',
 'Two example runs: Mars completes thirty days; Venus completes six full hours before a power shortage during hour seven. These are separate example configurations.',
];

function AnimatedExample({step,reducedMotion}) {
 const finalFrame=step===0?5:3;
 const [frame,setFrame]=useState(reducedMotion?finalFrame:0);
 useEffect(()=>{
  if(reducedMotion){setFrame(finalFrame);return;}
  setFrame(0);
  const timers=Array.from({length:finalFrame},(_,index)=>setTimeout(()=>setFrame(index+1),(index+1)*(step===0?650:800)));
  return ()=>timers.forEach(clearTimeout);
 },[step,reducedMotion,finalFrame]);
 if(step===0){
  const selected=frame===0?'mars':frame===1?'venus':'titan';
  const crew=frame>=3?6:4;
  const days=frame>=5?30:frame>=4?14:7;
  return <div className="briefing-example briefing-config-example" role="img" aria-label={exampleSummaries[0]}>
   <div className="briefing-scene-label" aria-hidden="true">Mission setup</div>
   <div className="briefing-worlds" aria-hidden="true">{[['mars','Mars','Planet'],['venus','Venus','Planet'],['titan','Titan','Moon of Saturn']].map(([id,name,kind])=><div key={id} className={`briefing-world ${selected===id?'is-selected':''}`}><span className={`briefing-world-dot ${id}`}/><strong>{name}</strong><small>{kind}</small><span className="briefing-selection">{selected===id?'Selected':'\u00a0'}</span></div>)}</div>
   <div className="briefing-setting" aria-hidden="true"><span>Crew size</span><strong>{crew} people</strong></div>
   <div className="briefing-crew" aria-hidden="true">{Array.from({length:6},(_,i)=><span className={`briefing-person ${i>=crew?'is-waiting':''}`} key={i}><span className="crew-art"/></span>)}</div>
   <div className="briefing-setting briefing-duration" aria-hidden="true"><span>Mission length</span><strong>{days} Earth days</strong></div>
   <div className="briefing-duration-track" aria-hidden="true"><span style={{width:`${days/30*100}%`}}/></div>
   <div className="briefing-duration-ends" aria-hidden="true"><span>7 days</span><span>30 days</span></div>
  </div>;
 }
 if(step===1)return <div className="briefing-example briefing-run-example" role="img" aria-label={exampleSummaries[1]}>
  <div className="briefing-example-run" aria-hidden="true">{frame===0?'Run mission →':'Run started ✓'}</div>
  <div className={`briefing-demo-monitor ${frame===0?'is-off':''}`} aria-hidden="true"><div className="briefing-demo-bezel"><span>{frame===0?'Standby':frame<3?'Mission running':'Run complete'}</span><span className="briefing-led"/></div><div className="briefing-demo-screen">{[['Oxygen','oxygen',.84],['Water','water',.65],['Battery','battery',.4]].map(([name,id,fraction])=><div className="briefing-resource" key={id}><span>{name}</span><div className={`briefing-resource-track briefing-${id}`}><span style={{transform:`scaleX(${frame>=2?fraction:1})`}}/></div></div>)}<p>Illustrative resource levels</p></div></div>
 </div>;
 return <div className="briefing-example briefing-outcome-example" role="img" aria-label={exampleSummaries[2]}>
  <div className="briefing-scene-label" aria-hidden="true">Systems & results · two example runs</div>
  <div className="briefing-outcomes" aria-hidden="true"><div className={`briefing-outcome success ${frame<1?'is-pending':''}`}><span>Mars example</span><h2>Success</h2><strong>30 / 30 days</strong><p>All enabled checks completed.</p></div><div className={`briefing-outcome failed ${frame<2?'is-pending':''}`}><span>Venus example</span><h2>Failed</h2><strong>6 full hours</strong><p>Power shortage during hour 7.</p></div></div>
 </div>;
}

export default function TutorialPage({headingRef,onComplete,onSkip,onBack,onDetails,backLabel='Back to home'}) {
 const [step,setStep]=useState(0),[replay,setReplay]=useState(0);
 const [reducedMotion,setReducedMotion]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 const lessonHeading=useRef(null);
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setReducedMotion(media.matches);media.addEventListener('change',change);return()=>media.removeEventListener('change',change);},[]);
 function changeStep(next){setStep(next);setReplay(0);requestAnimationFrame(()=>lessonHeading.current?.focus());}
 return <main className="tutorial-page animated-briefing">
  <div className="briefing-top"><h1 ref={headingRef} tabIndex={-1}>Quick tutorial</h1><button type="button" className="welcome-secondary" onClick={onSkip}>Skip tutorial →</button></div>
  <section className="briefing-lesson" aria-labelledby="briefing-lesson-title">
   <div className="briefing-progress"><span>Example {step+1} of {lessons.length}</span><div className="briefing-step-track" aria-hidden="true">{lessons.map((_,i)=><span key={i} className={i<=step?'is-filled':''}/>)}</div></div>
   <h2 id="briefing-lesson-title" ref={lessonHeading} tabIndex={-1}>{lessons[step].title}</h2>
   <AnimatedExample key={`${step}-${replay}`} step={step} reducedMotion={reducedMotion}/>
   <p className="briefing-caption">{lessons[step].caption}</p>
   <div className="briefing-controls"><button type="button" className="briefing-text-button" onClick={()=>setReplay(value=>value+1)}>↻ Replay example</button><div><button type="button" className="welcome-secondary" disabled={step===0} onClick={()=>changeStep(step-1)}>← Back</button><button type="button" className="welcome-start" onClick={()=>step===lessons.length-1?onComplete():changeStep(step+1)}>{step===lessons.length-1?'Build my mission →':'Next →'}</button></div></div>
  </section>
  <aside className="briefing-detailed-help" aria-label="More detailed instructions"><div><h2>Need more detail?</h2><p>Every setting, explained.</p></div><button type="button" className="welcome-secondary" onClick={onDetails}>Detailed instructions →</button></aside>
  <div className="briefing-bottom"><button type="button" className="briefing-text-button" onClick={onBack}>← {backLabel}</button><p>Examples only · modeled checks, not a safety certification.</p></div>
 </main>;
}
