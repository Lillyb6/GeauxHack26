export default function EvidenceList({evidence, sources}) {
  return <ul>{Object.entries(evidence).map(([key,p])=><li key={key}>
    <strong>{key.replaceAll('_',' ')}</strong>: {p.value == null ? 'Unknown' : String(p.value)} {p.unit || ''} · {p.classification.replaceAll('_',' ')}
    <br/>{p.note} {p.source_ids.map(id=><a key={id} href={sources[id].url} target="_blank" rel="noreferrer">{sources[id].title} ↗ </a>)}
  </li>)}</ul>;
}
