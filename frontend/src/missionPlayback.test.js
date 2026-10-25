import test from 'node:test';
import assert from 'node:assert/strict';
import {playbackFrames,playbackDelay} from './missionPlayback.js';
function result(hours,events=[]){return {evaluated_hours:hours,events,readings:Array.from({length:hours+1},(_,hour)=>({hour,water_kg:300-hour}))};}
test('playback retains the exact first failed hour, including a partial day',()=>{
 const frames=playbackFrames(result(73,[{hour:73,resource:'water'}]));
 assert.deepEqual(frames.map(f=>f.reading.hour),[0,24,48,72,73]);
 assert.equal(frames.at(-1).day,4);
});
test('hour-zero constraints are shown before launch',()=>{
 const frames=playbackFrames(result(0,[{hour:0,resource:'thermal'}]));
 assert.equal(frames.length,1);assert.equal(frames[0].day,0);
});
test('long missions retain each day and fit the active playback budget',()=>{
 const frames=playbackFrames(result(180*24));
 assert.equal(frames.length,181);assert.equal(frames.at(-1).reading.hour,4320);
 assert.ok(playbackDelay(frames.length)*(frames.length-1)+650<10000);
});
test('short missions are readable and empty results are safe',()=>{
 assert.equal(playbackDelay(4),1100);assert.deepEqual(playbackFrames(null),[]);
});
