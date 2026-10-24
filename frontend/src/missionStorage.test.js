import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {STORAGE_KEY,MAX_MISSIONS,createMission,validateMission,parseMission,serializeMission,readLibrary,addMission,removeMission,filenameFor,saveMissionRun} from './missionStorage.js';
const context=JSON.parse(readFileSync(new URL('../test-fixtures/mission-context.json',import.meta.url),'utf8'));
const copy=value=>structuredClone(value);
function document(){return createMission('Mars demo',copy(context.defaults),copy(context.searchDefaults),context,'2026-10-24T12:00:00.000Z');}
function storage(){const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};}

test('round trip preserves every mission field, screening and search setting',()=>{
 const scenario={...context.defaults,crew_size:6,generation_kw:14,water_kg:400,co2_enabled:true,co2_equipment_quantity:2,atmosphere_enabled:true};
 const mission=createMission('Six crew',scenario,{...context.searchDefaults,require_no_wastewater_backlog:true},context);
 const restored=parseMission(serializeMission(mission,context),context);
 assert.deepEqual(restored.configuration,{scenario,search:{...context.searchDefaults,require_no_wastewater_backlog:true}});
 assert.deepEqual(Object.keys(restored).sort(),['configuration','format','format_version','model_version','name','saved_at']);
});
test('snapshot is detached from later form edits',()=>{
 const scenario=copy(context.defaults),search=copy(context.searchDefaults);
 const mission=createMission('Snapshot',scenario,search,context);scenario.crew_size=9;search.max_oxygen_units=0;
 assert.equal(mission.configuration.scenario.crew_size,4);assert.equal(mission.configuration.search.max_oxygen_units,8);
});
test('reordered imports normalize to canonical field order for stale-result comparisons',()=>{
 const mission=document();mission.configuration.scenario=Object.fromEntries(Object.entries(mission.configuration.scenario).reverse());
 mission.configuration.search=Object.fromEntries(Object.entries(mission.configuration.search).reverse());
 const restored=validateMission(mission,context);
 assert.equal(JSON.stringify(restored.configuration.scenario),JSON.stringify(context.defaults));
 assert.equal(JSON.stringify(restored.configuration.search),JSON.stringify(context.searchDefaults));
});
test('corrupt JSON, unsupported format and model versions are rejected',()=>{
 assert.throws(()=>parseMission('{bad',context),/valid JSON/);
 for(const patch of [{format:'other'},{format_version:2},{model_version:'0.4.0'}])assert.throws(()=>validateMission({...document(),...patch},context));
});
for(const [field,value] of [['crew_size',0],['crew_size',4.5],['crew_size','6'],['water_kg',-1],['generation_kw',101],['co2_enabled','true'],['co2_equipment_quantity',5],['cabin_oxygen_percent',101],['environment_id','earth'],['heat_loss_kw_k',0],['generation_kw',NaN],['generation_kw',Infinity]]){
 test(`invalid scenario rejected: ${field} ${String(value)}`,()=>{const mission=document();mission.configuration.scenario[field]=value;assert.throws(()=>validateMission(mission,context));});
}
test('unknown equipment and wrong categories are rejected even in inactive controls',()=>{
 for(const [field,id] of [['oxygen_equipment_id','missing'],['oxygen_equipment_id','vcds_1979_reference'],['co2_equipment_id','static_feed_electrolyzer_1978']]){const mission=document();mission.configuration.scenario[field]=id;assert.throws(()=>validateMission(mission,context),/current catalog/);}
});
test('null oxygen and water IDs preserve custom mode',()=>{
 const mission=document();assert.equal(validateMission(mission,context).configuration.scenario.oxygen_equipment_id,null);
});
test('unknown fields, forged results and secret fields cannot enter snapshots',()=>{
 const root=document();root.api_key='not-a-real-key';assert.throws(()=>validateMission(root,context),/unsupported/);
 const scenario=document();scenario.configuration.scenario.results={safe:true};assert.throws(()=>validateMission(scenario,context),/unsupported/);
 const config=document();config.configuration.result={};assert.throws(()=>validateMission(config,context),/unsupported/);
});
test('missing fields and oversized input are rejected without silently adding defaults',()=>{
 const mission=document();delete mission.configuration.scenario.crew_size;assert.throws(()=>validateMission(mission,context),/missing/);
 assert.throws(()=>parseMission(' '.repeat(65537),context),/64 KB/);
});
test('search limits use the canonical API bounds and boolean types',()=>{
 for(const [key,value] of [['max_co2_units',5],['max_water_units',9],['max_oxygen_units',-1],['require_no_wastewater_backlog','false']]){const mission=document();mission.configuration.search[key]=value;assert.throws(()=>validateMission(mission,context));}
});
test('empty library, persistence, duplicate names and removal',()=>{
 const db=storage();assert.deepEqual(readLibrary(db),[]);
 addMission(db,document(),context,'a');const second=addMission(db,document(),context,'b');
 assert.equal(second.item.document.name,'Mars demo (2)');assert.equal(readLibrary(db).length,2);
 assert.equal(removeMission(db,'a').length,1);assert.equal(readLibrary(db)[0].id,'b');
});
test('corrupt library is preserved and cannot be overwritten by saving',()=>{
 const db=storage();db.setItem(STORAGE_KEY,'broken-data');
 assert.throws(()=>addMission(db,document(),context,'a'),/unreadable/);assert.equal(db.getItem(STORAGE_KEY),'broken-data');
});
test('read and quota errors do not report a successful save',()=>{
 assert.throws(()=>readLibrary({getItem(){throw new Error();}}),/unavailable/);
 const db=storage();addMission(db,document(),context,'a');const before=db.getItem(STORAGE_KEY);db.setItem=()=>{throw new Error('quota');};
 assert.throws(()=>addMission(db,document(),context,'b'),/Could not save/);assert.equal(db.getItem(STORAGE_KEY),before);
 assert.throws(()=>removeMission(db,'a'),/Could not save/);assert.equal(db.getItem(STORAGE_KEY),before);
});
test('adding a mission rereads the latest list instead of replacing a stale copy',()=>{
 const db=storage();const a=addMission(db,document(),context,'a');addMission(db,document(),context,'b');
 assert.equal(a.items.length,1);const c=addMission(db,document(),context,'c');assert.equal(c.items.length,3);
});
test('library cap is enforced without deleting existing saves',()=>{
 const db=storage();for(let i=0;i<MAX_MISSIONS;i++)addMission(db,document(),context,String(i));
 assert.throws(()=>addMission(db,document(),context,'overflow'),/50 missions/);assert.equal(readLibrary(db).length,50);
});
test('names are required and download names cannot contain path separators',()=>{
 assert.throws(()=>createMission(' ',context.defaults,context.searchDefaults,context));
 assert.throws(()=>createMission('x'.repeat(81),context.defaults,context.searchDefaults,context));
 assert.equal(filenameFor('../../Mars Demo'),'mars-demo.json');
});


