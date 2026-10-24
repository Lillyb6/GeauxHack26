import {equipmentLabel} from './equipmentLabels';
const number = value => value == null ? 'Unknown' : Number(value).toLocaleString(undefined,{maximumFractionDigits:3});
export default function WaterEquipmentSummary({equipment, title='Water equipment evaluated'}) {
 return <section className="equipment-summary"><h3>{title}</h3><p>{equipmentLabel(equipment)} · {equipment.quantity} unit(s)</p>
  <dl className="equipment-specs">
   <div><dt>Water processed per day</dt><dd>{number(equipment.feed_capacity_kg_day)} kg/day</dd></div>
   <div><dt>Water recovered (assumed)</dt><dd>{number(equipment.recovery_fraction*100)}%</dd></div>
   <div><dt>Electricity needed</dt><dd>{number(equipment.electrical_power_kw)} kW</dd></div>
   <div><dt>Equipment weight</dt><dd>{equipment.known_hardware_mass_kg == null ? 'Unknown' : `${number(equipment.known_hardware_mass_kg)} kg`}</dd></div>
  </dl><details><summary>Where these numbers come from</summary><p><strong>Original equipment:</strong> {equipment.name}</p><p>Historical feed/power/mass reference with an unvalidated 90% yield assumption. Yield applies only to processed feed; crew-wide recovery falls when wastewater exceeds the feed budget. Tested on this planet? is not validated.</p>
  <a href={equipment.source.url} target="_blank" rel="noreferrer">{equipment.source.title} ↗</a><p>{equipment.source.location}</p>
  <ul>{Object.entries(equipment.derivations || {}).map(([key,note])=><li key={key}>{note}</li>)}{equipment.limitations.map(note=><li key={note}>{note}</li>)}</ul></details>
 </section>;
}
