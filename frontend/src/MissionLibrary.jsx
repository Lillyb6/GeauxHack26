import {useEffect,useRef,useState} from 'react';
import AccountControls,{useAuth} from './AuthContext';
import {MAX_FILE_BYTES,createMission,validateMission,parseMission,serializeMission,readLibrary,filenameFor} from './missionStorage';
import {listCloudMissions,deleteCloudMission} from './cloudMissions';
export function downloadMission(document,context){
 const text=serializeMission(document,context);const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
 const anchor=window.document.createElement('a');anchor.href=url;anchor.download=filenameFor(document.name);window.document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export default function MissionLibrary({scenario,search,context,onLoad,name='Your mission',result,canSave,onSave,saving,saveMessage}){
 const auth=useAuth();const owner=auth.user?.id;
 const [missions,setMissions]=useState([]),[selected,setSelected]=useState(''),[legacy,setLegacy]=useState([]);
 const [message,setMessage]=useState(''),[error,setError]=useState(''),[listing,setListing]=useState(false),[confirmDelete,setConfirmDelete]=useState(null);
 const [importText,setImportText]=useState(''),[preview,setPreview]=useState(null),[reading,setReading]=useState(false);
 const generation=useRef(0),importGeneration=useRef(0);
 const current=missions.find(item=>item.id===selected);
 async function refresh(){
  const token=++generation.current;setMissions([]);setSelected('');setConfirmDelete(null);setError('');
  if(!owner)return;
  setListing(true);
  try{const items=await listCloudMissions(auth.client,auth.user);if(token===generation.current){setMissions(items);setSelected(items[0]?.id||'');}}catch(err){if(token===generation.current)setError(err.message);}finally{if(token===generation.current)setListing(false);}
 }
 useEffect(()=>{setMessage('');void refresh();return()=>{generation.current++;importGeneration.current++;};},[owner]);
 useEffect(()=>{try{setLegacy(readLibrary(window.localStorage));}catch{ /* Never overwrite an unreadable previous browser library. */ }},[]);
 function attempt(action){setError('');setMessage('');try{action();}catch(err){setError(err.message);}}
 function load(document,id=null){const validated=validateMission(document,context);onLoad(validated.configuration,validated.name,id);setMessage(`Loaded “${validated.name}”. Run it to calculate fresh results.`);}
 async function fileChanged(e){
  const file=e.target.files?.[0];e.target.value='';if(!file)return;const token=++importGeneration.current;setPreview(null);setImportText('');setError('');setReading(true);
  try{if(file.size>MAX_FILE_BYTES)throw new Error('Mission files must be no larger than 64 KB.');const text=await file.text();if(token!==importGeneration.current)return;setImportText(text);setPreview(parseMission(text,context));}catch(err){if(token===importGeneration.current)setError(err.message);}finally{if(token===importGeneration.current)setReading(false);}
 }
 async function remove(){
  if(!current)return;const token=generation.current,id=current.id;setError('');
  try{await deleteCloudMission(auth.client,auth.user,id);if(token===generation.current){setConfirmDelete(null);setMessage('Cloud mission deleted.');void refresh();}}catch(err){if(token===generation.current)setError(err.message);}
 }
 return <section className="panel mission-library" aria-label="Saved missions"><p className="eyebrow">MISSION LIBRARY</p><h2>Your missions</h2><AccountControls/>
  <p>{owner?'Run your mission, then Save to keep its configuration in your private account. Load a save and run again to recalculate results.':'No account needed. Export your mission as JSON to keep it, or import a JSON file to continue.'}</p>
  <div className="mission-actions">{owner&&<button type="button" onClick={onSave} disabled={!canSave||saving}>{saving?'Saving…':'Save mission to account'}</button>}<button type="button" onClick={()=>attempt(()=>{downloadMission(createMission(name||'Your mission',scenario,search,context),context);setMessage('Mission JSON download requested.');})}>Export mission JSON</button></div>
  {owner&&!canSave&&<p className="note">Run the current settings before saving to your account.</p>}{saveMessage&&<p role="status">{saveMessage}</p>}
  {owner&&<><label htmlFor="saved_mission">Account missions<select id="saved_mission" value={selected} onChange={e=>{setSelected(e.target.value);setConfirmDelete(null);}}><option value="">{listing?'Loading…':'Choose a saved mission'}</option>{missions.map(item=><option key={item.id} value={item.id}>{item.document?.name||'Mission'}</option>)}</select></label>{!listing&&!missions.length&&!error&&<p>No cloud missions yet.</p>}<div className="mission-actions"><button type="button" disabled={!current} onClick={()=>attempt(()=>load(current.document,current.id))}>Load selected mission</button><button type="button" disabled={!current} onClick={()=>attempt(()=>downloadMission(current.document,context))}>Export selected JSON</button><button type="button" disabled={!current} onClick={()=>setConfirmDelete(current.id)}>Delete selected</button><button type="button" onClick={refresh} disabled={listing}>Refresh list</button></div>{confirmDelete&&confirmDelete===current?.id&&<div className="alert"><p>Delete “{current.document?.name}” from your account? Keep a JSON backup if needed.</p><button type="button" onClick={remove}>Confirm delete</button><button type="button" onClick={()=>setConfirmDelete(null)}>Cancel</button></div>}</>}
  <details><summary>Import mission JSON</summary><label htmlFor="mission_file">Choose JSON file<input id="mission_file" type="file" accept=".json,application/json" onChange={fileChanged}/></label><label htmlFor="mission_json">Or paste JSON<textarea id="mission_json" rows={5} value={importText} maxLength={MAX_FILE_BYTES} onChange={e=>{importGeneration.current++;setReading(false);setImportText(e.target.value);setPreview(null);}}/></label><button type="button" disabled={reading||!importText.trim()} onClick={()=>attempt(()=>setPreview(parseMission(importText,context)))}>{reading?'Reading…':'Check JSON'}</button>{preview&&<div><p>{preview.name} · {preview.configuration.scenario.environment_id} · {preview.configuration.scenario.crew_size} crew · {preview.configuration.scenario.duration_days} days</p><button type="button" onClick={()=>attempt(()=>load(preview))}>Load imported mission</button></div>}</details>
  {!!legacy.length&&<details><summary>Previous browser saves · export or load</summary><p>These older saves stay on this device. Nothing is uploaded automatically. To keep one in your account, load it, run it and press Save.</p>{legacy.map(item=><div className="mission-actions" key={item.id}><span>{item.document.name}</span><button type="button" onClick={()=>attempt(()=>downloadMission(item.document,context))}>Export JSON</button><button type="button" onClick={()=>attempt(()=>load(item.document))}>Load inputs</button></div>)}</details>}
  <div aria-live="polite">{error&&<p role="alert" className="alert">{error}</p>}{message&&<p role="status" className="note">{message}</p>}</div>
 </section>;
}