test('model 0.5 inputs migrate with thermal screening disabled and no altered supplies',()=>{
 const next=copy(context);next.modelVersion='0.6.0';
 const fields={thermal_capacity_enabled:{type:'boolean'},heating_capacity_kw:{type:'number',minimum:0,maximum:1000},cooling_capacity_kw:{type:'number',minimum:0,maximum:1000}};
 Object.assign(next.defaults,{thermal_capacity_enabled:false,heating_capacity_kw:0,cooling_capacity_kw:0});
 Object.assign(next.schemas.HabitatRequest.properties,fields);
 const old=document();old.model_version='0.5.0';
 for(const key of ['thermal_capacity_enabled','heating_capacity_kw','cooling_capacity_kw'])delete old.configuration.scenario[key];
 const migrated=validateMission(old,next);
 assert.equal(migrated.model_version,'0.6.0');
 assert.equal(migrated.configuration.scenario.thermal_capacity_enabled,false);
 assert.equal(migrated.configuration.scenario.heating_capacity_kw,0);
 assert.equal(migrated.configuration.scenario.water_kg,old.configuration.scenario.water_kg);
 assert.equal(old.model_version,'0.5.0');
 const broken=copy(old);delete broken.configuration.scenario.crew_size;
 assert.throws(()=>validateMission(broken,next),/missing/);
 const forged=copy(old);forged.configuration.scenario.thermal_capacity_enabled=true;
 assert.throws(()=>validateMission(forged,next),/unexpected thermal/);
});


test('automatic save updates the same mission on reruns and preserves other missions',()=>{
 const store=storage();
 const first=saveMissionRun(store,document(),context);
 const other=addMission(store,{...document(),name:'Other mission'},context);
 const changed=createMission('Mars demo',{...context.defaults,crew_size:5},context.searchDefaults,context);
 const again=saveMissionRun(store,changed,context,first.item.id);
 assert.equal(again.item.id,first.item.id);
 assert.equal(again.item.document.name,'Mars demo');
 assert.equal(again.item.document.configuration.scenario.crew_size,5);
 assert.equal(readLibrary(store).length,2);
 assert.ok(readLibrary(store).some(item=>item.id===other.item.id));
});
test('automatic save preserves existing titles and reports storage failures',()=>{
 const store=storage();
 addMission(store,document(),context);
 const saved=saveMissionRun(store,document(),context);
 assert.equal(saved.item.document.name,'Mars demo (2)');
 const before=store.getItem(STORAGE_KEY);
 const blocked={getItem:store.getItem,setItem(){throw Error('quota');}};
 assert.throws(()=>saveMissionRun(blocked,document(),context,saved.item.id),/Could not save/);
 assert.equal(store.getItem(STORAGE_KEY),before);
});
