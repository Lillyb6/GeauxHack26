import { useRef, useState } from 'react';
import { tutorialChapters } from './tutorialContent';

function HeatingExample() {
 const [capacity,setCapacity]=useState(2);
 const required=3.2;
 const margin=capacity-required;
 return <section className="tutorial-example" aria-labelledby="heater-example-title">
  <div className="tutorial-example-heading"><div><h3 id="heater-example-title">Try a heating example</h3><p>Illustrative Mars design · 3.2 kW thermal required</p></div>
   <div className="tutorial-example-options" role="group" aria-label="Example heating capacity">{[2,4].map(value=><button key={value} type="button" aria-pressed={capacity===value} onClick={()=>setCapacity(value)}>{value} kW heater</button>)}</div>
  </div>
  <div className="tutorial-meter-label"><span>Heating required</span><span>3.2 kW thermal</span></div>
  <div className="tutorial-meter" aria-hidden="true"><span className="tutorial-required" style={{width:'80%'}}/></div>
  <div className="tutorial-meter-label"><span>Heating available</span><span>{capacity} kW thermal</span></div>
  <div className="tutorial-meter" aria-hidden="true"><span style={{width:`${capacity/4*100}%`}}/></div>
  <p className="tutorial-example-outcome" role="status">{margin<0?`${Math.abs(margin).toFixed(1)} kW shortfall. The target temperature cannot be maintained under this model.`:`${margin.toFixed(1)} kW spare capacity. This capacity check passes; other checks still matter.`}</p>
  <p className="tutorial-example-disclaimer">This example only changes the guide. It does not change your mission.</p>
 </section>;
}

function GuideBlock({block}) {
 if(block.type==='steps')return <ol className="tutorial-flow">{block.items.map((item,index)=><li key={item.title}><span className="eyebrow">0{index+1}</span><h3>{item.title}</h3><p>{item.text}</p></li>)}</ol>;
 if(block.type==='note')return <aside className="tutorial-note"><strong>{block.title}</strong> {block.text}</aside>;
 return <details className="tutorial-section"><summary><span>{block.title}<small>{block.technical}</small></span></summary><div className="tutorial-section-body">{block.blocks.map((part,index)=>part.type==='fields'?<dl key={index}>{part.entries.map(entry=><div key={entry.term}><dt>{entry.term}</dt><dd>{entry.description}</dd></div>)}</dl>:<p key={index}>{part.text}</p>)}</div></details>;
}

export default function DetailedMissionGuide({headingRef,onComplete,onSkip,onBack,backLabel='Back to home'}) {
 const [chapter,setChapter]=useState(0);
 const contentHeading=useRef(null);
 const current=tutorialChapters[chapter];
 function changeChapter(index) {
  setChapter(index);
  // Wait for the new heading to render before moving keyboard/screen-reader focus.
  requestAnimationFrame(()=>contentHeading.current?.focus());
 }
 return <main className="tutorial-page tutorial-guide">
  <div className="tutorial-guide-top"><div><p className="eyebrow">MISSION LAB / FIELD GUIDE</p><h1 ref={headingRef} tabIndex={-1}>Detailed instructions</h1><p>Find explanations for each setting and result.</p></div><button type="button" className="welcome-secondary" onClick={onSkip}>Open Mission Lab →</button></div>
  <div className="tutorial-guide-layout">
   <aside className="tutorial-sidebar"><h2>Explore the guide</h2><nav aria-label="Tutorial chapters">{tutorialChapters.map((item,index)=><button type="button" key={item.name} aria-current={chapter===index?'step':undefined} onClick={()=>changeChapter(index)}><span aria-hidden="true">{String(index+1).padStart(2,'0')}</span>{item.name}</button>)}</nav><progress max={tutorialChapters.length} value={chapter+1} aria-label="Current tutorial chapter"/><p>Chapter {chapter+1} of {tutorialChapters.length}</p></aside>
   <section className="tutorial-lesson" aria-labelledby="tutorial-chapter-title">
    <div key={chapter} className="tutorial-chapter-content"><p className="eyebrow">FIELD GUIDE / {String(chapter+1).padStart(2,'0')}</p><h2 id="tutorial-chapter-title" ref={contentHeading} tabIndex={-1}>{current.title}</h2><p className="tutorial-lesson-intro">{current.intro}</p>
     {chapter===3&&<HeatingExample/>}
     {current.content.map((block,index)=><GuideBlock key={index} block={block}/>)}
    </div>
    <div className="tutorial-lesson-actions"><button type="button" className="welcome-secondary" disabled={chapter===0} onClick={()=>changeChapter(chapter-1)}>← Previous</button><button type="button" className="welcome-start" onClick={()=>chapter===tutorialChapters.length-1?onComplete():changeChapter(chapter+1)}>{current.next}</button></div>
   </section>
  </div>
  <div className="tutorial-actions"><button type="button" className="welcome-secondary" onClick={onBack}>← {backLabel}</button><p>Reference data + explicit assumptions. Model completion does not establish human survival.</p></div>
 </main>;
}
