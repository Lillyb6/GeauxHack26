import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareAgentProposal} from './agentProposal.js';
import {createMission} from './missionStorage.js';
const context=JSON.parse(readFileSync(new URL('../test-fixtures/mission-context.json',import.meta.url),'utf8'));
function proposal(planet){
 const scenario={...context.defaults,environment_id:planet,thermal_capacity_enabled:true,heating_capacity_kw:10,cooling_capacity_kw:20,atmosphere_enabled:true,cabin_pressure_kpa:101.325,cabin_oxygen_percent:20.9,co2_enabled:true,co2_equipment_quantity:2,habitat_volume_m3:150,initial_co2_mmhg:0.5,generation_kw:30};
 const search={...context.searchDefaults,oxygen_equipment_id:'static_feed_electrolyzer_1978',water_equipment_id:'vcds_1979_reference'};
 const run={request:structuredClone(scenario),resource_balance_complete:true,events:[]};
 return {scenario,search,run};
}
for(const planet of ['mars','venus','titan'])test(`${planet}: all constraint values survive Apply and the next Run validates`,()=>{
 const {scenario,search,run}=proposal(planet);
 const before=structuredClone({scenario,search,run});
 const applied=prepareAgentProposal(scenario,search,run,context,'');
 assert.deepEqual(applied.scenario,scenario);
 assert.deepEqual(applied.search,context.searchDefaults);
 assert.equal(applied.result,run);
 assert.doesNotThrow(()=>createMission(applied.document.name,applied.scenario,applied.search,context));
 assert.deepEqual({scenario,search,run},before);
});
test('rejects a mismatched tested request before applying',()=>{
 const {scenario,search,run}=proposal('venus');run.request.cooling_capacity_kw=0;
 assert.throws(()=>prepareAgentProposal(scenario,search,run,context),/do not match/);
});
test('rejects failed, missing or malformed proposals',()=>{
 const {scenario,search,run}=proposal('titan');
 for(const result of [null,{...run,resource_balance_complete:false},{...run,events:[{resource:'power'}]}])assert.throws(()=>prepareAgentProposal(scenario,search,result,context),/passing/);
 assert.throws(()=>prepareAgentProposal({...scenario,co2_enabled:'true'},search,run,context));
 assert.throws(()=>prepareAgentProposal(scenario,{},run,context));
});
