import test from 'node:test';
import assert from 'node:assert/strict';
import {availableResultMetric,co2ChartState} from './simulationDisplay.js';
test('CO2 selection falls back after a new run disables screening',()=>{
 assert.equal(availableResultMetric({request:{co2_enabled:false}},'co2_hour_average_mmhg'),'water_kg');
 assert.equal(availableResultMetric({request:{co2_enabled:true}},'co2_hour_average_mmhg'),'co2_hour_average_mmhg');
});
test('before-launch failure has initial CO2 but no fabricated hourly average',()=>{
 const r={request:{co2_enabled:true},readings:[{co2_mmhg:.4,co2_hour_average_mmhg:null}]};
 assert.deepEqual(co2ChartState(r),{status:'initial_only',initial:.4});
});
test('zero is a valid CO2 hourly reading, not missing data',()=>{
 assert.equal(co2ChartState({request:{co2_enabled:true},readings:[{co2_mmhg:0,co2_hour_average_mmhg:0}]}).status,'hourly');
 assert.equal(co2ChartState({request:{co2_enabled:false}}).status,'disabled');
});
