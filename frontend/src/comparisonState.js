const same = (a,b) => JSON.stringify(Object.entries(a || {}).sort()) === JSON.stringify(Object.entries(b || {}).sort());
export function comparisonState(comparison, current, result) {
 if (!comparison) return {applied:false,stale:false};
 const {scenario:original,...bounds}=comparison.search_request;
 const {scenario:inputs,...currentBounds}=current;
 const searchMatches=same(bounds,currentBounds);
 const applied=Boolean(comparison.optimized && result && same(result.request,comparison.optimized.request) && same(inputs,comparison.optimized.request) && searchMatches);
 return {applied,stale:!applied && !(same(original,inputs)&&searchMatches)};
}
