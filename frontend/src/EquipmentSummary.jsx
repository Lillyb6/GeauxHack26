const display = value => value == null ? 'Unknown' : Number(value).toLocaleString(undefined, {maximumFractionDigits:3});

export default function EquipmentSummary({equipment, title = 'Equipment evaluated'}) {
  return <section className="equipment-summary">
    <h3>{title}</h3>
    <p>{equipment.name} · {equipment.quantity} unit(s)</p>
    <dl className="equipment-specs">
      <div><dt>Total oxygen output</dt><dd>{display(equipment.oxygen_output_kg_day)} kg/day</dd></div>
      <div><dt>Total equipment power</dt><dd>{display(equipment.electrical_power_kw)} kW</dd></div>
      <div><dt>Known equipment hardware mass</dt><dd>{equipment.known_hardware_mass_kg == null ? 'Unknown' : `${display(equipment.known_hardware_mass_kg)} kg`}</dd></div>
      <div><dt>Planetary operating envelope</dt><dd>Not validated</dd></div>
    </dl>
    <details><summary>Sources & limitations</summary><p>Evidence: {equipment.evidence_status.replaceAll('_',' ')}. Hardware mass excludes the rest of the habitat and supporting infrastructure.</p>
    <a href={equipment.source.url} target="_blank" rel="noreferrer">{equipment.source.title} ↗</a>
    <p>{equipment.source.location} · Published {equipment.source.publication_date}</p>
    <ul>{equipment.limitations.map(note=><li key={note}>{note}</li>)}</ul></details>
  </section>;
}
