import { useCallback, useEffect, useMemo, useState } from 'react'
import { reconstruct } from './engine'
import type { Lineage, Reconstruction } from './engine'
import { coinWord } from './ui/coin'
import { StageCard } from './ui/StageCard'

const EXAMPLES = ['flarn', 'sprockle', 'knurst', 'thwaggle', 'prolation']

function readUrl(): { word: string; lineage?: Lineage } {
  const params = new URLSearchParams(window.location.search)
  const lineage = params.get('l')
  return {
    word: params.get('w') ?? '',
    lineage: lineage === 'germanic' || lineage === 'romance' ? lineage : undefined,
  }
}

export default function App() {
  const initial = useMemo(readUrl, [])
  const [draft, setDraft] = useState(initial.word)
  const [query, setQuery] = useState(initial.word)
  const [override, setOverride] = useState<Lineage | undefined>(initial.lineage)

  const result = useMemo<{ data?: Reconstruction; error?: string }>(() => {
    if (!query.trim()) return {}
    try {
      return { data: reconstruct(query, override) }
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Something went wrong.' }
    }
  }, [query, override])

  // Keep the address bar in step so any derivation can be linked to.
  useEffect(() => {
    const params = new URLSearchParams()
    if (query) params.set('w', query)
    if (override) params.set('l', override)
    const next = params.toString()
    window.history.replaceState(null, '', next ? `?${next}` : window.location.pathname)
  }, [query, override])

  const submit = useCallback((word: string, lineage?: Lineage) => {
    setDraft(word)
    setQuery(word)
    setOverride(lineage)
  }, [])

  const data = result.data

  return (
    <div className="leaf">
      <header className="masthead">
        <h1>
          False{' '}
          <span className="titleword">
            <span className="versal">*</span>Reconstructor
          </span>
        </h1>
        <p className="standfirst">
          Type a word English never had. Real historical sound laws run backwards through it —
          Middle English, Old English, Proto-Germanic, all the way to Proto-Indo-European.
        </p>
        <p className="colophon-note">
          No language model anywhere. Sound change is regular, so this is 126 rewrite rules applied
          in order. The same word always gives the same answer.
        </p>
      </header>

      <form
        className="quill"
        onSubmit={(e) => {
          e.preventDefault()
          submit(draft.trim(), override)
        }}
      >
        <label htmlFor="word">A word English never had</label>
        <div className="quill-row">
          <input
            id="word"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="flarn"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            maxLength={24}
          />
          <button type="submit" className="primary">
            Reconstruct
          </button>
          <button type="button" onClick={() => submit(coinWord(), undefined)}>
            Coin one
          </button>
        </div>
      </form>

      {!query && !result.error && (
        <section className="unwritten">
          <p>
            Anything will do, so long as it isn&rsquo;t already a word. The engine has no dictionary
            — it works entirely from the shape of what you type.
          </p>
          <ul>
            {EXAMPLES.map((w) => (
              <li key={w}>
                <button type="button" onClick={() => submit(w, undefined)}>
                  {w}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.error && (
        <p className="scribal-error" role="alert">
          {result.error}
        </p>
      )}

      {data && (
        <main>
          <div className="attribution">
            <p>{data.lineageReason}</p>
            <div className="hand" role="group" aria-label="Lineage">
              {(['germanic', 'romance'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  className={data.lineage === l ? 'on' : ''}
                  aria-pressed={data.lineage === l}
                  onClick={() => submit(query, l)}
                >
                  {l === 'germanic' ? 'Germanic' : 'Latinate'}
                </button>
              ))}
            </div>
          </div>

          <ol className="column">
            {data.stages.map((s, i) => (
              <StageCard key={s.stage.id} result={s} index={i} />
            ))}
          </ol>

          <p className="explicit">
            Thus <em>{data.input}</em>, had it ever been said.
          </p>
        </main>
      )}

      <footer className="foot">
        <a href="https://github.com/dorianspitz23/false-reconstructor">Source on GitHub</a>
        <span aria-hidden="true">·</span>
        <span>MIT licensed</span>
        <span aria-hidden="true">·</span>
        <span>
          From an idea on{' '}
          <a href="https://www.reddit.com/r/SomebodyMakeThis/comments/1vq0snc/false_reconstructor/">
            r/SomebodyMakeThis
          </a>
        </span>
      </footer>
    </div>
  )
}
