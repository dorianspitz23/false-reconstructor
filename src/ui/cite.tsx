import type { ReactNode } from 'react'

/**
 * The engine's prose marks cited forms with backticks — `cnīht`, `flōrem` —
 * the same convention the source comments and the README use. Rendered as
 * plain text those backticks landed on the page verbatim, which is raw markup
 * leaking into finished prose.
 *
 * Scholarly typography sets a cited form in italic, and flips it to roman
 * wherever the surrounding run is already italic. The stylesheet does the flip;
 * this only has to mark the spans.
 */
export function cite(text: string): ReactNode[] {
  return text
    .split('`')
    .map((part, i) =>
      i % 2 === 1 ? (
        <i className="cited" key={i}>
          {part}
        </i>
      ) : (
        part
      ),
    )
}
