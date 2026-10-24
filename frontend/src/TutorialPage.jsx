export default function TutorialPage({ headingRef, onComplete, onSkip, onBack }) {
 return <main className="tutorial-page">
  <p className="eyebrow">BEFORE LAUNCH / TUTORIAL</p>
  <h1 ref={headingRef} tabIndex={-1}>Get ready for mission control.</h1>
  <section className="tutorial-content" aria-label="Tutorial content">
   {/* Teammate handoff: add tutorial content here. Call onComplete after the final step. */}
  </section>
  <div className="tutorial-actions"><button className="welcome-secondary" onClick={onBack}>← Back to home</button><div><button className="welcome-secondary" onClick={onSkip}>Skip tutorial</button><button className="welcome-start" onClick={onComplete}>Continue to simulation <span aria-hidden="true">→</span></button></div></div>
 </main>;
}
