import { useState } from 'react'
import type { StageResult } from '../engine'

interface Props {
  result: StageResult
  first: boolean
}

export function StageCard({ result, first }: Props) {
  const [open, setOpen] = useState(false)
  const { stage, form, ipa, applied, ambiguities } = result

  return (
    <li className={`stage ${first ? 'is-modern' : ''}`}>
      <div className="rail" aria-hidden="true">
        <span className="dot" style={{ opacity: 0.35 + stage.confidence * 0.65 }} />
      </div>

      <div className="body">
        <div className="meta">
          <span className="name">{stage.name}</span>
          <span className="period">{stage.period}</span>
          {stage.reconstructed && <span className="tag">reconstructed</span>}
        </div>

        <p className="form" style={{ opacity: 0.55 + stage.confidence * 0.45 }}>
          {form}
        </p>
        <p className="ipa">/{ipa}/</p>
        <p className="blurb">{stage.blurb}</p>

        {applied.length > 0 && (
          <div className="changes">
            <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}>
              {open ? '−' : '+'} {applied.length} sound {applied.length === 1 ? 'change' : 'changes'}
            </button>

            {open && (
              <ol className="trace">
                {applied.map((c, i) => (
                  <li key={`${c.id}-${i}`}>
                    <span className="law">{c.name}</span>
                    <span className="step">
                      <span className="from">{c.before}</span>
                      <span className="arrow">←</span>
                      <span className="to">{c.after}</span>
                    </span>
                    {c.note && <span className="note">{c.note}</span>}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {ambiguities.length > 0 && (
          <ul className="ambiguities">
            {ambiguities.map((a) => (
              <li key={a.name}>
                <span className="alt-name">{a.name}</span>
                <span className="alt-form">{a.alternative}</span>
                <span className="alt-reason">{a.reason}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}
