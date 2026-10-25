import { useEffect, useRef } from 'react';
import './home-mission-steps.css';

const steps = [
 { world: 'Mars', image: 'mars-icon.webp', title: 'Choose your world.', text: 'Pick a planet, crew size, and mission length. Choose the supplies and equipment your crew will need.' },
 { world: 'Venus', image: 'venus-icon.png', title: 'Trace the resources.', text: 'Run your mission. Watch your oxygen, water, and power, and see what runs out first.' },
 { world: 'Titan', image: 'titan-icon.png', title: 'Understand the tradeoffs.', text: 'Change your plan and try again. Compare the results to see what helps your crew last longer.' },
];

export default function HomeMissionSteps() {
 const section = useRef(null);
 useEffect(() => {
  if (!window.IntersectionObserver) return;
  const node = section.current;
  const observer = new IntersectionObserver(entries => {
   entries.forEach(entry => entry.target.classList.toggle('is-in-view', entry.isIntersecting));
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
  node.classList.add('has-scroll-reveal');
  node.querySelectorAll('li').forEach(step => observer.observe(step));
  return () => { observer.disconnect(); node.classList.remove('has-scroll-reveal'); };
 }, []);
 return <section className="home-mission-steps" aria-label="How the simulation works" ref={section}>
  <ol>{steps.map((step, index) => <li key={step.world}>
   <span className="mission-step-number" aria-hidden="true">{index + 1}</span>
   <div className="mission-step-text"><h3>{step.title}</h3><p>{step.text}</p></div>
   <span className="mission-step-world"><img src={`/mission/${step.image}`} alt={step.world} width="300" height="300" loading="lazy"/></span>
  </li>)}</ol>
 </section>;
}
