import {useEffect,useRef,useState} from 'react';
import {STORAGE_KEY,MAX_FILE_BYTES,MAX_MISSIONS,createMission,validateMission,parseMission,serializeMission,readLibrary,addMission,removeMission,filenameFor} from './missionStorage';

function browserStorage(){try{return window.localStorage;}catch{throw new Error('Browser storage is unavailable. JSON export and loading imported inputs can still be used.');}}
function download(document,context){
 const text=serializeMission(document,context);
 const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
 const anchor=window.document.createElement('a');anchor.href=url;anchor.download=filenameFor(document.name);
 window.document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export default function MissionLibrary({scenario,search,context,onLoad}){
 const [missions,setMissions]=useState([]),[selected,setSelected]=useState(''),[name,setName]=useState('New mission');
 const [message,setMessage]=useState(''),[error,setError]=useState(''),[storageReady,setStorageReady]=useState(false),[confirmDelete,setConfirmDelete]=useState(null);
 const [importText,setImportText]=useState(''),[preview,setPreview]=useState(null),[reading,setReading]=useState(false);
 const importGeneration=useRef(0);
 const current=missions.find(item=>item.id===selected);
 function refresh(){
  try{const items=readLibrary(browserStorage());setMissions(items);setStorageReady(true);setError('');setSelected(id=>items.some(item=>item.id===id)?id:(items[0]?.id||''));}
  catch(err){setStorageReady(false);setError(err.message);}
 }
 useEffect(()=>{refresh();const update=e=>{if(e.key===STORAGE_KEY||e.key===null)refresh();};window.addEventListener('storage',update);return()=>{window.removeEventListener('storage',update);importGeneration.current++;};},[]);
 function attempt(action){setError('');setMessage('');try{action();}catch(err){setError(err.message);}}
 function store(document){const saved=addMission(browserStorage(),document,context);setMissions(saved.items);setSelected(saved.item.id);setName(saved.item.document.name);setConfirmDelete(null);return saved.item.document.name;}
 function save(){attempt(()=>{const document=createMission(name,scenario,search,context);const savedName=store(document);setMessage(`Saved “${savedName}” in this browser.`);});}
 function load(document){const validated=validateMission(document,context);onLoad(validated.configuration,validated.name);setName(validated.name);setConfirmDelete(null);setMessage(`Loaded inputs from “${validated.name}”. Previous results and agent proposals were cleared.`);}
 async function fileChanged(e){
  const file=e.target.files?.[0];e.target.value='';if(!file)return;
  const token=++importGeneration.current;setPreview(null);setImportText('');setError('');setMessage('');setReading(true);
  try{if(file.size>MAX_FILE_BYTES)throw new Error('Mission files must be no larger than 64 KB.');const text=await file.text();if(token!==importGeneration.current)return;setImportText(text);setPreview(parseMission(text,context));}
  catch(err){if(token===importGeneration.current)setError(err.message);}
  finally{if(token===importGeneration.current)setReading(false);}
 }
 return <section className="panel mission-library" aria-label="Saved missions">
  <p className="eyebrow">MISSION LIBRARY / LOCAL TO THIS BROWSER</p><h2>Save and share a mission</h2>
  <p>Save input snapshots, including equipment, screening settings and search limits. Results and API keys are never included. Loading replaces current inputs and requires a fresh simulation.</p>
  <label htmlFor="mission_name">Mission name<input id="mission_name" value={name} maxLength={80} onChange={e=>setName(e.target.value)} placeholder="Example: Mars six-person demo"/></label>
  <div className="mission-actions"><button type="button" onClick={save} disabled={!storageReady||!name.trim()}>Save current inputs</button><button type="button" onClick={()=>attempt(()=>{download(createMission(name,scenario,search,context),context);setMessage('Mission JSON download requested. It contains inputs only.');})} disabled={!name.trim()}>Export current inputs</button></div>
  <label htmlFor="saved_mission">Saved missions · {missions.length}/{MAX_MISSIONS}<select id="saved_mission" value={selected} onChange={e=>{setSelected(e.target.value);setConfirmDelete(null);}}><option value="">Choose a saved mission</option>{missions.map(item=><option key={item.id} value={item.id}>{item.document.name} · {item.document.configuration.scenario?.environment_id || 'mission'}</option>)}</select></label>
  {current&&<p>{current.document.configuration.scenario?.crew_size} crew · {current.document.configuration.scenario?.duration_days} Earth days · model {current.document.model_version} · saved {new Date(current.document.saved_at).toLocaleString()}</p>}
  <div className="mission-actions">
   <button type="button" disabled={!current} onClick={()=>attempt(()=>load(current.document))}>Load selected mission</button>
   <button type="button" disabled={!current||!storageReady} onClick={()=>attempt(()=>{const document=validateMission(current.document,context);const savedName=store({...document,name:`${document.name.slice(0,73)} (copy)`,saved_at:new Date().toISOString()});setMessage(`Duplicated as “${savedName}”.`);})}>Duplicate selected</button>
   <button type="button" disabled={!current} onClick={()=>attempt(()=>{download(current.document,context);setMessage('Selected mission JSON download requested. It contains inputs only.');})}>Export selected</button>
   <button type="button" disabled={!current||!storageReady} onClick={()=>{setConfirmDelete(current.id);setMessage('');}}>Delete selected</button>
   <button type="button" onClick={refresh}>Reload saved list</button>
  </div>
  {confirmDelete&&current?.id===confirmDelete&&<div className="alert"><p>Delete the browser save “{current.document.name}”? Current mission inputs will remain on screen.</p><div className="mission-actions"><button type="button" onClick={()=>attempt(()=>{const items=removeMission(browserStorage(),confirmDelete);setMissions(items);setSelected(items[0]?.id||'');setConfirmDelete(null);setMessage('Saved snapshot deleted. Current inputs were kept.');})}>Confirm delete</button><button type="button" onClick={()=>setConfirmDelete(null)}>Cancel deletion</button></div></div>}
  <details><summary>Import a mission JSON file or paste JSON</summary>
   <label htmlFor="mission_file">Choose mission JSON<input id="mission_file" type="file" accept=".json,application/json" onChange={fileChanged}/></label>
   <label htmlFor="mission_json">Or paste exported mission JSON<textarea id="mission_json" rows={5} value={importText} maxLength={MAX_FILE_BYTES} onChange={e=>{importGeneration.current++;setReading(false);setImportText(e.target.value);setPreview(null);}}/></label>
   <button type="button" disabled={reading||!importText.trim()} onClick={()=>attempt(()=>setPreview(parseMission(importText,context)))}>{reading?'Reading file…':'Check pasted JSON'}</button>
   {preview&&<div className="mission-import-preview"><p>Ready to import <strong>{preview.name}</strong>: {preview.configuration.scenario.environment_id}, {preview.configuration.scenario.crew_size} crew, {preview.configuration.scenario.duration_days} days. Model {preview.model_version}. No stored results.</p><div className="mission-actions"><button type="button" disabled={!storageReady} onClick={()=>attempt(()=>{const savedName=store(preview);setMessage(`Imported and saved “${savedName}”. Current inputs were not changed.`);})}>Import as new saved mission</button><button type="button" onClick={()=>attempt(()=>load(preview))}>Load imported inputs</button></div></div>}
  </details>
  <div aria-live="polite">{error&&<p role="alert" className="alert">{error}</p>}{message&&<p role="status" className="note">{message}</p>}</div>
  <p className="muted">Browser saves stay on this device and browser profile; clearing site data removes them. Export JSON to back them up or share with teammates. No account, cloud storage or additional external API is used.</p>
 </section>;
}
