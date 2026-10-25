import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

export default function ComparisonGraphs({comparison,active=true}) {
 const [metric,setMetric]=useState('water_kg');
 const {manual,optimized}=comparison;
 const series=useMemo(()=>{
   if(!optimized) return [];
   return Array.from({length:Math.max(manual.readings.length,optimized.readings.length)},(_,hour)=>({
      hour,manual:manual.readings[hour]?.[metric] ?? null,optimized:optimized.readings[hour]?.[metric] ?? null,
   }));
 },[manual,optimized,metric]);
 if(!optimized)return null;
 return <>    <section className="panel comparison-graphs"><h3>Manual vs optimized</h3><label className="chart-selector" htmlFor="comparison_metric">Compare inventory<select id="comparison_metric" value={metric} onChange={e=>setMetric(e.target.value)}><option value="water_kg">Usable water · kg</option><option value="oxygen_kg">Oxygen · kg</option><option value="battery_kwh">Battery · kWh</option><option value="wastewater_kg">Waiting wastewater · kg</option>{manual.request.co2_enabled&&<option value="co2_hour_average_mmhg">Cabin CO₂ · hourly mean mmHg</option>}</select></label>
   {active&&<div role="img" aria-label="Manual and optimized inventory over simulated hours" style={{height:240}}><ResponsiveContainer width="100%" height="100%"><LineChart data={series}><CartesianGrid stroke="#233445" strokeDasharray="3 5"/><XAxis dataKey="hour" stroke="#99aabd" minTickGap={35}/><YAxis stroke="#99aabd" width={55}/><Tooltip contentStyle={{background:'#12202d',border:'1px solid #375166'}}/><Legend/>{metric==='co2_hour_average_mmhg'&&<ReferenceLine y={3} stroke="#f38b91" strokeDasharray="4 4" label={{value:'3 mmHg screening',fill:'#f38b91',position:'insideTopRight'}}/>}<Line name="Manual" dataKey="manual" stroke="#eab676" dot={false} connectNulls={false} isAnimationActive={false}/><Line name="Optimized" dataKey="optimized" stroke="#73d9c5" dot={false} connectNulls={false} isAnimationActive={false}/></LineChart></ResponsiveContainer></div>}
   <p>Lines stop when their simulation stops; values are not extended past a failed run.</p></section> </>;
}
