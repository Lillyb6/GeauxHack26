const names = {
 crew_size:'People on the mission', duration_days:'Mission length',
 oxygen_kg:'Starting oxygen supply', water_kg:'Starting water supply',
 battery_kwh:'Battery storage', generation_kw:'Power available',
 oxygen_capacity_kg_day:'Oxygen made each day', recycling_fraction:'Share of water reused',
 other_load_kw:'Power for other equipment', recycler_power_kw:'Water recycler power',
 electrolyzer_kwh_kg_oxygen:'Energy needed to make oxygen',
 heat_loss_kw_k:'Heat transfer through the habitat', interior_temperature_c:'Target indoor temperature',
 hvac_cop:'Heating/cooling efficiency',
};
export default function FieldLabel({field, technical}) {
 return <><span>{names[field] || technical}</span><small className="field-technical">{technical}</small>
 {field==='recycling_fraction' && <small className="field-help">Enter 0.93 for 93%.</small>}
 {field==='heat_loss_kw_k' && <small className="field-help">Higher values mean more heat transfer.</small>}
 {field==='hvac_cop' && <small className="field-help">COP 2 delivers 2 kW of heating/cooling per 1 kW of electricity under the assumed conditions.</small>}</>;
}
