export function playbackFrames(result) {
 if (!result?.readings?.length) return [];
 const failure=result.events?.length?Math.min(...result.events.map(e=>e.hour)):null;
 const end=failure??result.evaluated_hours;
 const frames=[{day:end===0?0:1,reading:result.readings[0]}];
 for(let day=1;day<=Math.ceil(end/24);day++){
  const hour=Math.min(day*24,end);
  const reading=result.readings.find(r=>r.hour===hour)??result.readings.filter(r=>r.hour<=hour).at(-1);
  frames.push({day,reading});
 }
 return frames;
}
export function playbackDelay(frameCount){return Math.min(1100,9000/Math.max(1,frameCount-1));}
export const endings={
 water:['Water depleted. Everyone died of thirst.','Bring more water or improve recycling capacity and recovery.'],
 oxygen:['Oxygen depleted. The crew ran out of air.','Increase oxygen stores or generation. Check water and power demand.'],
 power:['Power lost. Life support went dark.','Increase generation or battery storage, or reduce demand.'],
 thermal:['Temperature control failed. The habitat could not hold its target.','Increase heating or cooling capacity, or improve insulation.'],
 cabin_pressure:['Cabin pressure failed its screening. Launch was stopped.','Adjust cabin pressure and recheck the oxygen mix.'],
 inspired_oxygen:['The oxygen mix failed its screening. Launch was stopped.','Adjust pressure and oxygen percentage together.'],
 inert_diluent:['Inert gas balance failed its screening. Launch was stopped.','Increase the inert gas share and recheck inspired oxygen.'],
 co2:['CO₂ buildup overwhelmed the cabin. The mission was lost.','Increase CO₂ removal capacity or reduce crew size.'],
};
