import { ElogHit } from '../api/client'

interface Props {
  hits: ElogHit[]
}

function ElogPanel({ hits }: Props) {
  return (
    <section className="elog-band">
      <div className="band-title">Synthetic eLog Memory</div>
      <div className="elog-list">
        {hits.map((hit) => (
          <article key={`${hit.date}-${hit.title}`} className="elog-item">
            <div className="elog-meta">
              <span>{hit.date}</span>
              <strong>{hit.similarity.toFixed(2)}</strong>
            </div>
            <h3>{hit.title}</h3>
            <p>{hit.recommended_action}</p>
            <div className="tag-row">
              {hit.risk_tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default ElogPanel
