import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createMission} from './missionStorage.js';
import {canSaveEvaluatedMission,listCloudMissions,saveCloudMission,deleteCloudMission} from './cloudMissions.js';
const context=JSON.parse(readFileSync(new URL('../test-fixtures/mission-context.json',import.meta.url),'utf8'));
const user={id:'owner-a'};
function document(){return createMission('Cloud mission',context.defaults,context.searchDefaults,context);}
function mock(reply){
 const calls=[];const query={then(resolve,reject){return Promise.resolve(reply).then(resolve,reject);}};
 for(const method of ['from','select','eq','order','limit','insert','update','delete','single'])query[method]=(...args)=>{calls.push([method,...args]);return query;};
 return {client:query,calls};
}
test('guest cloud operations are rejected before a network query',async()=>{
 const {client,calls}=mock({data:[]});
 await assert.rejects(()=>listCloudMissions(client,null),/Sign in/);
 await assert.rejects(()=>saveCloudMission(client,null,document(),context),/Sign in/);
 await assert.rejects(()=>deleteCloudMission(client,null,'id'),/Sign in/);
 assert.deepEqual(calls,[]);
});
test('list is scoped to current owner and bounded',async()=>{
 const {client,calls}=mock({data:[],error:null});await listCloudMissions(client,user);
 assert.ok(calls.some(c=>c[0]==='eq'&&c[1]==='user_id'&&c[2]===user.id));
 assert.ok(calls.some(c=>c[0]==='limit'&&c[1]===100));
});
test('new save stores only a validated input document with owner',async()=>{
 const doc=document();const {client,calls}=mock({data:{id:'new-id',document:doc},error:null});
 const saved=await saveCloudMission(client,user,doc,context);
 assert.equal(saved.id,'new-id');const insert=calls.find(c=>c[0]==='insert')[1];
 assert.equal(insert.user_id,user.id);assert.deepEqual(insert.document,doc);
 assert.equal('result' in insert,false);
});
test('updates and deletes scope both record ID and owner',async()=>{
 const doc=document();const {client,calls}=mock({data:{id:'saved-id',document:doc},error:null});
 await saveCloudMission(client,user,doc,context,'saved-id');
 await deleteCloudMission(client,user,'saved-id');
 assert.equal(calls.filter(c=>c[0]==='eq'&&c[1]==='user_id'&&c[2]==='owner-a').length,2);
 assert.equal(calls.filter(c=>c[0]==='eq'&&c[1]==='id'&&c[2]==='saved-id').length,2);
});
test('invalid cloud documents never reach the client',async()=>{
 const doc=document();doc.configuration.scenario.crew_size=99;
 const {client,calls}=mock({data:[]});await assert.rejects(()=>saveCloudMission(client,user,doc,context));assert.deepEqual(calls,[]);
});
test('missing migration and network rejection do not report a successful save',async()=>{
 const missing=mock({data:null,error:{code:'PGRST205'}});
 await assert.rejects(()=>listCloudMissions(missing.client,user),/migration/);
 const denied=mock({data:null,error:{code:'42501'}});
 await assert.rejects(()=>saveCloudMission(denied.client,user,document(),context),/failed/);
 await assert.rejects(()=>deleteCloudMission(denied.client,user,'foreign-id'),/failed/);
});
test('zero-row write cannot look like a successful update',async()=>{
 const {client}=mock({data:null,error:null});
 await assert.rejects(()=>saveCloudMission(client,user,document(),context,'missing'),/failed/);
});
test('Save requires a run of the current configuration, including failed runs',()=>{
 const scenario=context.defaults;
 assert.equal(canSaveEvaluatedMission(scenario,null),false);
 assert.equal(canSaveEvaluatedMission(scenario,{request:{...scenario},resource_balance_complete:false}),true);
 assert.equal(canSaveEvaluatedMission({...scenario,water_kg:99},{request:scenario}),false);
 const reordered=Object.fromEntries(Object.entries(scenario).reverse());
 assert.equal(canSaveEvaluatedMission(reordered,{request:scenario}),true);
});
