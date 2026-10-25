import {equipmentLabel} from './equipmentLabels';
export default function MissionBuildSummary({form,name,destination,equipment}){
 const design=prefix=>{const id=form[`${prefix}_equipment_id`];return id?`${equipmentLabel(equipment.find(item=>item.id===id))} · ${form[`${prefix}_equipment_quantity`]} unit(s)`:'Custom configuration';};
 const checks=[form.thermal_capacity_enabled?'Thermal':null,form.atmosphere_enabled?'Cabin atmosphere':null,form.co2_enabled?'CO₂':null].filter(Boolean);
 const groups=[['Starting supplies',[['Oxygen',`${form.oxygen_kg} kg`],['Clean water',`${form.water_kg} kg`],['Battery charge',`${form.battery_kwh} kWh`]]],['Life support',[['Generation',`${form.generation_kw} kW`],['Oxygen system',design('oxygen')],['Water system',design('water')],['Additional checks',checks.join(', ')||'Off']]]];
 return <div className="mission-build-summary"><div className="build-summary-line"><span>Mission</span><strong>{destination} · {form.crew_size} crew · {form.duration_days} Earth days</strong></div>{groups.map(([title,rows])=><section className="build-summary-group" key={title}><h3>{title}</h3><dl>{rows.map(([label,value])=><div className="build-summary-line" key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>)}</div>;
}
