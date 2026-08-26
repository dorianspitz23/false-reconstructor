/**
 * Which family does an invented word look like it belongs to?
 *
 * English has two vocabularies wearing one coat: a Germanic core and a Latinate
 * overlay that arrived after 1066. They are spelled differently enough that the
 * shape of a made-up word is usually a strong hint, which is what this scores.
 *
 * Real words do the same thing to us — nobody has to be told that `strength` is
 * native and `precipitation` is borrowed.
 */

import { normalize } from './g2p'
import type { Lineage } from './types'

interface Cue {
  test: RegExp
  weight: number
  /** Phrased to slot into "…because it {label}". */
  label: string
}

const ROMANCE_CUES: Cue[] = [
  { test: /(tion|sion)$/, weight: 6, label: 'ends in -tion' },
  { test: /(ment|ance|ence|ity|ify|able|ible)$/, weight: 5, label: 'takes a Latinate suffix' },
  { test: /(ous|ive|ate|ure|age|ary|ist|ism)$/, weight: 4, label: 'takes a Latinate suffix' },
  { test: /(ant|ent|or|al)$/, weight: 2, label: 'takes a Latinate suffix' },
  { test: /^(pre|con|com|trans|inter|super|contra)/, weight: 4, label: 'takes a Latinate prefix' },
  { test: /^(de|re|sub|pro|dis|ex|ad)[bcdfgklmnprstv]/, weight: 2, label: 'takes a Latinate prefix' },
  { test: /que$/, weight: 4, label: 'ends in -que' },
  { test: /ph/, weight: 3, label: 'contains ph' },
  { test: /[aeiou][bcdfgklmnprstv][aeiou][bcdfgklmnprstv][aeiou]/, weight: 2, label: 'has the long, open-syllabled shape of a borrowing' },
]

const GERMANIC_CUES: Cue[] = [
  { test: /^(kn|wr|gn)/, weight: 6, label: 'opens with a cluster only native words keep' },
  { test: /(ght|gh)/, weight: 5, label: 'contains gh' },
  { test: /(tch|dge)/, weight: 4, label: 'contains tch or dge' },
  { test: /^(th|wh|sh)/, weight: 4, label: 'opens with th, wh or sh' },
  { test: /^(sw|tw|dw|sl|sm|sn|sp|st|sk|sc|str|thr|shr)/, weight: 3, label: 'opens with a Germanic cluster' },
  { test: /ck/, weight: 3, label: 'contains ck' },
  { test: /(ng|nk)$/, weight: 3, label: 'ends in -ng or -nk' },
  { test: /w/, weight: 2, label: 'contains w' },
  { test: /^[bcdfgklmnprstvw]{1,3}[aeiouy]{1,2}[bcdfgklmnprstvw]{1,3}e?$/, weight: 4, label: 'has the short, closed shape of a native word' },
]

export interface Classification {
  lineage: Lineage
  reason: string
  /** 0–1; how lopsided the evidence was. */
  strength: number
}

export function classify(input: string): Classification {
  const w = normalize(input)

  const hit = (cues: Cue[]) => cues.filter((c) => c.test.test(w))
  const score = (cues: Cue[]) => hit(cues).reduce((sum, c) => sum + c.weight, 0)

  const romance = score(ROMANCE_CUES)
  const germanic = score(GERMANIC_CUES)

  // Ties and blanks go Germanic: it is the older layer and the default for
  // anything that does not actively look borrowed.
  const lineage: Lineage = romance > germanic ? 'romance' : 'germanic'
  const winners = hit(lineage === 'romance' ? ROMANCE_CUES : GERMANIC_CUES)

  const total = romance + germanic
  const strength = total === 0 ? 0 : Math.abs(romance - germanic) / total

  const labels = [...new Set(winners.map((c) => c.label))].slice(0, 2)
  const family = lineage === 'romance' ? 'Latinate' : 'Germanic'

  const reason =
    labels.length === 0
      ? `Nothing in the spelling points either way, so it is treated as ${family} — the older layer, and English's default.`
      : `Looks ${family} because it ${labels.join(' and ')}.`

  return { lineage, reason, strength }
}
