import {createMission} from './missionStorage.js';

// Agent search proposals also contain catalog IDs. Those belong to the scenario,
// not the four search controls accepted by mission storage and the next Run.
export function prepareAgentProposal(scenario, proposedSearch, evaluated, context, name) {
 if(!evaluated?.resource_balance_complete || evaluated.events?.length)throw new Error('The AI proposal has no passing evaluated simulation. Test the goal again.');
 const search=Object.fromEntries(Object.keys(context.searchDefaults).map(key=>[key,proposedSearch?.[key]]));
 const document=createMission(name?.trim() || 'AI mission',scenario,search,context);
 const normalized=document.configuration.scenario;
 if(Object.keys(normalized).some(key=>normalized[key]!==evaluated.request?.[key]) || Object.keys(evaluated.request || {}).length!==Object.keys(normalized).length)throw new Error('The AI settings do not match the tested simulation. Test the goal again.');
 return {document,scenario:normalized,search:document.configuration.search,result:evaluated};
}
