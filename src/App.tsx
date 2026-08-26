import { useCallback, useEffect, useMemo, useState } from 'react'
import { reconstruct } from './engine'
import type { Lineage, Reconstruction } from './engine'
import { coinWord } from './ui/coin'
import { StageCard } from './ui/StageCard'

const EXAMPLES = ['flarn', 'sprockle', 'knurst', 'thwaggle', 'blorth', 'prolation']

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

  const submit = useCallback(
    (word: string, lineage?: Lineage) => {
      setDraft(word)
      setQuery(word)
      setOverride(lineage)
    },
    [],
  )

  const data = result.data

  return (
    <div className="page">
      <header className="masthead">
        <h1>
          False <span className="star">*</span>Reconstructor
        </h1>
        <p className="standfirst">
          Type a word English never had. Real historical sound laws run backwards through it —
          Middle English, Old English, Proto-Germanic, all the way to Proto-Indo-European.
        </p>
        <p className="disclaimer">
          No AI, no guessing. Just the comparative method in reverse, so the same word always gives
          the same answer.
        </p>
      </header>

      <form
        className="search"
        onSubmit={(e) => {
          e.preventDefault()
          submit(draft.trim(), override)
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="flarn"
          aria-label="A word that doesn't exist"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={24}
        />
        <button type="submit" className="go">
          Reconstruct
        </button>
        <button
          type="button"
          className="dice"
          onClick={() => submit(coinWord(), undefined)}
          title="Coin a word for me"
        >
          Coin one
        </button>
      </form>

      {!query && (
        <div className="examples">
          <span>Try</span>
          {EXAMPLES.map((w) => (
            <button key={w} type="button" onClick={() => submit(w, undefined)}>
              {w}
            </button>
          ))}
        </div>
      )}

      {result.error && <p className="error">{result.error}</p>}

      {data && (
        <main>
          <div className="lineage">
            <p className="reason">{data.lineageReason}</p>
            <div className="toggle" role="group" aria-label="Lineage">
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

          <ol className="timeline">
            {data.stages.map((s, i) => (
              <StageCard key={s.stage.id} result={s} first={i === 0} />
            ))}
          </ol>

          <footer className="coda">
            <p>
              Every form below the first is what <em>{data.input}</em> would have looked like, if it
              had been there all along.
            </p>
          </footer>
        </main>
      )}

      <footer className="colophon">
        <a href="https://github.com/dorianspitz23/false-reconstructor">Source on GitHub</a>
        <span>·</span>
        <span>MIT licensed</span>
        <span>·</span>
        <span>
          Built from an idea on{' '}
          <a href="https://www.reddit.com/r/SomebodyMakeThis/comments/1vq0snc/false_reconstructor/">
            r/SomebodyMakeThis
          </a>
        </span>
      </footer>
    </div>
  )
}
