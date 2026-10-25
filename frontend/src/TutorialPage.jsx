import { useEffect, useRef, useState } from 'react';

const lessons=[
 {title:'Choose your planet',caption:'Choose a planet, crew size, and mission length. More crew or more days means more supplies and life support are needed.',notes:[['Destination matters','Mars, Venus, and Titan have different outside conditions. Colder worlds need heating; hotter worlds need cooling.'],['Plan for your crew','More people use more oxygen and water. A longer mission needs supplies and equipment that can keep up.']]},
 {title:'Build the habitat',caption:'In Supplies, choose what you bring and the equipment that keeps it going.',notes:[['Supplies and equipment','Oxygen and clean water are stored supplies. Oxygen generation and water recovery help replenish them.'],['Power and optional checks','Generation runs the equipment; batteries cover shortfalls. Enable thermal, cabin atmosphere, and CO₂ checks to evaluate those constraints.']]},
 {title:'Run it. Read the result.',caption:'Run mission opens the monitors and evaluates your build once.',notes:[['Watch your mission','Follow the days and resources. Pause or replay anytime.'],['Read the result','Success: build completed. Failed: see what ran out or failed, edit, and run again.']]},
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
   <div className="briefing-worlds" aria-hidden="true">{[['mars','Mars','Planet'],['venus','Venus','Planet'],['titan','Titan','Moon of Saturn']].map(([id,name,kind])=><div key={id} className={`briefing-world ${selected===id?'is-selected':''}`}><img className="briefing-world-art" src={`/mission/${id}-icon.png`} alt=""/><strong>{name}</strong><small>{kind}</small><span className="briefing-selection">{selected===id?'Selected':'\u00a0'}</span></div>)}</div>
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
  <div className="briefing-scene-label" aria-hidden="true">Two separate example builds</div>
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
  <div className="briefing-top"><h1 ref={headingRef} tabIndex={-1}>Tutorial</h1><button type="button" className="welcome-secondary" onClick={onSkip}>Skip tutorial →</button></div>
  <section className="briefing-lesson" aria-labelledby="briefing-lesson-title">
   <div className="briefing-progress"><span>{step+1} of {lessons.length}</span><div className="briefing-step-track" aria-hidden="true">{lessons.map((_,i)=><span key={i} className={i<=step?'is-filled':''}/>)}</div></div>
   <h2 id="briefing-lesson-title" ref={lessonHeading} tabIndex={-1}>{lessons[step].title}</h2>
   <div className={`briefing-lesson-grid${step===0?' briefing-visual-only':''}`}><AnimatedExample key={`${step}-${replay}`} step={step} reducedMotion={reducedMotion}/>{step!==0&&<div className="briefing-explanations">{lessons[step].notes.map(([title,text])=><section key={title}><h3>{title}</h3><p>{text}</p></section>)}{step===2&&<p className="briefing-constraint-note">Some checks fail before launch. Only enabled systems are evaluated.</p>}</div>}</div>
   <p className="briefing-caption">{lessons[step].caption}</p>
   <div className="briefing-controls"><button type="button" className="briefing-text-button" onClick={()=>setReplay(value=>value+1)}>↻ Replay example</button><div><button type="button" className="welcome-secondary" disabled={step===0} onClick={()=>changeStep(step-1)}>← Back</button><button type="button" className="welcome-start" onClick={()=>step===lessons.length-1?onComplete():changeStep(step+1)}>{step===lessons.length-1?'Build my mission →':'Next →'}</button></div></div>
  </section>
  <aside className="briefing-detailed-help" aria-label="More detailed instructions"><div><h2>Configuration guide</h2><p>Units, equipment choices, and model assumptions.</p></div><button type="button" className="welcome-secondary" onClick={onDetails}>Open detailed guide →</button></aside>
  <div className="briefing-bottom"><button type="button" className="briefing-text-button" onClick={onBack}>← {backLabel}</button><p>Examples only · modeled checks, not a safety certification.</p></div>
 </main>;
}
