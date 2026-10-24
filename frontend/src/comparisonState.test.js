import test from 'node:test';
import assert from 'node:assert/strict';
import {comparisonState} from './comparisonState.js';
const original={crew_size:6,oxygen_equipment_quantity:1};
const optimized={request:{crew_size:6,oxygen_equipment_quantity:2}};
const bounds={max_oxygen_units:8,require_no_wastewater_backlog:true};
const comparison={search_request:{scenario:original,...bounds},optimized};
test('original inputs keep comparison current',()=>assert.deepEqual(comparisonState(comparison,{scenario:original,...bounds},null),{applied:false,stale:false}));
test('applied optimized run keeps original comparison current',()=>assert.deepEqual(comparisonState(comparison,{scenario:optimized.request,...bounds},optimized),{applied:true,stale:false}));
test('editing applied inputs makes comparison stale',()=>assert.deepEqual(comparisonState(comparison,{scenario:{...optimized.request,crew_size:7},...bounds},optimized),{applied:false,stale:true}));
test('changing search bounds prevents using prior optimized run',()=>assert.equal(comparisonState(comparison,{scenario:optimized.request,...bounds,max_oxygen_units:4},optimized).stale,true));
test('a different displayed run is not labeled applied',()=>assert.equal(comparisonState(comparison,{scenario:optimized.request,...bounds},{request:original}).applied,false));
test('absent or unsuccessful optimization cannot be applied',()=>{assert.deepEqual(comparisonState(null,{},null),{applied:false,stale:false});assert.equal(comparisonState({...comparison,optimized:null},{scenario:original,...bounds},null).applied,false);});

test("rerunning the same optimized inputs retains active state",()=>assert.equal(comparisonState(comparison,{scenario:optimized.request,...bounds},{...optimized}).applied,true));
