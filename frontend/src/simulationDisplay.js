export function availableResultMetric(result,requested){
 const fields=['water_kg','oxygen_kg','battery_kwh','wastewater_kg'];
 if(result?.request.co2_enabled)fields.push('co2_hour_average_mmhg');
 return fields.includes(requested)?requested:'water_kg';
}
export function co2ChartState(result){
 if(!result?.request.co2_enabled)return {status:'disabled'};
 const readings=result.readings??[];
 const hasAverage=readings.some(r=>Number.isFinite(r.co2_hour_average_mmhg));
 return {status:hasAverage?'hourly':'initial_only',initial:readings[0]?.co2_mmhg??result.request.initial_co2_mmhg};
}
