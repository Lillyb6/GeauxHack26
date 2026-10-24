import {equipmentLabel} from './equipmentLabels';
const display = value => value == null ? 'Unknown' : Number(value).toLocaleString(undefined, {maximumFractionDigits:3});

export default function EquipmentSummary({equipment, title = 'Equipment evaluated'}) {
  return <section className="equipment-summary">
    <h3>{title}</h3>
    <p>{equipmentLabel(equipment)} · {equipment.quantity} unit(s)</p>
    <dl className="equipment-specs">
      <div><dt>Oxygen made per day</dt><dd>{display(equipment.oxygen_output_kg_day)} kg/day</dd></div>
      <div><dt>Electricity needed</dt><dd>{display(equipment.electrical_power_kw)} kW</dd></div>
      <div><dt>Equipment weight</dt><dd>{equipment.known_hardware_mass_kg == null ? 'Unknown' : `${display(equipment.known_hardware_mass_kg)} kg`}</dd></div>
      <div><dt>Tested on this planet?</dt><dd>Not established</dd></div>
    </dl>
    <details><summary>Where these numbers come from</summary><p><strong>Original equipment:</strong> {equipment.name}</p><p>Evidence: {equipment.evidence_status.replaceAll('_',' ')}. Hardware mass excludes the rest of the habitat and supporting infrastructure.</p>
    <a href={equipment.source.url} target="_blank" rel="noreferrer">{equipment.source.title} ↗</a>
    <p>{equipment.source.location} · Published {equipment.source.publication_date}</p>
    <ul>{equipment.limitations.map(note=><li key={note}>{note}</li>)}</ul></details>
  </section>;
}
