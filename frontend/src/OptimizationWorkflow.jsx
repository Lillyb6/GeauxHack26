import MissionAdvisor from './MissionAdvisor';

export default function OptimizationWorkflow({comparison,stale,applied,busy,disabled,error,onOptimize,onCompare,onApply,onViewSimulation}) {
 return <section className="panel optimization-workflow" aria-label="Optimize and explain your mission">
  <p className="eyebrow">OPTIMIZE · COMPARE · APPLY</p><h2>Improve this mission</h2>
  <p>Optimize your current settings.</p>
  <div className="optimization-primary-actions"><button type="button" className="run" disabled={busy||disabled} onClick={onOptimize}>{busy?'Testing mission designs…':comparison?'Optimize again':'Optimize & compare →'}</button><button type="button" className="run" disabled={busy||disabled||stale||applied||!comparison?.optimized} onClick={onApply}>{applied?'✓ Results applied':'Apply results →'}</button></div>
  {!comparison&&!busy&&<p className="note">Optimize first to create results you can apply.</p>}
  <div role="status" aria-live="polite">{busy&&<p>Testing designs…</p>}{error&&<p className="alert">{error}</p>}
   {!busy&&comparison&&<><p>{stale?'Inputs changed. Optimize again.':comparison.optimized?`Evaluated hours: ${comparison.manual.evaluated_hours} manual → ${comparison.optimized.evaluated_hours} optimized.`:'No passing design. View limits.'}</p>
    <button className="result-jump" type="button" onClick={onCompare}>View comparison →</button>
    {applied&&<button type="button" className="result-jump" onClick={onViewSimulation}>View simulation →</button>}
   </>}
  </div>
  {comparison&&!busy&&<MissionAdvisor comparison={comparison} stale={stale}/>}
 </section>;
}
