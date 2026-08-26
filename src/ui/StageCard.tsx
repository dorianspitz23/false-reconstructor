import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { StageResult } from '../engine'

interface Props {
  result: StageResult
  index: number
}

/**
 * One entry in the ruled column.
 *
 * The layout follows manuscript apparatus rather than card conventions: the date
 * sits in the margin the way a running head did, the paraph mark opens the
 * entry, and disagreements in the scholarship hang off the side as a glossed
 * note with a manicule — the pointing hand a medieval reader drew when they
 * wanted to flag a passage.
 */
export function StageCard({ result, index }: Props) {
  const [open, setOpen] = useState(false)
  const { stage, form, ipa, applied, ambiguities } = result

  // Paraph marks alternated red and blue down a manuscript page. Keeping that
  // alternation gives the column a pulse as the eye travels backwards in time.
  const ink = index % 2 === 0 ? 'vermilion' : 'ultramarine'

  return (
    <li className="entry" style={{ '--i': index } as CSSProperties}>
      <p className="marginal-date">{stage.period}</p>

      <div className="bounding" aria-hidden="true" />

      <div className="written">
        <h2 className="rubric">
          <span className={`paraph ${ink}`} aria-hidden="true">
            ¶
          </span>
          {stage.name}
          {stage.reconstructed && <em className="unattested"> unattested</em>}
        </h2>

        {/* Gold is reserved for the asterisk — the mark for a form nobody ever
            wrote down. Split it off so the metal lands only on the mark. */}
        <p className="form">
          {stage.reconstructed && form.startsWith('*') ? (
            <>
              <span className="versal">*</span>
              {form.slice(1)}
            </>
          ) : (
            form
          )}
        </p>
        <p className="ipa">/{ipa}/</p>
        <p className="blurb">{stage.blurb}</p>

        {applied.length > 0 && (
          <div className="changes">
            <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}>
              {applied.length} sound {applied.length === 1 ? 'change' : 'changes'}
            </button>

            {open && (
              <ol className="trace">
                {applied.map((c, i) => (
                  <li key={`${c.id}-${i}`}>
                    <h3>{c.name}</h3>
                    <p className="step">
                      <span>{c.after}</span>
                      <span className="whence" aria-hidden="true">
                        ⟵
                      </span>
                      <span className="whence-label">from</span>
                      <span>{c.before}</span>
                    </p>
                    {c.note && <p className="note">{c.note}</p>}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {ambiguities.map((a) => (
          <aside className="gloss" key={a.name}>
            <span className="manicule" aria-hidden="true">
              ☞
            </span>
            <h3>{a.name}</h3>
            <p className="gloss-form">{a.alternative}</p>
            <p className="gloss-reason">{a.reason}</p>
          </aside>
        ))}
      </div>
    </li>
  )
}
